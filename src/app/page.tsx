import { Comparator } from "@/components/comparator/Comparator";

export default function Home() {
  return (
    <main className="max-w-[1200px] mx-auto px-8 pt-20 pb-24">
      <header className="mb-20">
        <div className="flex justify-between items-center mb-14 pb-6 border-b border-[var(--border)] font-mono text-xs uppercase tracking-[0.15em] text-[var(--ink-mute)]">
          <span className="flex items-center">
            <span className="inline-block w-2 h-2 bg-[var(--accent)] rounded-full mr-2 animate-pulse" />
            yournextbg
          </span>
          <span>v0.1 · early build</span>
        </div>
        <h1 className="font-serif font-light text-[clamp(56px,9vw,120px)] leading-[0.92] tracking-[-0.04em] mb-8">
          Find your <span className="font-extrabold italic text-[var(--accent)]">next</span> board game.
        </h1>
        <p className="text-[22px] italic text-[var(--ink-dim)] max-w-3xl leading-snug font-light">
          A recommender built on a 12-axis profile — what plays similarly at the table, not just what other people happen to own.
        </p>
      </header>

      <Comparator />

      <footer className="mt-24 pt-8 border-t border-[var(--border)] text-center font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--ink-mute)]">
        Methodology v1 · MDA · Quantic Foundry · BGG forum consensus
      </footer>
    </main>
  );
}
