import Link from "next/link";

type Props = { searchParams: Promise<{ session_id?: string }> };

export default async function ThanksPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sessionId = sp.session_id;

  return (
    <main
      style={{
        maxWidth: "640px",
        margin: "0 auto",
        padding: "2.5rem 1.25rem 4rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", margin: "0 0 1rem" }}>Thank you</h1>
      <p style={{ color: "var(--color-muted)", margin: "0 0 1rem" }}>
        Checkout completed. Your Stripe webhook should upsert the subscription in Supabase (when
        configured). Open Telegram and send <code>/status</code> to the bot if you linked your chat
        id on the landing page.
      </p>
      {sessionId ? (
        <p style={{ fontSize: "0.9rem", wordBreak: "break-all" }}>
          Session id: <code>{sessionId}</code>
        </p>
      ) : null}
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/" style={{ fontWeight: 600 }}>
          ← Back to landing
        </Link>
      </p>
    </main>
  );
}
