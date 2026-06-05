import * as React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { currency, number, pct } from "@/lib/format";
import { HOLDINGS, PORTFOLIO_TOTAL, type Holding } from "@/lib/data";
import { Sparkline } from "@/components/charts/Sparkline";

// Type-safe column metadata that drives right-alignment for numeric columns.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: "left" | "right";
  }
}

const col = createColumnHelper<Holding>();

const columns = [
  col.accessor("ticker", {
    header: "Holding",
    cell: (c) => (
      <div className="flex flex-col">
        <span className="font-medium text-ink">{c.getValue()}</span>
        <span className="text-xs text-ink-3">{c.row.original.name}</span>
      </div>
    ),
    enableSorting: true,
  }),
  col.accessor("sector", {
    header: "Sector",
    cell: (c) => <span className="text-ink-2">{c.getValue()}</span>,
    enableSorting: true,
  }),
  col.accessor("weightPct", {
    header: "Weight",
    cell: (c) => {
      const v = c.getValue();
      return (
        <div className="flex items-center justify-end gap-2">
          <span className="tnum text-ink">{v.toFixed(1)}%</span>
          <span className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-sunken md:block" aria-hidden>
            <span
              className="block h-full rounded-full bg-brand/70"
              style={{ width: `${Math.min(100, (v / 13) * 100)}%` }}
            />
          </span>
        </div>
      );
    },
    meta: { align: "right" },
  }),
  col.accessor("marketValue", {
    header: "Market value",
    cell: (c) => <span className="tnum text-ink">{currency(c.getValue())}</span>,
    meta: { align: "right" },
  }),
  col.accessor("dayChangePct", {
    header: "Day",
    cell: (c) => {
      const v = c.getValue();
      return (
        <span className={cn("tnum font-medium", v >= 0 ? "text-pos" : "text-neg")}>
          {pct(v)}
        </span>
      );
    },
    meta: { align: "right" },
  }),
  col.accessor("contribPct", {
    header: "Contrib.",
    cell: (c) => {
      const v = c.getValue();
      return (
        <span className={cn("tnum", v >= 0 ? "text-pos" : "text-neg")}>{pct(v, 3)}</span>
      );
    },
    meta: { align: "right" },
  }),
  col.accessor("spark", {
    header: "30d",
    cell: (c) => {
      const s = c.getValue();
      const up = (s[s.length - 1] ?? 0) >= (s[0] ?? 0);
      return (
        <div className="hidden justify-end md:flex">
          <Sparkline data={s} positive={up} />
        </div>
      );
    },
    enableSorting: false,
    meta: { align: "right" },
  }),
];

export function HoldingsGrid() {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "weightPct", desc: true },
  ]);

  const table = useReactTable({
    data: HOLDINGS,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">
          Sample model portfolio: top 10 holdings by weight. Synthetic data; column headers are
          sortable.
        </caption>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-line">
              {hg.headers.map((header) => {
                const align = (header.column.columnDef.meta as { align?: string } | undefined)?.align;
                const sorted = header.column.getIsSorted();
                const canSort = header.column.getCanSort();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"
                    }
                    className={cn(
                      "whitespace-nowrap px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-3",
                      align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "inline-flex items-center gap-1 rounded transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                          align === "right" && "flex-row-reverse"
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : sorted === "desc" ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-line/60 transition-colors hover:bg-mint/[0.12]"
            >
              {row.getVisibleCells().map((cell) => {
                const align = (cell.column.columnDef.meta as { align?: string } | undefined)?.align;
                return (
                  <td
                    key={cell.id}
                    className={cn(
                      "px-3 py-2.5 align-middle",
                      align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-line-strong font-medium">
            <td className="px-3 py-2.5 text-ink" colSpan={3}>
              Top 10 holdings
            </td>
            <td className="tnum px-3 py-2.5 text-right text-ink">{currency(PORTFOLIO_TOTAL)}</td>
            <td className="px-3 py-2.5" colSpan={3} />
          </tr>
        </tfoot>
      </table>
      <p className="mt-3 px-1 font-mono text-[11px] leading-relaxed text-ink-3">
        TanStack Table (headless) · styled entirely with the design-system tokens above · {number(HOLDINGS.length)} rows,
        client-side sort · tabular figures. Synthetic data, no client holdings.
      </p>
    </div>
  );
}
