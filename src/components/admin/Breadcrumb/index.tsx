"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import Icon from "../Icon";
import { ALL_NAV_ITEMS } from "../nav";

const LABEL_BY_HREF = new Map(ALL_NAV_ITEMS.map((i) => [i.href, i.label]));

function humanize(segment: string): string {
  return segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface Crumb {
  label: string;
  href: string;
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean); // ["admin", ...]
  const crumbs: Crumb[] = [{ label: "Dashboard", href: "/admin" }];

  let href = "/admin";
  for (const segment of segments.slice(1)) {
    href += `/${segment}`;
    crumbs.push({ label: LABEL_BY_HREF.get(href) ?? humanize(segment), href });
  }

  return crumbs;
}

export default function Breadcrumb() {
  const pathname = usePathname() ?? "/admin";
  const crumbs = buildCrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              {index > 0 && (
                <li aria-hidden="true" className="text-green-700/30">
                  <Icon name="chevronRight" size={14} />
                </li>
              )}
              <li className="min-w-0">
                {isLast ? (
                  <span
                    aria-current="page"
                    className="truncate font-heading font-semibold text-green-900"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="truncate rounded text-green-700/70 transition-colors hover:text-green-900 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-terra-500/50"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
