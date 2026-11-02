import Link from "next/link";

export function FloatingAddButton() {
  return (
    <Link
      href="/scan"
      className="
        fixed bottom-20 right-4 z-40
        w-14 h-14 rounded-full bg-accent text-white
        flex items-center justify-center
        shadow-md active:scale-95 transition-transform duration-100
        md:hidden min-h-0
      "
      aria-label="Scan new fruit"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </Link>
  );
}
