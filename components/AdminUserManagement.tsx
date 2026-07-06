"use client";

import { CheckCircle2, KeyRound, RefreshCw, ShieldCheck, ShieldOff, UserRoundCog, UserRoundPlus, UsersRound, XCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { roleMeta, staffLoginRoles, type AccessRole } from "@/lib/access/matrix";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

type ManagedUser = {
  id: string;
  status: "active" | "suspended";
  name: string;
  username: string;
  email?: string;
  roles: AccessRole[];
  defaultRole: AccessRole;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  lastLoginAt?: string;
  lockedUntil?: string;
};

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

const assignableRoles = staffLoginRoles.filter((role) => role !== "super-admin");

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
  const [editingRolesFor, setEditingRolesFor] = useState<string>("");
  const [roleDraft, setRoleDraft] = useState<AccessRole[]>([]);
  const [defaultDraft, setDefaultDraft] = useState<AccessRole>("reception");

  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRoles, setNewRoles] = useState<AccessRole[]>([]);

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

  async function operate(id: string, operation: string, extra: Record<string, unknown> = {}) {
    setError("");
    setNotice("");
    const response = await fetch("/api/access/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, operation, ...extra })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      setError(data.error || "Operation failed.");
      return null;
    }
    await load();
    return data;
  }

  async function seedLaunchTeam() {
    setError("");
    setNotice("");
    const response = await fetch("/api/access/seed", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      setError(data.error || "Seeding failed.");
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
    setError("");
    const response = await fetch("/api/access/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, username: newUsername, roles: newRoles, defaultRole: newRoles[0] })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      setError(data.error || "Could not create user.");
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
    setError("");
    const response = await fetch("/api/access/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      setError(data.error || "Decision failed.");
      return;
    }
    await load();
  }

  function toggleRole(list: AccessRole[], role: AccessRole) {
    return list.includes(role) ? list.filter((item) => item !== role) : [...list, role];
  }

  const pendingApprovals = approvals.filter((approval) => approval.status === "pending");

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand">Access Control</p>
          <h2 className="mt-1 text-xl font-bold text-ink">Users, roles & approvals</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton variant="secondary" onClick={() => void seedLaunchTeam()} disabled={!isSuperAdmin}>
            <UsersRound size={17} /> Seed Launch Team
          </ActionButton>
          <ActionButton variant="secondary" onClick={() => void load()}>
            <RefreshCw size={17} /> Refresh
          </ActionButton>
        </div>
      </div>

      {!isSuperAdmin ? (
        <p className="border-b border-line bg-soft/60 p-4 text-sm font-semibold text-muted">
          Viewing only — user creation, role changes, suspensions and password resets require an active Super Admin session.
        </p>
      ) : null}
      {error ? <p className="border-b border-line bg-red-50 dark:bg-red-950 p-4 text-sm font-semibold text-red-700 dark:text-red-300">{error}</p> : null}
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
              <div key={approval.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/60 p-3">
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

      <div className="grid gap-3 p-4">
        {loading ? <ModuleSkeleton /> : null}
        {!loading && users.length === 0 ? (
          <p className="rounded border border-dashed border-line bg-soft/60 p-4 text-sm font-semibold text-muted">
            No named users yet. Use “Seed Launch Team” to create the launch accounts with one-time temporary passwords.
          </p>
        ) : null}
        {users.map((user) => (
          <article key={user.id} className="rounded border border-line bg-soft/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-ink">
                  {user.name}
                  <span className="ml-2 text-xs font-semibold text-muted">@{user.username}</span>
                  {user.status === "suspended" ? <span className="ml-2 rounded bg-red-100 dark:bg-red-900 px-2 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">Suspended</span> : null}
                  {user.mustChangePassword ? <span className="ml-2 rounded bg-amber-100 dark:bg-amber-900 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">Temp password</span> : null}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {user.roles.map((role) => (role === user.defaultRole ? `${roleMeta[role].label} (default)` : roleMeta[role].label)).join(" + ")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  MFA: {user.totpEnabled ? "enabled" : "not set"} | Last login: {formatDate(user.lastLoginAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  variant="secondary"
                  className={rowAction}
                  onClick={async () => {
                    const data = await operate(user.id, "reset-password");
                    if (data?.temporaryPassword) {
                      setCredentials([{ name: user.name, username: user.username, roles: user.roles, temporaryPassword: data.temporaryPassword }]);
                      setNotice("Temporary password generated — shown ONCE above. All existing sessions were revoked.");
                    }
                  }}
                  disabled={!isSuperAdmin}
                >
                  <KeyRound size={14} /> Reset password
                </ActionButton>
                <ActionButton variant="secondary" className={rowAction} onClick={() => void operate(user.id, "reset-mfa")} disabled={!isSuperAdmin || !user.totpEnabled}>
                  <ShieldOff size={14} /> Reset MFA
                </ActionButton>
                {user.status === "active" ? (
                  <ActionButton variant="secondary" className={rowAction} onClick={() => void operate(user.id, "suspend")} disabled={!isSuperAdmin || user.id === myUserId}>
                    <ShieldOff size={14} /> Suspend
                  </ActionButton>
                ) : (
                  <ActionButton variant="secondary" className={rowAction} onClick={() => void operate(user.id, "reactivate")} disabled={!isSuperAdmin}>
                    <ShieldCheck size={14} /> Reactivate
                  </ActionButton>
                )}
                <ActionButton
                  variant="secondary"
                  className={rowAction}
                  onClick={() => {
                    setEditingRolesFor(editingRolesFor === user.id ? "" : user.id);
                    setRoleDraft(user.roles);
                    setDefaultDraft(user.defaultRole);
                  }}
                  disabled={!isSuperAdmin}
                >
                  <UserRoundCog size={14} /> Change roles
                </ActionButton>
              </div>
            </div>

            {editingRolesFor === user.id ? (
              <div className="mt-4 rounded border border-line bg-surface p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-brand">Request role change (needs a second Super Admin)</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {staffLoginRoles.map((role) => (
                    <label key={role} className="inline-flex items-center gap-1.5 rounded border border-line bg-soft px-2.5 py-1.5 text-xs font-semibold text-ink">
                      <input type="checkbox" checked={roleDraft.includes(role)} onChange={() => setRoleDraft((draft) => toggleRole(draft, role))} />
                      {roleMeta[role].label}
                    </label>
                  ))}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select aria-label="Default role" value={defaultDraft} onChange={(event) => setDefaultDraft(event.target.value as AccessRole)} className={fieldClass}>
                    {roleDraft.map((role) => (
                      <option key={role} value={role}>Default: {roleMeta[role].label}</option>
                    ))}
                  </select>
                  <ActionButton
                    variant="primary"
                    onClick={async () => {
                      const data = await operate(user.id, "request-role-change", { roles: roleDraft, defaultRole: defaultDraft });
                      if (data) {
                        setEditingRolesFor("");
                        setNotice("Role change queued. A different Super Admin must approve it before it applies.");
                      }
                    }}
                    disabled={!roleDraft.length}
                  >
                    Request change
                  </ActionButton>
                </div>
              </div>
            ) : null}
          </article>
        ))}
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
