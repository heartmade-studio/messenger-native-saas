import { CheckoutForm } from "@/components/CheckoutForm";

export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: "640px",
        margin: "0 auto",
        padding: "2.5rem 1.25rem 4rem",
      }}
    >
      <p
        style={{
          fontSize: "0.8rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-muted)",
          margin: "0 0 0.5rem",
        }}
      >
        Heartmade reference
      </p>
      <h1 style={{ fontSize: "1.75rem", lineHeight: 1.2, margin: "0 0 1rem" }}>
        Messenger-Native SaaS (demo landing)
      </h1>
      <p style={{ color: "var(--color-muted)", margin: "0 0 1.5rem" }}>
        This repository demonstrates a <strong>subscription product</strong> that customers use
        inside <strong>Telegram</strong> (or another messenger), with{" "}
        <strong>Stripe</strong> for billing, <strong>Supabase</strong> for data, and{" "}
        <strong>Vercel</strong> for the API and this page. See <code>README.md</code> and{" "}
        <code>ARCHITECTURE.md</code> for the full pattern.
      </p>

      <section
        style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-soft)",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", margin: "0 0 1rem" }}>Try the flow</h2>
        <ol style={{ margin: "0 0 1.25rem", paddingLeft: "1.25rem" }}>
          <li>
            Open your bot in Telegram, send <code>/start</code>, copy your <strong>chat id</strong>.
          </li>
          <li>
            Paste the chat id below and start checkout (use Stripe test mode in development).
          </li>
          <li>
            After payment, use <code>/status</code> in Telegram to read the row from Supabase.
          </li>
        </ol>
        <CheckoutForm />
      </section>

      <p style={{ fontSize: "0.9rem", color: "var(--color-muted)" }}>
        Case study: <strong>Moon Cue App</strong> — a real product built on the same pattern — is
        described in <code>docs/moon-cue-app-case-study.md</code>.
      </p>
    </main>
  );
}
