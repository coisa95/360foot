"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
    // Reload to activate analytics scripts
    window.location.reload();
  }

  function refuse() {
    localStorage.setItem("cookie-consent", "refused");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white/95 backdrop-blur-sm p-4 shadow-2xl">
        <p className="text-sm text-slate-600 leading-relaxed">
          Ce site utilise des cookies pour am&eacute;liorer votre exp&eacute;rience et analyser le trafic.{" "}
          <Link href="/confidentialite" className="underline text-emerald-600 hover:text-emerald-500">
            En savoir plus
          </Link>
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={accept}
            aria-label="Accepter les cookies"
            className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
          >
            Accepter
          </button>
          <button
            onClick={refuse}
            aria-label="Refuser les cookies"
            className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
