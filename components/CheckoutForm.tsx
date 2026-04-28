"use client";

import { useState } from "react";

export function CheckoutForm() {
  const [telegramChatId, setTelegramChatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramChatId: telegramChatId.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("No redirect URL returned");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem" }}>
      <label style={{ display: "grid", gap: "0.35rem" }}>
        <span style={{ fontWeight: 600 }}>Telegram chat id (recommended)</span>
        <input
          name="telegramChatId"
          value={telegramChatId}
          onChange={(e) => setTelegramChatId(e.target.value)}
          placeholder="Send /start to your bot and paste the number here"
          autoComplete="off"
          style={{
            padding: "0.65rem 0.85rem",
            borderRadius: "8px",
            border: "1px solid rgba(26, 24, 22, 0.15)",
            fontSize: "1rem",
          }}
        />
        <span style={{ fontSize: "0.875rem", color: "var(--color-muted)" }}>
          Links Stripe billing rows to your Telegram chat so <code>/status</code> works.
        </span>
      </label>
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "0.75rem 1.25rem",
          borderRadius: "8px",
          border: "none",
          fontWeight: 600,
          fontSize: "1rem",
          cursor: loading ? "wait" : "pointer",
          background: "var(--color-accent)",
          color: "#fff",
        }}
      >
        {loading ? "Redirecting…" : "Subscribe (Stripe Checkout)"}
      </button>
      {error ? (
        <p role="alert" style={{ color: "#b42318", margin: 0 }}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
