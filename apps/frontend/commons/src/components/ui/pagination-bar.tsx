"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  /** Etiqueta plural para el resumen, p. ej. "empresas". */
  itemLabel?: string;
}

function getPageWindow(current: number, total: number): (number | "…")[] {
  const delta = 1;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  const range: (number | "…")[] = [1];

  if (left > 2) range.push("…");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("…");
  if (total > 1) range.push(total);

  return range;
}

/** Controles de paginación; no renderiza nada si todo cabe en una sola página. */
export function PaginationBar({ page, totalPages, onPageChange, totalItems, pageSize, itemLabel }: PaginationBarProps) {
  if (totalPages <= 1) return null;

  const pages = getPageWindow(page, totalPages);

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      {typeof totalItems === "number" && typeof pageSize === "number" && (
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} de {totalItems}
          {itemLabel ? ` ${itemLabel}` : ""}
        </p>
      )}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: "var(--text-dim)", backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)" }}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs" style={{ color: "var(--text-faint)" }}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className="w-8 h-8 rounded-lg text-xs font-medium transition-colors"
              style={
                p === page
                  ? { color: "var(--brand-fg)", background: "var(--brand-gradient)" }
                  : { color: "var(--text-dim)", backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)" }
              }
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: "var(--text-dim)", backgroundColor: "var(--surface-profile)", border: "1px solid var(--border-hair)" }}
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
