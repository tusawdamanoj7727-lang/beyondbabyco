"use client";

import { AnimatePresence, motion } from "framer-motion";

import Icon from "../Icon";

export interface BulkActionsProps {
  count: number;
  loading?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onClear: () => void;
  publishLabel?: string;
  deleteLabel?: string;
  archiveLabel?: string;
}

export default function BulkActions({
  count,
  loading = false,
  onPublish,
  onUnpublish,
  onArchive,
  onDelete,
  onClear,
  publishLabel = "Publish",
  deleteLabel = "Delete",
  archiveLabel = "Archive",
}: BulkActionsProps) {
  const actionClass =
    "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50";

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          role="region"
          aria-label="Bulk actions"
          className="flex flex-wrap items-center gap-2 rounded-3xl border border-green-200 bg-green-50 px-3 py-2.5"
        >
          <span className="mr-1 flex items-center gap-2 text-sm font-semibold text-green-800">
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-green-500 px-1.5 text-xs text-cream-50">
              {count}
            </span>
            selected
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-1">
            {onPublish ? (
              <button type="button" onClick={onPublish} disabled={loading} className={`${actionClass} text-green-700 hover:bg-green-100`}>
                <Icon name="sparkles" size={16} /> {publishLabel}
              </button>
            ) : null}
            {onUnpublish ? (
              <button type="button" onClick={onUnpublish} disabled={loading} className={`${actionClass} text-green-700 hover:bg-green-100`}>
                <Icon name="close" size={16} /> Unpublish
              </button>
            ) : null}
            {onArchive ? (
              <button type="button" onClick={onArchive} disabled={loading} className={`${actionClass} text-green-700 hover:bg-green-100`}>
                <Icon name="audit" size={16} /> {archiveLabel}
              </button>
            ) : null}
            {onDelete ? (
              <button type="button" onClick={onDelete} disabled={loading} className={`${actionClass} text-terra-600 hover:bg-terra-100`}>
                <Icon name="close" size={16} /> {deleteLabel}
              </button>
            ) : null}
            <button type="button" onClick={onClear} disabled={loading} aria-label="Clear selection" className={`${actionClass} text-green-700/60 hover:bg-green-100`}>
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
