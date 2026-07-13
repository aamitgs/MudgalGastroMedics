"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState
} from "@tanstack/react-table";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Columns3, Download, FileText, Mail, Printer, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { site } from "@/lib/site-data";
import { downloadCsv, downloadPdfExport, emailPdfExport } from "@/lib/table-export";

/**
 * Shared enterprise DataTable (Track 3.1). Server-driven: the caller owns
 * pagination/sorting/global-search state and fetches the matching page —
 * this component only renders one page's worth of rows and never sees the
 * full dataset, so it stays fast even when the underlying store holds
 * thousands of records (P5 "never load unnecessary records").
 *
 * Client-side concerns (column visibility/resize, row selection, keyboard
 * navigation, print, export-current-page) live entirely in this component so
 * every adopting module gets them for free.
 */
export type DataTableEmptyState = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
};

export type DataTableExport<TData> = {
  headers: string[];
  row: (item: TData) => string[];
  filename: string;
};

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId: (row: TData) => string;

  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;

  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;

  globalFilter: string;
  onGlobalFilterChange: (value: string) => void;
  searchPlaceholder?: string;

  bulkActions?: (selectedRows: TData[], clearSelection: () => void) => React.ReactNode;

  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyState: DataTableEmptyState;

  export?: DataTableExport<TData>;
  toolbarExtra?: React.ReactNode;
  stickyFirstColumn?: boolean;
  /** Shown above the printed table (e.g. "Patients"). Defaults to "Records". */
  printTitle?: string;
};

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp size={13} />;
  if (direction === "desc") return <ArrowDown size={13} />;
  return <ArrowUpDown size={13} className="opacity-40" />;
}

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  pageIndex,
  pageCount,
  onPageChange,
  sorting,
  onSortingChange,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder = "Search…",
  bulkActions,
  loading,
  error,
  onRetry,
  emptyState,
  export: exportConfig,
  toolbarExtra,
  stickyFirstColumn,
  printTitle = "Records"
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [exportingPdf, setExportingPdf] = useState(false);
  const [emailingPdf, setEmailingPdf] = useState(false);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const columnsWithSelect = useMemo<ColumnDef<TData, unknown>[]>(
    () => [
      {
        id: "select",
        size: 40,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
            aria-label="Select all rows on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(Boolean(value))} aria-label="Select row" />
        )
      },
      ...columns
    ],
    [columns]
  );

  // The checkbox column is always pinned; stickyFirstColumn additionally pins
  // the first caller-supplied column so its id is resolved the same way
  // TanStack derives one when a column omits an explicit `id`.
  const pinnedLeft = useMemo(() => {
    const ids = ["select"];
    const first = columns[0] as { id?: string; accessorKey?: string } | undefined;
    const firstId = first?.id ?? first?.accessorKey;
    if (stickyFirstColumn && firstId) ids.push(firstId);
    return ids;
  }, [columns, stickyFirstColumn]);

  // TanStack Table intentionally returns imperative helpers that React Compiler cannot memoize safely.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns: columnsWithSelect,
    state: { sorting, rowSelection, columnVisibility },
    initialState: { columnPinning: { left: pinnedLeft } },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    enableRowSelection: true,
    getRowId,
    onSortingChange: (updater) => onSortingChange(typeof updater === "function" ? updater(sorting) : updater),
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel()
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);

  function clearSelection() {
    setRowSelection({});
  }

  function onRowKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const rows = Array.from(bodyRef.current?.querySelectorAll<HTMLTableRowElement>("[data-datatable-row]") ?? []);
    const index = rows.indexOf(event.currentTarget);
    if (index === -1) return;
    event.preventDefault();
    const next = event.key === "ArrowDown" ? rows[index + 1] : rows[index - 1];
    next?.focus();
  }

  const hideableColumns = table.getAllLeafColumns().filter((column) => column.getCanHide());

  return (
    <div className="rounded border border-line/80 bg-surface shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
        <input
          value={globalFilter}
          onChange={(event) => onGlobalFilterChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="min-h-9 min-w-0 flex-1 rounded border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 sm:flex-none sm:w-64"
        />
        {toolbarExtra}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {hideableColumns.length ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ActionButton variant="secondary" size="sm">
                  <Columns3 size={14} /> Columns
                </ActionButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hideableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {exportConfig ? (
            <ActionButton
              variant="secondary"
              size="sm"
              disabled={data.length === 0}
              onClick={() => downloadCsv(exportConfig.headers, data.map(exportConfig.row), exportConfig.filename)}
            >
              <Download size={14} /> Export page
            </ActionButton>
          ) : null}
          {exportConfig ? (
            <ActionButton
              variant="secondary"
              size="sm"
              disabled={data.length === 0 || exportingPdf}
              onClick={async () => {
                setExportingPdf(true);
                await downloadPdfExport(
                  printTitle,
                  exportConfig.headers,
                  data.map(exportConfig.row),
                  `${exportConfig.filename.replace(/\.[^.]+$/, "")}.pdf`
                );
                setExportingPdf(false);
              }}
            >
              <FileText size={14} /> Export PDF
            </ActionButton>
          ) : null}
          {exportConfig ? (
            <ActionButton
              variant="secondary"
              size="sm"
              disabled={data.length === 0 || emailingPdf}
              onClick={async () => {
                setEmailingPdf(true);
                await emailPdfExport(printTitle, exportConfig.headers, data.map(exportConfig.row));
                setEmailingPdf(false);
              }}
            >
              <Mail size={14} /> Email PDF
            </ActionButton>
          ) : null}
          <ActionButton variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer size={14} /> Print
          </ActionButton>
        </div>
      </div>

      {selectedRows.length && bulkActions ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-soft/60 px-3 py-2">
          <span className="text-sm font-bold text-ink">{selectedRows.length} selected</span>
          {bulkActions(selectedRows, clearSelection)}
          <ActionButton variant="ghost" size="sm" onClick={clearSelection} className="ml-auto">
            <X size={13} /> Clear
          </ActionButton>
        </div>
      ) : null}

      {error ? (
        <ModuleEmptyState icon={AlertTriangle} title="Couldn't load this table" description={error} action={onRetry ? "Retry" : undefined} onAction={onRetry} />
      ) : loading ? (
        <div className="p-4">
          <ModuleSkeleton />
        </div>
      ) : data.length === 0 ? (
        <ModuleEmptyState {...emptyState} />
      ) : (
        <div className="max-h-[min(70vh,720px)] overflow-auto">
          <Table style={{ width: table.getTotalSize() }}>
            <TableHeader className="sticky top-0 z-10 bg-surface">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={
                        header.column.getIsPinned()
                          ? { width: header.getSize(), position: "sticky", left: header.column.getStart("left"), zIndex: 5 }
                          : { width: header.getSize() }
                      }
                      className={`relative select-none whitespace-nowrap bg-surface ${header.column.getIsPinned() ? "shadow-[2px_0_0_0_var(--site-line)]" : ""}`}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 font-bold text-ink hover:text-brand"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon direction={header.column.getIsSorted()} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                      {header.column.getCanResize() ? (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-brand/40"
                        />
                      ) : null}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody ref={bodyRef}>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-datatable-row
                  tabIndex={0}
                  onKeyDown={onRowKeyDown}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-inset"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={
                        cell.column.getIsPinned()
                          ? { width: cell.column.getSize(), position: "sticky", left: cell.column.getStart("left"), zIndex: 1 }
                          : { width: cell.column.getSize() }
                      }
                      className={cell.column.getIsPinned() ? "bg-surface" : undefined}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!error && !loading && data.length > 0 ? (
        // Print button below renders window.print(), and the global print
        // stylesheet (app/globals.css) hides everything except .patient-print
        // — without a matching printable view, every module's "Print" button
        // silently produced a blank page. Rebuilds the current page's visible
        // rows/columns as a plain table, dropping the select/actions columns
        // (checkboxes and row buttons aren't meaningful on paper).
        <section className="patient-print">
          <div className="print-sheet">
            <header className="print-header">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mgm-logo.png" alt={`${site.name} logo`} />
              <div>
                <h1>{site.name}</h1>
                <p>{printTitle}</p>
                <p>Generated {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
            </header>
            <table className="print-data-table">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers
                      .filter((header) => header.column.id !== "select" && header.column.id !== "actions")
                      .map((header) => (
                        <th key={header.id}>{typeof header.column.columnDef.header === "string" ? header.column.columnDef.header : header.column.id}</th>
                      ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row
                      .getVisibleCells()
                      .filter((cell) => cell.column.id !== "select" && cell.column.id !== "actions")
                      .map((cell) => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!error && !loading && data.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2.5 text-sm">
          <p className="font-semibold text-muted">
            Page {pageIndex + 1} of {Math.max(pageCount, 1)}
          </p>
          <div className="flex gap-2">
            <ActionButton variant="secondary" size="sm" disabled={pageIndex <= 0} onClick={() => onPageChange(pageIndex - 1)}>
              Previous
            </ActionButton>
            <ActionButton variant="secondary" size="sm" disabled={pageIndex >= pageCount - 1} onClick={() => onPageChange(pageIndex + 1)}>
              Next
            </ActionButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
