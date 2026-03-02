import { useState } from "react";
import { useSearchParams } from "react-router-dom";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function ZapierAuth() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clientId = searchParams.get("client_id") || "";
  const redirectUri = searchParams.get("redirect_uri") || "";
  const state = searchParams.get("state") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/zapier-oauth-authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, client_id: clientId, redirect_uri: redirectUri, state }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "-apple-system, system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: 40, maxWidth: 400, width: "100%" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Connect to Zapier</h1>
        <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
          Sign in to authorize <strong>Zapier</strong> to access your Personalized Pages account.
        </p>

        {error && (
          <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "#fef2f2", borderRadius: 8 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, marginBottom: 16, outline: "none" }}
          />

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, marginBottom: 16, outline: "none" }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: 12, background: loading ? "#94a3b8" : "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? "default" : "pointer" }}
          >
            {loading ? "Authorizing..." : "Authorize"}
          </button>
        </form>

        <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", marginTop: 16 }}>Personalized Pages</p>
      </div>
    </div>
  );
}
