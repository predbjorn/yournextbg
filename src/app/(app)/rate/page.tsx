import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-session";
import { getRateQueue, getRatedHistory } from "@/lib/rate/queries";
import { CardStack } from "@/components/rate/card-stack";
import { Stamp } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RatePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const [queue, history] = await Promise.all([
    getRateQueue(50),
    getRatedHistory(),
  ]);

  return (
    <main className="min-h-screen bg-cs-paper-deep cs-grain">
      <div className="container mx-auto px-6 py-10 max-w-4xl">
        <header className="mb-8">
          <Stamp color="muted">rate flow</Stamp>
          <h1
            className="font-cs-display text-cs-ink mt-1"
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            How was it?
          </h1>
        </header>
        <CardStack initialQueue={queue} initialHistory={history} />
      </div>
    </main>
  );
}
