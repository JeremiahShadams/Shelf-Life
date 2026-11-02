import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 -mt-20">
      <h1 className="text-2xl font-bold tracking-tight">fresco</h1>
      <p className="text-sm text-text-muted mt-1">Know your fruit.</p>
      <Link
        href="/scan"
        className="mt-8 w-full max-w-[280px] bg-accent text-white text-center py-3.5 rounded-xl text-sm font-semibold active:scale-[0.97] transition-transform"
      >
        Scan Your First Fruit
      </Link>


      
    </div>
  );
}
