"use client";

import * as React from "react";

import {
  ChevronLeft,
  ChevronRight,
  Columns as ColumnsIcon,
  Copy,
  Download,
  Printer,
  RotateCw,
  X,
} from "lucide-react";
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  Table as TanTable,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* -------------------- Column meta augmentation (export/print) -------------------- */
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    exportable?: boolean; // default true
    printable?: boolean; // default true
    exportValue?: (row: TData) => unknown; // used for copy/export/print
    align?: "left" | "center" | "right"; // header + cell alignment
  }
}

/* ----------------------------- Types & Props ----------------------------- */
export type DataTableFilter = {
  columnId: string;
  title: string;
  options: { label: string; value: string }[];
};

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data?: TData[];

  // server mode
  serverMode?: boolean;
  totalEntries?: number;
  onQueryChange?: (q: {
    page: number; // 1-indexed
    pageSize: number;
    sortCol?: string;
    sortDir?: "asc" | "desc";
    search?: string;
  }) => void;

  searchColumnId?: string;
  searchPlaceholder?: string;
  filters?: DataTableFilter[];

  onDeleteRows?: (rows: TData[]) => Promise<void> | void;

  pageSize?: number;
  pageSizeOptions?: number[];

  onRefresh?: () => Promise<void> | void;
  onReload?: () => Promise<void> | void;

  fileName?: string;
  className?: string;

  /** Scroll container selector ("body" by default). Pass false to disable. */
  scrollTo?: string | false;

  /** Optional date column id (e.g. "createdAt") for the date filter */
  dateFilterColumnId?: string;
}

/* ---------------------------- Column helpers ---------------------------- */
function getExportableColumns<T>(table: TanTable<T>) {
  return table
    .getAllLeafColumns()
    .filter(
      (c) =>
        c.getIsVisible() &&
        c.columnDef?.meta?.exportable !== false &&
        c.id !== "seq"
    );
}

function getPrintableColumns<T>(table: TanTable<T>) {
  return table
    .getAllLeafColumns()
    .filter(
      (c) =>
        c.getIsVisible() &&
        c.columnDef?.meta?.printable !== false &&
        c.id !== "seq"
    );
}

function getSafeFilteredRows<T>(table: TanTable<T>) {
  // @ts-expect-error plugin property
  const filtered = table.getFilteredRowModel?.();
  return filtered?.rows?.length ? filtered.rows : table.getRowModel().rows;
}

/* ---------------------------- Export helpers ---------------------------- */
function toCsv<T>(table: TanTable<T>, rows?: Row<T>[]) {
  const cols = getExportableColumns(table);
  const dataRows = rows ?? getSafeFilteredRows(table);

  const header = [
    "No.",
    ...cols.map((c) =>
      typeof c.columnDef.header === "string" ? c.columnDef.header : c.id
    ),
  ].join(",");

  const lines = dataRows.map((r, rowIndex) =>
    [
      String(rowIndex + 1),
      ...cols.map((c) => {
        const meta = (c.columnDef.meta || {}) as any;

        const raw =
          typeof meta.exportValue === "function"
            ? meta.exportValue(r.original)
            : r.getValue<any>(c.id);

        const s =
          raw == null
            ? ""
            : typeof raw === "object"
            ? JSON.stringify(raw)
            : String(raw);

        return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }),
    ].join(",")
  );

  return [header, ...lines].join("\n");
}

function downloadCsv<T>(
  table: TanTable<T>,
  fileName = "export",
  rows?: Row<T>[]
) {
  const csv = toCsv(table, rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function copyCsv<T>(table: TanTable<T>, rows?: Row<T>[]) {
  try {
    const csv = toCsv(table, rows);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(csv);
    } else {
      const ta = document.createElement("textarea");
      ta.value = csv;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    toast.success("Data copied to clipboard");
  } catch {
    toast.error("Copy failed");
  }
}

async function exportXlsx<T>(
  table: TanTable<T>,
  fileName = "export",
  rows?: Row<T>[]
) {
  try {
    const xlsx = (await import("xlsx")).default || (await import("xlsx"));
    const cols = getExportableColumns(table);
    const dataRows = rows ?? getSafeFilteredRows(table);
    if (!dataRows.length) return;

    const headers = [
      "No.",
      ...cols.map((c) =>
        typeof c.columnDef.header === "string" ? c.columnDef.header : c.id
      ),
    ];

    const data = dataRows.map((r, rowIndex) => [
      String(rowIndex + 1),
      ...cols.map((c) => {
        const meta = (c.columnDef.meta || {}) as any;
        const raw =
          typeof meta.exportValue === "function"
            ? meta.exportValue(r.original)
            : r.getValue<any>(c.id);

        return raw == null
          ? ""
          : typeof raw === "object"
          ? JSON.stringify(raw)
          : String(raw);
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sheet = (xlsx.utils as any).aoa_to_sheet([headers, ...data]);
    const wb = (xlsx.utils as any).book_new();
    (xlsx.utils as any).book_append_sheet(wb, sheet, "Data");
    (xlsx.writeFile as any)(wb, `${fileName}.xlsx`);
  } catch (err) {
    console.error(err);
    toast.error("XLSX export needs: npm i xlsx");
  }
}

/* ===== Simple PDF (no avatar) ===== */
async function exportPdf<T>(
  table: TanTable<T>,
  fileName = "export",
  rowsArg?: Row<T>[]
) {
  try {
    const jsPDFmod = await import("jspdf");
    const JsPDFCtor: any = (jsPDFmod as any).default || (jsPDFmod as any).jsPDF;

    const autoTableMod: any = await import("jspdf-autotable");
    const autoTableFn: any = autoTableMod.default || (autoTableMod as any);

    const cols = getExportableColumns(table);
    const rows = rowsArg ?? getSafeFilteredRows(table);
    if (!rows.length) return;

    const head = [
      [
        "No.",
        ...cols.map((c) =>
          typeof c.columnDef.header === "string" ? c.columnDef.header : c.id
        ),
      ],
    ];

    const body = rows.map((r, rowIndex) => [
      String(rowIndex + 1),
      ...cols.map((c) => {
        const meta = (c.columnDef.meta || {}) as any;
        const raw =
          typeof meta.exportValue === "function"
            ? meta.exportValue(r.original)
            : r.getValue<any>(c.id);

        if (raw == null) return "";
        return typeof raw === "object" ? JSON.stringify(raw) : String(raw);
      }),
    ]);

    const doc = new JsPDFCtor({ unit: "mm", format: "a4" });
    doc.setFontSize(12);
    doc.text(fileName.toUpperCase(), 14, 18);

    autoTableFn(doc, {
      head,
      body,
      styles: {
        fontSize: 8.5,
        cellPadding: 3.5,
        valign: "middle",
        overflow: "hidden",
      },
      headStyles: {
        fontSize: 9,
        fontStyle: "bold",
        fillColor: [245, 245, 245],
        textColor: 40,
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 20, left: 12, right: 12, bottom: 12 },
    });

    doc.save(`${fileName}.pdf`);
  } catch (err) {
    console.error(err);
    toast.error("PDF export needs: npm i jspdf jspdf-autotable");
  }
}

function printTable<T>(table: TanTable<T>, title = "Table", rows?: Row<T>[]) {
  const cols = getPrintableColumns(table);
  const dataRows = rows ?? getSafeFilteredRows(table);
  if (!dataRows.length) return;

  const thStyle =
    'style="text-align:left;padding:8px;border-bottom:1px solid #ddd"';
  const tdStyle = 'style="padding:6px 8px;border-bottom:1px solid #f2f2f2"';

  const th =
    `<th ${thStyle}>No.</th>` +
    cols
      .map(
        (c) =>
          `<th ${thStyle}>${
            typeof c.columnDef.header === "string" ? c.columnDef.header : c.id
          }</th>`
      )
      .join("");

  const trs = dataRows
    .map((r, rowIndex) => {
      const noCell = `<td ${tdStyle}>${rowIndex + 1}</td>`;

      const tds = cols
        .map((c) => {
          const meta = (c.columnDef.meta || {}) as any;
          const raw =
            typeof meta.exportValue === "function"
              ? meta.exportValue(r.original)
              : r.getValue<any>(c.id);

          const s =
            raw == null
              ? ""
              : typeof raw === "object"
              ? JSON.stringify(raw)
              : String(raw);

          return `<td ${tdStyle}>${s}</td>`;
        })
        .join("");

      return `<tr>${noCell}${tds}</tr>`;
    })
    .join("");

  const w = window.open("", "_blank");
  if (!w) return;

  w.document.write(`
    <html>
      <head><title>${title}</title></head>
      <body>
        <h3>${title}</h3>
        <table style="border-collapse:collapse;width:100%">
          <thead><tr>${th}</tr></thead>
          <tbody>${trs}</tbody>
        </table>
      </body>
    </html>
  `);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}

/* ----------------------- Pagination helpers ----------------------- */
function buildPageItems(current: number, totalPages: number, windowSize = 2) {
  const pages: (number | string)[] = [];
  if (totalPages <= 1) return [1];

  const start = Math.max(1, current - windowSize);
  const end = Math.min(totalPages, current + windowSize);

  pages.push(1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++)
    if (p !== 1 && p !== totalPages) pages.push(p);
  if (end < totalPages - 1) pages.push("…");
  if (totalPages > 1) pages.push(totalPages);

  const out: (number | string)[] = [];
  for (const i of pages) {
    if (!out.length) out.push(i);
    else {
      const last = out[out.length - 1];
      if (i === "…" && last === "…") continue;
      if (typeof i === "number" && typeof last === "number" && i === last)
        continue;
      out.push(i);
    }
  }
  return out;
}

function scrollIntoViewIfNeeded(selector?: string | false) {
  if (!selector) return;
  try {
    const el = document.querySelector(selector) ?? document.body;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {}
}

/* --------------------------------- UI ---------------------------------- */
export function DataTable<TData, TValue>({
  columns,
  data = [],
  serverMode = false,
  totalEntries = 0,
  onQueryChange,
  searchColumnId,
  searchPlaceholder = "Search...",
  filters,
  onDeleteRows,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  onRefresh,
  onReload,
  fileName = "export",
  className,
  scrollTo = "body",
  dateFilterColumnId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [refreshing, setRefreshing] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const manual = !!serverMode;
  const [pageIndexState, setPageIndexState] = React.useState(0);
  const [pageSizeState, setPageSizeState] = React.useState(pageSize);
  const [searchValue, setSearchValue] = React.useState("");

  // date range state
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  // date range filter (client-side)
  const dateFilteredData = React.useMemo(() => {
    if (!dateFilterColumnId || (!dateFrom && !dateTo)) return data;

    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTsRaw = dateTo ? new Date(dateTo).getTime() : null;
    const toTs = toTsRaw != null ? toTsRaw + 24 * 60 * 60 * 1000 - 1 : null;

    if (!fromTs && !toTs) return data;

    return data.filter((row: any) => {
      const raw = row?.[dateFilterColumnId as keyof typeof row] as any;
      if (!raw) return false;

      const d =
        raw instanceof Date
          ? raw
          : typeof raw === "string" || typeof raw === "number"
          ? new Date(raw)
          : null;
      if (!d) return false;

      const t = d.getTime();
      if (Number.isNaN(t)) return false;

      if (fromTs && t < fromTs) return false;
      if (toTs && t > toTs) return false;

      return true;
    });
  }, [data, dateFilterColumnId, dateFrom, dateTo]);

  const coreRow = React.useMemo(() => getCoreRowModel(), []);
  const filteredRow = React.useMemo(() => getFilteredRowModel(), []);
  const sortedRow = React.useMemo(
    () => (!manual ? getSortedRowModel() : undefined),
    [manual]
  );
  const pagedRow = React.useMemo(
    () => (!manual ? getPaginationRowModel() : undefined),
    [manual]
  );

  async function withBusy<T>(fn: () => Promise<T> | T) {
    try {
      setBusy(true);
      return await fn();
    } finally {
      setBusy(false);
    }
  }

  const table = useReactTable({
    data: dateFilteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: pageIndexState, pageSize: pageSizeState },
    },
    onSortingChange: (updater) => {
      setSorting(updater as SortingState);
      if (manual && onQueryChange) {
        const arr = Array.isArray(updater)
          ? (updater as SortingState)
          : sorting;
        const first = arr[0];
        onQueryChange({
          page: 1,
          pageSize: pageSizeState,
          sortCol: first?.id,
          sortDir: first?.desc ? "desc" : "asc",
          search: searchColumnId ? searchValue || "" : undefined,
        });
        setPageIndexState(0);
      }
    },
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex: pageIndexState, pageSize: pageSizeState })
          : updater;
      setPageIndexState(next.pageIndex);
      setPageSizeState(next.pageSize);
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater as ColumnFiltersState);
      if (manual && onQueryChange) {
        onQueryChange({
          page: 1,
          pageSize: pageSizeState,
          sortCol: sorting[0]?.id,
          sortDir: sorting[0]?.desc ? "desc" : "asc",
          search: searchColumnId ? searchValue || "" : undefined,
        });
        setPageIndexState(0);
      }
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,

    getCoreRowModel: coreRow,
    getFilteredRowModel: filteredRow,
    ...(sortedRow ? { getSortedRowModel: sortedRow } : {}),
    ...(pagedRow ? { getPaginationRowModel: pagedRow } : {}),

    manualSorting: manual,
    manualPagination: manual,
    manualFiltering: false,

    initialState: !manual ? { pagination: { pageSize } } : undefined,
  });

  /* ---------- auto-select filtered rows when filters/search/date active ---------- */
  React.useEffect(() => {
    const hasColFilters = columnFilters.length > 0;
    const hasSearch = !!(
      searchColumnId &&
      (manual
        ? searchValue
        : ((table.getColumn(searchColumnId)?.getFilterValue() as string) ?? ""))
    );
    const hasDate = !!(dateFrom || dateTo);

    if (!hasColFilters && !hasSearch && !hasDate) {
      table.resetRowSelection();
      return;
    }

    table.resetRowSelection();
    const rows = getSafeFilteredRows(table);
    rows.forEach((r) => r.toggleSelected(true));
  }, [
    columnFilters,
    manual,
    searchColumnId,
    searchValue,
    dateFrom,
    dateTo,
    table,
  ]);

  // server-mode query propagation
  React.useEffect(() => {
    if (!manual || !onQueryChange) return;
    onQueryChange({
      page: pageIndexState + 1,
      pageSize: pageSizeState,
      sortCol: sorting[0]?.id,
      sortDir: sorting[0]?.desc ? "desc" : "asc",
      search: searchColumnId ? searchValue || "" : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    manual,
    onQueryChange,
    pageIndexState,
    pageSizeState,
    JSON.stringify(sorting),
    searchValue,
    searchColumnId,
  ]);

  const selectedRows = table.getSelectedRowModel().rows ?? [];
  const selectedCount = selectedRows.length;
  const hasSelection = selectedCount > 0;

  const canDelete = !!onDeleteRows && hasSelection;
  const refreshFn = onRefresh ?? onReload;

  function resetFiltersAndState() {
    setColumnFilters([]);
    setDateFrom("");
    setDateTo("");
    setSorting([]);
    table.resetRowSelection();

    if (searchColumnId) {
      if (manual) {
        setSearchValue("");
      } else {
        table.getColumn(searchColumnId)?.setFilterValue("");
      }
    }

    if (manual) {
      setPageIndexState(0);
    } else {
      table.setPageIndex(0);
    }
  }

  async function handleRefresh() {
    resetFiltersAndState();

    if (!refreshFn) return;
    try {
      setRefreshing(true);
      await withBusy(async () => {
        await refreshFn();
      });
      toast.success("Table refreshed");
    } catch {
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleMultiDelete() {
    if (!onDeleteRows || !hasSelection) return;
    await withBusy(async () => {
      await onDeleteRows(selectedRows.map((r) => r.original as TData));
    });
    table.resetRowSelection();
  }

  function resetFilters() {
    resetFiltersAndState();
  }

  const page = manual ? pageIndexState : table.getState().pagination.pageIndex;
  const ps = manual ? pageSizeState : table.getState().pagination.pageSize;
  const clientTotal = table.getFilteredRowModel().rows.length;
  const total = manual ? totalEntries : clientTotal;
  const pageCount = Math.max(1, Math.ceil((total || 0) / (ps || 1)));
  const startEntry = total === 0 ? 0 : page * ps + 1;
  const endEntry = total === 0 ? 0 : Math.min((page + 1) * ps, total);
  const canPrev = manual ? page > 0 : table.getCanPreviousPage();
  const canNext = manual ? page + 1 < pageCount : table.getCanNextPage();

  const showDateFilter = !!dateFilterColumnId;

  const anyFilterOrSearch =
    columnFilters.length > 0 ||
    !!dateFrom ||
    !!dateTo ||
    (searchColumnId &&
      (manual
        ? !!searchValue
        : (table.getColumn(searchColumnId)?.getFilterValue() as string)));

  const isOverlayActive = refreshing || busy;

  const currentSearchVal =
    searchColumnId &&
    (!manual
      ? ((table.getColumn(searchColumnId)?.getFilterValue() as string) ?? "")
      : searchValue);

  const clearSearch = () => {
    if (!searchColumnId) return;
    if (manual) {
      setSearchValue("");
      setPageIndexState(0);
    } else {
      table.getColumn(searchColumnId)?.setFilterValue("");
      table.setPageIndex(0);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Top controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <select
            className="h-9 rounded-md border px-2 text-sm"
            value={
              manual ? pageSizeState : table.getState().pagination.pageSize
            }
            onChange={(e) => {
              const val = Number(e.target.value);
              if (manual) {
                setPageSizeState(val);
                setPageIndexState(0);
              } else {
                table.setPageSize(val);
              }
            }}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        {/* Faceted filters */}
        {filters?.length ? (
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => {
              const col = table.getColumn(filter.columnId);
              const current = (col?.getFilterValue() as string) ?? "";
              return (
                <DropdownMenu key={filter.columnId}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-full"
                    >
                      <span>{filter.title}</span>
                      {current && (
                        <span className="text-xs text-muted-foreground">
                          ·{" "}
                          {
                            filter.options.find((o) => o.value === current)
                              ?.label
                          }
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>{filter.title}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={!current}
                      onCheckedChange={() => col?.setFilterValue(undefined)}
                    >
                      All
                    </DropdownMenuCheckboxItem>
                    {filter.options.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={current === opt.value}
                        onCheckedChange={() => col?.setFilterValue(opt.value)}
                      >
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </div>
        ) : null}

        {/* Date range filter */}
        {showDateFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Date</span>
            <Input
              type="date"
              className="h-9 w-[150px]"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                if (!e.target.value && !dateTo) {
                  table.setPageIndex(0);
                }
              }}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              className="h-9 w-[150px]"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                if (!dateFrom && !e.target.value) {
                  table.setPageIndex(0);
                }
              }}
            />
          </div>
        )}

        <div className="flex-1" />

        {searchColumnId && (
          <div className="relative w-[260px]">
            <Input
              placeholder={searchPlaceholder}
              value={currentSearchVal ?? ""}
              onChange={(e) => {
                if (manual) {
                  setSearchValue(e.target.value);
                  setPageIndexState(0);
                } else {
                  table
                    .getColumn(searchColumnId)
                    ?.setFilterValue(e.target.value);
                  table.setPageIndex(0);
                }
              }}
              className="h-9 pr-8 w-full"
            />
            {currentSearchVal && (
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                onClick={clearSearch}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1" />

        {anyFilterOrSearch && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-1"
            onClick={resetFilters}
            title="Reset filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="default"
          size="icon"
          onClick={handleRefresh}
          title="Refresh"
          className="h-9 w-9"
          disabled={refreshing || !refreshFn}
        >
          <RotateCw
            className={cn("h-4 w-4", (refreshing || busy) && "animate-spin")}
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 gap-2">
              <ColumnsIcon className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllLeafColumns()
              .filter((c) => c.getCanHide())
              .map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.id}
                  checked={c.getIsVisible()}
                  onCheckedChange={(v) => c.toggleVisibility(!!v)}
                >
                  {typeof c.columnDef.header === "string"
                    ? c.columnDef.header
                    : c.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ALL filtered rows */}
        <Button
          variant="outline"
          className="h-9 gap-2"
          onClick={() => withBusy(() => copyCsv(table))}
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => withBusy(() => downloadCsv(table, fileName))}
            >
              CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => withBusy(() => exportXlsx(table, fileName))}
            >
              XLSX
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => withBusy(() => exportPdf(table, fileName))}
            >
              PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          className="h-9 gap-2"
          onClick={() => withBusy(() => printTable(table, fileName))}
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>

        {/* Selected rows export/copy/print */}
        {hasSelection && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs">
            <span className="font-semibold text-emerald-700">
              {selectedCount} selected
            </span>

            {onDeleteRows && (
              <Button
                size="sm"
                className="h-8 border-0 bg-red-600 text-xs text-white hover:bg-red-700"
                onClick={handleMultiDelete}
                disabled={!canDelete}
              >
                <X className="mr-1 h-3 w-3" />
                Delete selected
              </Button>
            )}

            <Button
              size="sm"
              className="h-8 border-0 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              onClick={() => withBusy(() => copyCsv(table, selectedRows))}
            >
              <Copy className="mr-1 h-3 w-3" />
              Copy selected
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 border-0 bg-emerald-500 text-xs text-white hover:bg-emerald-600"
                >
                  <Download className="mr-1 h-3 w-3" />
                  Export selected
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    withBusy(() =>
                      downloadCsv(table, fileName, selectedRows)
                    )
                  }
                >
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    withBusy(() => exportXlsx(table, fileName, selectedRows))
                  }
                >
                  XLSX
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    withBusy(() => exportPdf(table, fileName, selectedRows))
                  }
                >
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              className="h-8 border-0 bg-emerald-700 text-xs text-white hover:bg-emerald-800"
              onClick={() =>
                withBusy(() => printTable(table, fileName, selectedRows))
              }
            >
              <Printer className="mr-1 h-3 w-3" />
              Print selected
            </Button>
          </div>
        )}
      </div>

      {/* Table + overlay */}
      <div className="relative rounded-md border">
        {isOverlayActive && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 dark:bg-black/30 backdrop-blur-sm">
            <RotateCw className="h-6 w-6 animate-spin" />
          </div>
        )}

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    className={cn(
                      h.column.getCanSort() && "cursor-pointer select-none",
                      (h.column.columnDef.meta as any)?.align === "right" &&
                        "text-right",
                      (h.column.columnDef.meta as any)?.align === "center" &&
                        "text-center"
                    )}
                    onClick={
                      h.column.getCanSort()
                        ? h.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    {h.isPlaceholder
                      ? null
                      : flexRender(
                          h.column.columnDef.header,
                          h.getContext()
                        )}
                    {(
                      {
                        asc: " ▲",
                        desc: " ▼",
                      } as Record<string, string>
                    )[h.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        (cell.column.columnDef.meta as any)?.align ===
                          "right" && "text-right",
                        (cell.column.columnDef.meta as any)?.align ===
                          "center" && "text-center"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllLeafColumns().length || 1}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2">
        {/* Mobile */}
        <div className="flex w-full items-center justify-between sm:hidden">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              if (manual) setPageIndexState((p) => Math.max(0, p - 1));
              else table.previousPage();
              scrollIntoViewIfNeeded(scrollTo);
            }}
            disabled={!canPrev}
          >
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            Showing {startEntry} to {endEntry} of {total} results
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              if (manual) setPageIndexState((p) => p + 1);
              else table.nextPage();
              scrollIntoViewIfNeeded(scrollTo);
            }}
            disabled={!canNext}
          >
            Next
          </Button>
        </div>

        {/* Desktop */}
        <div className="hidden w-full items-center justify-between sm:flex">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-semibold">{startEntry}</span> to{" "}
            <span className="font-semibold">{endEntry}</span> of{" "}
            <span className="font-semibold">{total}</span> results
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              aria-label="Previous"
              onClick={() => {
                if (manual) setPageIndexState((p) => Math.max(0, p - 1));
                else table.previousPage();
                scrollIntoViewIfNeeded(scrollTo);
              }}
              disabled={!canPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {buildPageItems(page + 1, pageCount, 2).map((item, idx) => {
              if (item === "…") {
                return (
                  <Button
                    key={`dots-${idx}`}
                    variant="outline"
                    size="icon"
                    className="h-9 min-w-[72px] rounded-full px-4 inline-flex items-center justify-center text-sm cursor-default"
                    disabled
                  >
                    …
                  </Button>
                );
              }
              const pNum = item as number;
              const isActive = pNum === page + 1;
              return (
                <Button
                  key={`p-${pNum}`}
                  variant={isActive ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-9 min-w-[72px] rounded-full px-4",
                    "inline-flex items-center justify-center text-sm"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    if (manual) setPageIndexState(pNum - 1);
                    else table.setPageIndex(pNum - 1);
                    scrollIntoViewIfNeeded(scrollTo);
                  }}
                >
                  {pNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              aria-label="Next"
              onClick={() => {
                if (manual) setPageIndexState((p) => p + 1);
                else table.nextPage();
                scrollIntoViewIfNeeded(scrollTo);
              }}
              disabled={!canNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
