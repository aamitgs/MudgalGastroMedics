"use client";

import type { KeyboardEvent } from "react";
import { AlertTriangle, ChevronsUpDown, Download, FileText, Search } from "lucide-react";
import { flexRender, type useReactTable } from "@tanstack/react-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/design-system/EmptyState";
import { downloadCsvFile, openPatientWorkspace, patientFlowExportRow, patientFlowExportHeaders, type PatientFlowRow } from "@/lib/hospital-os-data";

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
    <Card id="operations-table" className="scroll-mt-20 rounded-lg border-[var(--hos-border)] bg-[var(--hos-surface)]">
      <CardHeader className="border-b border-[var(--hos-border)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[var(--hos-primary)]">Live overview</p>
            <CardTitle className="mt-1 text-xl">Active patient flow</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} placeholder="Filter table" className="w-48" aria-label="Filter patient flow table" />
            <select
              aria-label="Filter patient flow status"
              value={statusFilter}
              onChange={(event) => table.getColumn("status")?.setFilterValue(event.target.value === "All" ? undefined : event.target.value)}
              className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option>All</option>
              <option>Scheduled</option>
              <option>In Consultation</option>
              <option>Vitals Pending</option>
              <option>Lab Review</option>
              <option>Billing Hold</option>
              <option>Discharged</option>
            </select>
            <Button type="button" variant="outline" className="gap-2 border-[var(--hos-border)]" onClick={exportCsv}><Download size={16} /> Export CSV</Button>
            <Button type="button" variant="outline" className="gap-2 border-[var(--hos-border)]" onClick={exportExcel}><FileText size={16} /> Export Excel</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="grid gap-3 p-5">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 rounded-lg" />)}
          </div>
        ) : null}
        {isError ? (
          <div className="p-5">
            <Alert variant="destructive">
              <AlertTriangle size={18} />
              <AlertTitle>Unable to load patient flow</AlertTitle>
              <AlertDescription>Check the patient flow API or retry once connectivity returns.</AlertDescription>
            </Alert>
          </div>
        ) : null}
        {!isLoading && !isError && table.getRowModel().rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
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
                <TableHeader className="sticky top-0 bg-[var(--hos-bg)]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="border-b border-[var(--hos-border)] text-xs font-semibold uppercase text-[var(--hos-muted-text)]">
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
                      className="hover:bg-[var(--hos-muted)]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hos-primary)] focus-visible:ring-offset-2"
                      onKeyDown={(event) => onPatientRowKeyDown(event, row.original.id)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="border-b border-[var(--hos-border)] text-sm">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[var(--hos-border)] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="text-sm text-[var(--hos-muted-text)]">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} &middot; Showing {table.getRowModel().rows.length} of {table.getPrePaginationRowModel().rows.length}
                </p>
                <select
                  aria-label="Rows per patient flow page"
                  value={table.getState().pagination.pageSize}
                  onChange={(event) => table.setPageSize(Number(event.target.value))}
                  className="min-h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="4">4 rows</option>
                  <option value="6">6 rows</option>
                  <option value="10">10 rows</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</Button>
                <Button type="button" variant="outline" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</Button>
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
