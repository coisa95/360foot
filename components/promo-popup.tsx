"use client";

import { useState, useEffect } from "react";

const POPUP_DELAY = 3000; // 3 seconds

export function PromoPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), POPUP_DELAY);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-5 animate-in fade-in duration-500"
      style={{ background: "rgba(0,0,0,.65)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      <div className="relative max-w-[370px] w-full rounded-[28px] px-[30px] py-10 text-center overflow-visible animate-in slide-in-from-bottom-4 zoom-in-95 duration-500"
        style={{
          background: "linear-gradient(145deg, #E8ECF2, #D0D6E0)",
          border: "1px solid rgba(255,255,255,.6)",
          boxShadow: "0 20px 60px rgba(0,0,0,.3), 0 2px 0 rgba(255,255,255,.8) inset, 0 -2px 6px rgba(0,0,0,.08) inset",
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3.5 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-800 hover:bg-black/10 transition-all text-lg"
        >
          &times;
        </button>

        {/* Icon */}
        <div className="mb-4 text-5xl animate-bounce" style={{ animationDuration: "3s" }}>
          💎
        </div>

        {/* Heading */}
        <p className="text-sm font-semibold text-emerald-600 mb-1.5 tracking-wide uppercase">
          Faites de votre passion pour le football une source de revenu
        </p>
        <h2 className="text-xl font-bold mb-2.5 tracking-tight" style={{ color: "#0A1226" }}>
          Rejoins Dr BET sur WhatsApp
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          +2&nbsp;300 parieurs reçoivent déjà nos pronostics VIP gratuits chaque jour. Cotes sûres, analyses exclusives, opportunités en or.
        </p>

        {/* CTA */}
        <a
          href="https://whatsapp.com/channel/0029Vb7C35xL2ATtPwPMiW2C"
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="relative flex items-center justify-center gap-2.5 w-full py-4 px-5 rounded-2xl text-white font-extrabold text-[0.95rem] no-underline transition-all hover:-translate-y-0.5 active:translate-y-0"
          style={{
            background: "linear-gradient(135deg, #0A1226, #152244)",
            boxShadow: "0 8px 24px rgba(10,18,38,.35), 0 2px 0 rgba(255,255,255,.05) inset",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Rejoindre le canal VIP
        </a>
      </div>
    </div>
  );
}
