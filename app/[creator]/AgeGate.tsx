"use client";
import { useEffect, useState } from "react";

const COOKIE = "bs_age_verified";

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return m ? m[2] : null;
}

function setCookie(name: string, value: string, days: number) {
  const exp = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value}; expires=${exp}; path=/; SameSite=Lax`;
}

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    setVerified(getCookie(COOKIE) === "1");
  }, []);

  function confirm() {
    setCookie(COOKIE, "1", 365);
    setVerified(true);
  }

  function deny() {
    window.location.href = "https://spotlightly.app";
  }

  // Still checking cookie
  if (verified === null) return null;

  if (!verified) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "var(--bg)",
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(36px, 6vw, 56px)",
          fontWeight: 300,
          color: "#fff",
          letterSpacing: "-0.02em",
          marginBottom: 8,
        }}>
          Back<span style={{ color: "var(--accent)" }}>stage</span>ly
        </div>
        <p style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 48,
        }}>
          Exclusive creator content · 18+ only
        </p>

        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: 12,
          padding: "40px 48px",
          maxWidth: 440,
          width: "100%",
        }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 12,
          }}>
            Are you 18 or older?
          </p>
          <p style={{
            fontSize: 13,
            color: "var(--text-soft)",
            lineHeight: 1.7,
            marginBottom: 32,
          }}>
            This site contains adult content intended for viewers 18 years of age
            and older. By entering, you confirm you are of legal age in your
            jurisdiction to view such material.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={confirm} className="btn btn--primary" style={{ width: "100%", padding: "14px 0" }}>
              Yes, I am 18 or older — Enter
            </button>
            <button onClick={deny} className="btn btn--ghost" style={{ width: "100%", fontSize: 12 }}>
              No, take me back
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 24, lineHeight: 1.6 }}>
            By entering you agree to our terms of service. This site is operated
            by Tahoma Systems LLC in compliance with 18 U.S.C. § 2257.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
