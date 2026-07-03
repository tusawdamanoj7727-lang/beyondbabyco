import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

export default function CatalogBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="container py-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-green-700/80">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 text-green-600/50" aria-hidden="true" />
              ) : null}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="rounded font-medium transition-colors hover:text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-500"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-semibold text-green-900" : undefined} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
