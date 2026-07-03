"use client";

import { useRef, type ReactNode } from "react";

import Icon from "../Icon";
import { TableSkeleton } from "../LoadingState";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortKey?: string;
  align?: "left" | "right" | "center";
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleRow?: (id: string) => void;
  onToggleAll?: (checked: boolean) => void;
  sort?: { key: string; dir: "asc" | "desc" };
  onSort?: (key: string) => void;
  loading?: boolean;
  empty?: ReactNode;
  /** Enables a drag handle column and row drag-and-drop reordering. */
  reorderable?: boolean;
  /** Called with the new ordered list of row ids after a drag-drop. */
  onReorder?: (orderedIds: string[]) => void;
}

const alignClass = { left: "text-left", right: "text-right", center: "text-center" } as const;

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  selectable = false,
  selectedIds = [],
  onToggleRow,
  onToggleAll,
  sort,
  onSort,
  loading = false,
  empty,
  reorderable = false,
  onReorder,
}: DataTableProps<T>) {
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(getRowId(r)));
  const someSelected = selectedIds.length > 0 && !allSelected;
  const dragIndex = useRef<number | null>(null);

  function handleDrop(targetIndex: number) {
    const source = dragIndex.current;
    dragIndex.current = null;
    if (source === null || source === targetIndex || !onReorder) return;
    const next = [...rows];
    const [moved] = next.splice(source, 1);
    next.splice(targetIndex, 0, moved);
    onReorder(next.map(getRowId));
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-cream-300 bg-white p-3">
        <TableSkeleton />
      </div>
    );
  }

  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-cream-300 bg-white">
      <table className="w-full min-w-[840px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-cream-300 bg-cream-50/60 text-left">
            {reorderable && <th scope="col" className="w-10 px-2 py-3" aria-hidden="true" />}
            {selectable && (
              <th scope="col" className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => onToggleAll?.(e.target.checked)}
                  className="h-4 w-4 rounded border-cream-300 accent-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
                />
              </th>
            )}
            {columns.map((col) => {
              const isSorted = sort?.key === (col.sortKey ?? col.key);
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-bold uppercase tracking-wide text-green-700/50",
                    alignClass[col.align ?? "left"],
                    col.headerClassName,
                  )}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.sortKey ?? col.key)}
                      className="inline-flex items-center gap-1 rounded transition-colors hover:text-green-800 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
                      aria-label={`Sort by ${typeof col.header === "string" ? col.header : col.key}`}
                    >
                      {col.header}
                      <span className={cn("transition-opacity", isSorted ? "opacity-100" : "opacity-30")}>
                        <Icon name="chevronDown" size={14} className={cn(isSorted && sort?.dir === "asc" && "rotate-180")} />
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const id = getRowId(row);
            const selected = selectedIds.includes(id);
            return (
              <tr
                key={id}
                onDragOver={reorderable ? (e) => e.preventDefault() : undefined}
                onDrop={reorderable ? () => handleDrop(index) : undefined}
                className={cn(
                  "border-b border-cream-200 transition-colors last:border-0 hover:bg-cream-50/70",
                  selected && "bg-green-50/60",
                )}
              >
                {reorderable && (
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      draggable
                      onDragStart={() => {
                        dragIndex.current = index;
                      }}
                      onDragEnd={() => {
                        dragIndex.current = null;
                      }}
                      aria-label="Drag to reorder"
                      title="Drag to reorder"
                      className="grid h-7 w-7 cursor-grab place-items-center rounded-lg text-green-700/40 transition-colors hover:bg-cream-100 hover:text-green-700 active:cursor-grabbing focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
                    >
                      <span aria-hidden="true" className="text-base leading-none">⠿</span>
                    </button>
                  </td>
                )}
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select row"
                      checked={selected}
                      onChange={() => onToggleRow?.(id)}
                      className="h-4 w-4 rounded border-cream-300 accent-green-600 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 text-green-900", alignClass[col.align ?? "left"], col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
