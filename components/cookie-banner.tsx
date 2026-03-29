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
      <div className="mx-auto max-w-xl rounded-xl border border-gray-700 bg-dark-card p-4 shadow-2xl">
        <p className="text-sm text-gray-300 leading-relaxed">
          Ce site utilise des cookies pour am&eacute;liorer votre exp&eacute;rience et analyser le trafic.{" "}
          <Link href="/confidentialite" className="underline text-lime-400 hover:text-lime-300">
            En savoir plus
          </Link>
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={accept}
            className="rounded-lg bg-lime-400 px-4 py-1.5 text-sm font-semibold text-black hover:bg-lime-300 transition-colors"
          >
            Accepter
          </button>
          <button
            onClick={refuse}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
