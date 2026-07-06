import { memo } from "react";

function HeroBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream-100/90 to-cream-50" />
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-green-50/40 to-transparent" />
      <div className="homepage-grain absolute inset-0 opacity-[0.03]" />
    </div>
  );
}

export default memo(HeroBackground);
