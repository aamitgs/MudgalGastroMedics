"use client";

import { CheckCircle2, Download, KeyRound, ShieldCheck, ShieldOff, UserRoundCog, UserRoundPlus, UsersRound, XCircle } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { roleMeta, staffLoginRoles, type AccessRole } from "@/lib/access/matrix";
import type { AccessUserSortField, ManagedUser } from "@/lib/access-user-query";
import { queryAccessUsers } from "@/lib/access-user-query";
import { downloadCsv } from "@/lib/table-export";
import { ActionButton } from "@/components/design-system/ActionButton";
import { DataTable } from "@/components/design-system/DataTable";
import { notify } from "@/lib/notify";

type Approval = {
  id: string;
  targetUserName: string;
  payload: { roles: AccessRole[]; defaultRole: AccessRole };
  requestedByName: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  decidedByName?: string;
};

type Credential = { name: string; username: string; roles: AccessRole[]; temporaryPassword: string };

const fieldClass = "min-h-9 w-full rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
const rowAction = "gap-1.5 bg-surface px-3 text-xs";
const rowsPerPage = 25;

const assignableRoles = staffLoginRoles.filter((role) => role !== "super-admin");

const userExportHeaders = ["Name", "Username", "Email", "Roles", "Default Role", "Status", "MFA", "Last Login"];

function userExportRow(user: ManagedUser) {
  return [
    user.name,
    user.username,
    user.email ?? "",
    user.roles.map((role) => roleMeta[role].label).join(" + "),
    roleMeta[user.defaultRole].label,
    user.status,
    user.totpEnabled ? "Enabled" : "Not set",
    formatDate(user.lastLoginAt)
  ];
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Never";
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [myUserId, setMyUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [managingUserId, setManagingUserId] = useState("");
  const [roleDraft, setRoleDraft] = useState<AccessRole[]>([]);
  const [defaultDraft, setDefaultDraft] = useState<AccessRole>("reception");

  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRoles, setNewRoles] = useState<AccessRole[]>([]);

  const [pageIndex, setPageIndex] = useState(0);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ManagedUser["status"] | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  const sortField = (sorting[0]?.id as AccessUserSortField | undefined) ?? "name";
  const sortDir = sorting[0]?.desc ? "desc" : "asc";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [meRes, usersRes, approvalsRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/access/users", { cache: "no-store" }),
        fetch("/api/access/approvals", { cache: "no-store" })
      ]);
      const me = await meRes.json().catch(() => ({}));
      setIsSuperAdmin(me?.activeRole === "super-admin");
      setMyUserId(me?.user?.id ?? "");

      const usersData = await usersRes.json().catch(() => ({}));
      if (!usersRes.ok || !usersData.ok) {
        setError(usersData.error || "Unable to load users.");
      } else {
        setUsers(usersData.users ?? []);
      }
      const approvalsData = await approvalsRes.json().catch(() => ({}));
      if (approvalsRes.ok && approvalsData.ok) setApprovals(approvalsData.approvals ?? []);
    } catch {
      setError("Unable to load access control data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      if (active) await load();
    })();
    return () => {
      active = false;
    };
  }, []);

  function updateGlobalFilter(value: string) {
    setGlobalFilter(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: ManagedUser["status"] | "") {
    setStatusFilter(value);
    setPageIndex(0);
  }

  const { users: pageRows, pageCount } = useMemo(
    () =>
      queryAccessUsers(users, {
        page: pageIndex,
        pageSize: rowsPerPage,
        sortBy: sortField,
        sortDir,
        query: globalFilter,
        status: statusFilter || undefined
      }),
    [users, pageIndex, sortField, sortDir, globalFilter, statusFilter]
  );

  async function operate(id: string, operation: string, extra: Record<string, unknown> = {}) {
    const response = await fetch("/api/access/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, operation, ...extra })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Operation failed.");
      return null;
    }
    await load();
    return data;
  }

  async function seedLaunchTeam() {
    setNotice("");
    const response = await fetch("/api/access/seed", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Seeding failed.");
      return;
    }
    setCredentials(data.credentials ?? []);
    setNotice(
      data.createdCount
        ? `Seeded ${data.createdCount} account(s). Temporary passwords are shown ONCE below — hand each one over individually and securely, then refresh to clear them from the screen.`
        : "All launch-team accounts already exist; nothing was created."
    );
    await load();
  }

  async function createUser(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/access/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, username: newUsername, roles: newRoles, defaultRole: newRoles[0] })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Could not create user.");
      return;
    }
    setCredentials([{ name: data.user.name, username: data.user.username, roles: data.user.roles, temporaryPassword: data.temporaryPassword }]);
    setNotice("User created. The temporary password below is shown ONCE — share it securely.");
    setNewName("");
    setNewUsername("");
    setNewRoles([]);
    await load();
  }

  async function decideApproval(id: string, decision: "approved" | "rejected") {
    const response = await fetch("/api/access/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      notify.error(data.error || "Decision failed.");
      return;
    }
    await load();
  }

  function toggleRole(list: AccessRole[], role: AccessRole) {
    return list.includes(role) ? list.filter((item) => item !== role) : [...list, role];
  }

  const pendingApprovals = approvals.filter((approval) => approval.status === "pending");
  const managingUser = users.find((user) => user.id === managingUserId) ?? null;

  function openManage(user: ManagedUser) {
    setManagingUserId((current) => (current === user.id ? "" : user.id));
    setRoleDraft(user.roles);
    setDefaultDraft(user.defaultRole);
  }

  const columns = useMemo<ColumnDef<ManagedUser, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 190,
        cell: ({ row }) => (
          <div>
            <p className="font-bold text-ink">
              {row.original.name}
              {row.original.status === "suspended" ? <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900 dark:text-red-300">Suspended</span> : null}
              {row.original.mustChangePassword ? <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-300">Temp password</span> : null}
            </p>
            <p className="text-xs font-semibold text-muted">@{row.original.username}</p>
          </div>
        )
      },
      {
        id: "roles",
        header: "Roles",
        size: 200,
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted">{row.original.roles.map((role) => (role === row.original.defaultRole ? `${roleMeta[role].label} (default)` : roleMeta[role].label)).join(" + ")}</span>
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 100,
        cell: ({ row }) => (
          <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${row.original.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300" : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"}`}>
            {row.original.status}
          </span>
        )
      },
      { id: "mfa", header: "MFA", size: 100, enableSorting: false, cell: ({ row }) => (row.original.totpEnabled ? "Enabled" : "Not set") },
      { accessorKey: "lastLoginAt", header: "Last Login", size: 160, cell: ({ row }) => <span className="text-muted">{formatDate(row.original.lastLoginAt)}</span> },
      {
        id: "actions",
        header: "",
        size: 100,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <ActionButton variant="secondary" size="sm" onClick={() => openManage(row.original)} aria-expanded={managingUserId === row.original.id}>
            <UserRoundCog size={13} /> Manage
          </ActionButton>
        )
      }
    ],
    [managingUserId]
  );

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Access Control</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Users, roles &amp; approvals</h2>
        </div>
        <ActionButton variant="secondary" onClick={() => void seedLaunchTeam()} disabled={!isSuperAdmin}>
          <UsersRound size={17} /> Seed Launch Team
        </ActionButton>
      </div>

      {!isSuperAdmin ? (
        <p className="border-b border-line bg-soft/60 p-4 text-sm font-semibold text-muted">
          Viewing only — user creation, role changes, suspensions and password resets require an active Super Admin session.
        </p>
      ) : null}

      {/* Success/status confirmations here (unlike other modules) stay as a
          persistent inline banner rather than an auto-dismissing toast: some
          carry security-critical instructions ("shown ONCE", "all sessions
          revoked") an admin needs time to read and act on, not a 3-second
          notification. Failures still route through notify.error(). */}
      {notice ? <p className="border-b border-line bg-emerald-50 dark:bg-emerald-950 p-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{notice}</p> : null}

      {credentials.length ? (
        <div className="border-b border-line bg-amber-50 dark:bg-amber-950 p-4">
          <p className="text-sm font-black uppercase tracking-[0.12em] text-amber-800 dark:text-amber-200">One-time credentials — do not store</p>
          <div className="mt-3 grid gap-2">
            {credentials.map((credential) => (
              <p key={credential.username} className="font-mono text-sm text-amber-900 dark:text-amber-100">
                {credential.name} | {credential.roles.map((role) => roleMeta[role].label).join(" + ")} | {credential.username} | {credential.temporaryPassword}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {pendingApprovals.length ? (
        <div className="border-b border-line p-4">
          <p className="text-sm font-bold text-ink">Pending role-change approvals (two-person rule)</p>
          <div className="mt-3 grid gap-3">
            {pendingApprovals.map((approval) => (
              <div key={approval.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-amber-300 bg-amber-50/60 p-3 dark:border-amber-800 dark:bg-amber-950/60">
                <p className="text-sm text-ink">
                  <span className="font-bold">{approval.targetUserName}</span> → {approval.payload.roles.map((role) => roleMeta[role].label).join(" + ")}
                  <span className="text-muted"> (requested by {approval.requestedByName})</span>
                </p>
                <div className="flex gap-2">
                  <ActionButton variant="secondary" className={rowAction} onClick={() => void decideApproval(approval.id, "approved")} disabled={!isSuperAdmin}>
                    <CheckCircle2 size={14} /> Approve
                  </ActionButton>
                  <ActionButton variant="secondary" className={rowAction} onClick={() => void decideApproval(approval.id, "rejected")} disabled={!isSuperAdmin}>
                    <XCircle size={14} /> Reject
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="p-4">
        <DataTable
          columns={columns}
          data={pageRows}
          getRowId={(user) => user.id}
          pageIndex={pageIndex}
          pageCount={pageCount}
          onPageChange={setPageIndex}
          sorting={sorting}
          onSortingChange={setSorting}
          globalFilter={globalFilter}
          onGlobalFilterChange={updateGlobalFilter}
          searchPlaceholder="Search name, username, email"
          loading={loading}
          error={error || undefined}
          onRetry={() => void load()}
          emptyState={{
            icon: UsersRound,
            title: globalFilter || statusFilter ? "No users match your filters" : "No named users yet",
            description:
              globalFilter || statusFilter
                ? "Try a different search term, or clear the status filter."
                : "Use “Seed Launch Team” to create the launch accounts with one-time temporary passwords.",
            action: globalFilter || statusFilter ? "Clear filters" : undefined,
            onAction:
              globalFilter || statusFilter
                ? () => {
                    setGlobalFilter("");
                    setStatusFilter("");
                  }
                : undefined
          }}
          export={{ headers: userExportHeaders, row: userExportRow, filename: "users.csv" }}
          stickyFirstColumn
          toolbarExtra={
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => updateStatusFilter(event.target.value as ManagedUser["status"] | "")}
              className="min-h-9 rounded border border-line bg-surface px-2 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          }
          bulkActions={(selected, clear) => (
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadCsv(userExportHeaders, selected.map(userExportRow), "selected-users.csv");
                clear();
              }}
            >
              <Download size={14} /> Export selected
            </ActionButton>
          )}
        />

        {managingUser ? (
          <div className="mt-4 rounded border border-line bg-surface p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">@{managingUser.username}</p>
                <h3 className="mt-1 text-lg font-bold text-ink">{managingUser.name}</h3>
                <p className="mt-1 text-xs text-muted">
                  MFA: {managingUser.totpEnabled ? "enabled" : "not set"} | Last login: {formatDate(managingUser.lastLoginAt)}
                </p>
              </div>
              <ActionButton variant="ghost" size="sm" onClick={() => setManagingUserId("")}>
                Close
              </ActionButton>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton
                variant="secondary"
                className={rowAction}
                onClick={async () => {
                  const data = await operate(managingUser.id, "reset-password");
                  if (data?.temporaryPassword) {
                    setCredentials([{ name: managingUser.name, username: managingUser.username, roles: managingUser.roles, temporaryPassword: data.temporaryPassword }]);
                    setNotice("Temporary password generated — shown ONCE above. All existing sessions were revoked.");
                  }
                }}
                disabled={!isSuperAdmin}
              >
                <KeyRound size={14} /> Reset password
              </ActionButton>
              <ActionButton variant="secondary" className={rowAction} onClick={() => void operate(managingUser.id, "reset-mfa")} disabled={!isSuperAdmin || !managingUser.totpEnabled}>
                <ShieldOff size={14} /> Reset MFA
              </ActionButton>
              {managingUser.status === "active" ? (
                <ActionButton variant="secondary" className={rowAction} onClick={() => void operate(managingUser.id, "suspend")} disabled={!isSuperAdmin || managingUser.id === myUserId}>
                  <ShieldOff size={14} /> Suspend
                </ActionButton>
              ) : (
                <ActionButton variant="secondary" className={rowAction} onClick={() => void operate(managingUser.id, "reactivate")} disabled={!isSuperAdmin}>
                  <ShieldCheck size={14} /> Reactivate
                </ActionButton>
              )}
            </div>

            <div className="mt-4 rounded border border-line bg-soft/40 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Request role change (needs a second Super Admin)</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {staffLoginRoles.map((role) => (
                  <label key={role} className="inline-flex items-center gap-1.5 rounded border border-line bg-soft px-2.5 py-1.5 text-xs font-semibold text-ink">
                    <input type="checkbox" checked={roleDraft.includes(role)} onChange={() => setRoleDraft((draft) => toggleRole(draft, role))} disabled={!isSuperAdmin} />
                    {roleMeta[role].label}
                  </label>
                ))}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <select aria-label="Default role" value={defaultDraft} onChange={(event) => setDefaultDraft(event.target.value as AccessRole)} className={fieldClass} disabled={!isSuperAdmin}>
                  {roleDraft.map((role) => (
                    <option key={role} value={role}>
                      Default: {roleMeta[role].label}
                    </option>
                  ))}
                </select>
                <ActionButton
                  variant="primary"
                  onClick={async () => {
                    const data = await operate(managingUser.id, "request-role-change", { roles: roleDraft, defaultRole: defaultDraft });
                    if (data) {
                      setManagingUserId("");
                      setNotice("Role change queued. A different Super Admin must approve it before it applies.");
                    }
                  }}
                  disabled={!isSuperAdmin || !roleDraft.length}
                >
                  Request change
                </ActionButton>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={createUser} className="grid gap-3 border-t border-line p-4">
        <p className="text-sm font-bold text-ink">Add a staff account</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input value={newName} onChange={(event) => setNewName(event.target.value)} className={fieldClass} placeholder="Full name" required />
          <input value={newUsername} onChange={(event) => setNewUsername(event.target.value)} className={fieldClass} placeholder="Username (e.g. asha.verma)" required />
        </div>
        <div className="flex flex-wrap gap-2">
          {assignableRoles.map((role) => (
            <label key={role} className="inline-flex items-center gap-1.5 rounded border border-line bg-soft px-2.5 py-1.5 text-xs font-semibold text-ink">
              <input type="checkbox" checked={newRoles.includes(role)} onChange={() => setNewRoles((draft) => toggleRole(draft, role))} />
              {roleMeta[role].label}
            </label>
          ))}
        </div>
        <p className="text-xs leading-relaxed text-muted">
          Super Admin cannot be granted here — create the account first, then request the role change so a second Super Admin approves it.
        </p>
        <ActionButton type="submit" variant="primary" disabled={!isSuperAdmin || !newRoles.length} className="justify-self-start px-5">
          <UserRoundPlus size={16} /> Create user
        </ActionButton>
      </form>
    </div>
  );
}
