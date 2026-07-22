"use client";

import type { KeyboardEvent } from "react";
import { AlertTriangle, ChevronsUpDown, Download, FileText, Search, X } from "lucide-react";
import { flexRender, type useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActionButton } from "@/components/design-system/ActionButton";
import { ModuleEmptyState } from "@/components/design-system/ModuleEmptyState";
import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";
import { downloadCsvFile, openPatientWorkspace, patientFlowExportRow, patientFlowExportHeaders, type PatientFlowRow } from "@/lib/hospital-os-data";

const fieldClass = "min-h-9 rounded border border-line bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export function OperationsTable({
  table,
  isLoading,
  isError,
  globalFilter,
  setGlobalFilter
}: {
  table: ReturnType<typeof useReactTable<PatientFlowRow>>;
  isLoading: boolean;
  isError: boolean;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
}) {
  const exportRows = table.getPrePaginationRowModel().rows.map((row) => {
    return patientFlowExportRow(row.original);
  });

  function exportCsv() {
    downloadCsvFile(exportRows, "hospital-os-patient-flow.csv");
  }

  const selectedRows = table.getSelectedRowModel().rows;

  function exportSelectedCsv() {
    downloadCsvFile(selectedRows.map((row) => patientFlowExportRow(row.original)), "hospital-os-patient-flow-selected.csv");
  }

  function exportExcel() {
    const escapeHtml = (value: string) => value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;");
    const tableHtml = [
      "<table>",
      `<thead><tr>${patientFlowExportHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>`,
      `<tbody>${exportRows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`,
      "</table>"
    ].join("");
    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hospital-os-patient-flow.xls";
    link.click();
    URL.revokeObjectURL(url);
  }

  const statusFilter = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "All";

  function onPatientRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, patientId: string) {
    const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>("[data-patient-flow-row]"));
    const currentIndex = rows.indexOf(event.currentTarget);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      rows[Math.min(currentIndex + 1, rows.length - 1)]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      rows[Math.max(currentIndex - 1, 0)]?.focus();
    }

    if (event.key === "Enter") {
      event.preventDefault();
      openPatientWorkspace(patientId);
    }
  }

  return (
    <div id="operations-table" className="scroll-mt-20 rounded border border-line/80 bg-surface shadow-sm">
      <div className="border-b border-line p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-brand">Live overview</p>
            <h2 className="mt-1 text-xl font-bold text-ink">Active patient flow</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Filter table"
              className={`${fieldClass} w-48`}
              aria-label="Filter patient flow table"
            />
            <select
              aria-label="Filter patient flow status"
              value={statusFilter}
              onChange={(event) => table.getColumn("status")?.setFilterValue(event.target.value === "All" ? undefined : event.target.value)}
              className={fieldClass}
            >
              <option>All</option>
              <option>Scheduled</option>
              <option>In Consultation</option>
              <option>Vitals Pending</option>
              <option>Lab Review</option>
              <option>Billing Hold</option>
              <option>Discharged</option>
            </select>
            <ActionButton variant="secondary" onClick={exportCsv}><Download size={16} /> Export CSV</ActionButton>
            <ActionButton variant="secondary" onClick={exportExcel}><FileText size={16} /> Export Excel</ActionButton>
          </div>
        </div>
        {selectedRows.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded border border-line bg-soft/60 px-3 py-2">
            <p className="text-sm font-bold text-ink">{selectedRows.length} selected</p>
            <ActionButton variant="secondary" size="sm" onClick={exportSelectedCsv}>
              <Download size={14} /> Export selected
            </ActionButton>
            <ActionButton variant="ghost" size="sm" onClick={() => table.resetRowSelection()}>
              <X size={14} /> Clear selection
            </ActionButton>
          </div>
        ) : null}
      </div>
      <div className="p-0">
        {isLoading ? <ModuleSkeleton rows={6} tiles={0} /> : null}
        {isError ? (
          <div className="p-4">
            <ModuleEmptyState
              icon={AlertTriangle}
              title="Unable to load patient flow"
              description="Check the patient flow API or retry once connectivity returns."
            />
          </div>
        ) : null}
        {!isLoading && !isError && table.getRowModel().rows.length === 0 ? (
          <div className="p-4">
            <ModuleEmptyState
              icon={Search}
              title="No matching patient flow records"
              description="Adjust the table filter or create a new appointment to start a patient flow."
              action="Open Appointments"
              onAction={() => window.location.assign("/mudgalgastromedics-os/appointments")}
            />
          </div>
        ) : null}
        {!isLoading && !isError && table.getRowModel().rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader className="sticky top-0 bg-surface">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="border-b border-line text-xs font-semibold uppercase text-muted">
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <ChevronsUpDown size={13} />
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-patient-flow-row
                      tabIndex={0}
                      aria-label={`Open ${row.original.patient} row`}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className="hover:bg-soft/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                      onKeyDown={(event) => onPatientRowKeyDown(event, row.original.id)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="border-b border-line text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 border-t border-line p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="text-sm text-muted">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} &middot; Showing {table.getRowModel().rows.length} of {table.getPrePaginationRowModel().rows.length}
                </p>
                <select
                  aria-label="Rows per patient flow page"
                  value={table.getState().pagination.pageSize}
                  onChange={(event) => table.setPageSize(Number(event.target.value))}
                  className={fieldClass}
                >
                  <option value="4">4 rows</option>
                  <option value="6">6 rows</option>
                  <option value="10">10 rows</option>
                </select>
              </div>
              <div className="flex gap-2">
                <ActionButton variant="secondary" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</ActionButton>
                <ActionButton variant="secondary" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</ActionButton>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
