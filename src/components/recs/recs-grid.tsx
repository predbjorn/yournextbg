"use client";

/**
 * Client wrapper around the rec cards so optimistic dismissals can drop
 * a card without a server round-trip. The page hands us the initial
 * server-rendered list; we manage state locally from there.
 */

import { useState } from "react";
import { ProfileRecCard } from "./profile-rec-card";
import type { ProfileCandidate } from "@/lib/recs/queries";

export function RecsGrid({ initial }: { initial: ProfileCandidate[] }) {
  const [recs, setRecs] = useState(initial);

  function dismiss(gameId: string) {
    setRecs((rs) => rs.filter((r) => r.id !== gameId));
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
      {recs.map((rec, i) => (
        <li key={rec.id}>
          <ProfileRecCard rec={rec} rank={i + 1} onDismiss={dismiss} />
        </li>
      ))}
    </ul>
  );
}
