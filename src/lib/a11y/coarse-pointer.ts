/** True on phones and coarse-pointer devices — use to skip heavy desktop-only UX. */
export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
}
