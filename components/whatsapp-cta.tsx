"use client";

import { useEffect, useState } from "react";
import {
  CTA_COPY,
  WHATSAPP_URL,
  getWhatsAppUrl,
  type WhatsAppMessage,
  type WhatsAppPlacement,
} from "@/lib/whatsapp";

const DISMISS_KEY = "whatsapp-cta-dismissed";
const DISMISS_TTL_DAYS = 7;

type CommonProps = {
  /** Pre-written copy variant. Pick by audience intent. */
  message: WhatsAppMessage;
  /** Where this CTA is placed (drives UTM + tracking). */
  placement: WhatsAppPlacement;
  /** Optional className override. */
  className?: string;
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Variant 1 — Sticky mobile bottom (highest converter on Africa mobile)    */
/* ────────────────────────────────────────────────────────────────────────── */

export function WhatsAppStickyMobile({
  message = "africa-alerts",
}: {
  message?: WhatsAppMessage;
}) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start true to avoid flash

  useEffect(() => {
    if (!WHATSAPP_URL) return;

    // Check if dismissed in last 7 days
    try {
      const stored = localStorage.getItem(DISMISS_KEY);
      if (stored) {
        const ts = parseInt(stored, 10);
        const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
        if (ageDays < DISMISS_TTL_DAYS) {
          return; // still dismissed
        }
      }
    } catch {
      /* localStorage may be blocked, continue */
    }
    setDismissed(false);

    // Show after 30% scroll (proxy for engagement)
    const onScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrolled > 0.3) {
        setShow(true);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function dismiss() {
    setShow(false);
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
  }

  if (!WHATSAPP_URL || dismissed || !show) return null;

  const copy = CTA_COPY[message];
  const url = getWhatsAppUrl("sticky-mobile");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-slide-up">
      <div className="mx-3 mb-3 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-900/40 border border-emerald-500/50 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* WhatsApp logo SVG */}
          <div className="shrink-0 w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <svg
              viewBox="0 0 32 32"
              className="w-6 h-6"
              aria-hidden="true"
            >
              <path
                fill="#25D366"
                d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.4 2 7.7L0 32l8.5-2c2.2 1.2 4.8 1.9 7.5 1.9 8.8 0 16-7.2 16-16S24.8 0 16 0zm9.3 22.6c-.4 1.1-2.3 2.1-3.2 2.2-.8.1-1.9.2-3-.2-.7-.2-1.6-.5-2.7-1-4.8-2.1-7.9-6.9-8.2-7.3-.2-.3-1.9-2.6-1.9-4.9 0-2.3 1.2-3.5 1.7-3.9.4-.5 1-.6 1.3-.6h.9c.3 0 .7-.1 1 .8.4 1 1.4 3.4 1.5 3.6.1.2.2.5 0 .8-.2.3-.3.5-.5.8-.3.3-.5.6-.8.9-.3.3-.5.6-.2 1.1.3.5 1.4 2.4 3.1 3.8 2.2 2 4 2.6 4.5 2.9.5.3.8.2 1.1-.1.3-.4 1.3-1.5 1.6-2 .3-.5.6-.4 1.1-.3.5.2 3 1.4 3.5 1.7.5.3.9.4 1 .6.1.4.1 1.5-.3 2.5z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm leading-tight">{copy.title}</p>
            <p className="text-emerald-50 text-xs leading-snug mt-0.5 line-clamp-2">
              {copy.subtitle}
            </p>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-white text-emerald-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-emerald-50 transition-colors whitespace-nowrap"
          >
            Suivre
          </a>
          <button
            onClick={dismiss}
            aria-label="Fermer"
            className="shrink-0 text-white/70 hover:text-white p-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Variant 2 — In-article inline card (for streaming/pronostic articles)    */
/* ────────────────────────────────────────────────────────────────────────── */

export function WhatsAppInlineCard({ message, className = "" }: CommonProps) {
  if (!WHATSAPP_URL) return null;
  const copy = CTA_COPY[message];
  const url = getWhatsAppUrl("inline-card");

  return (
    <aside
      className={`my-8 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-5 sm:p-6 ${className}`}
      aria-label="Rejoindre la chaîne WhatsApp 360 Foot"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30">
          <svg viewBox="0 0 32 32" className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true">
            <path
              fill="#fff"
              d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.4 2 7.7L0 32l8.5-2c2.2 1.2 4.8 1.9 7.5 1.9 8.8 0 16-7.2 16-16S24.8 0 16 0zm9.3 22.6c-.4 1.1-2.3 2.1-3.2 2.2-.8.1-1.9.2-3-.2-.7-.2-1.6-.5-2.7-1-4.8-2.1-7.9-6.9-8.2-7.3-.2-.3-1.9-2.6-1.9-4.9 0-2.3 1.2-3.5 1.7-3.9.4-.5 1-.6 1.3-.6h.9c.3 0 .7-.1 1 .8.4 1 1.4 3.4 1.5 3.6.1.2.2.5 0 .8-.2.3-.3.5-.5.8-.3.3-.5.6-.8.9-.3.3-.5.6-.2 1.1.3.5 1.4 2.4 3.1 3.8 2.2 2 4 2.6 4.5 2.9.5.3.8.2 1.1-.1.3-.4 1.3-1.5 1.6-2 .3-.5.6-.4 1.1-.3.5.2 3 1.4 3.5 1.7.5.3.9.4 1 .6.1.4.1 1.5-.3 2.5z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-display text-base sm:text-lg font-bold text-emerald-900 leading-tight">
            {copy.title}
          </p>
          <p className="text-sm text-slate-700 mt-1 leading-relaxed">{copy.subtitle}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 32 32" className="w-4 h-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.4 2 7.7L0 32l8.5-2c2.2 1.2 4.8 1.9 7.5 1.9 8.8 0 16-7.2 16-16S24.8 0 16 0z"
              />
            </svg>
            {copy.button}
            <span aria-hidden className="ml-0.5">→</span>
          </a>
        </div>
      </div>
    </aside>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Variant 3 — Footer link (always visible, low-key)                        */
/* ────────────────────────────────────────────────────────────────────────── */

export function WhatsAppFooterLink() {
  if (!WHATSAPP_URL) return null;
  const url = getWhatsAppUrl("footer-link");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
      aria-label="Rejoindre la chaîne WhatsApp 360 Foot"
    >
      <svg viewBox="0 0 32 32" className="w-4 h-4" aria-hidden="true">
        <path
          fill="#25D366"
          d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.4 2 7.7L0 32l8.5-2c2.2 1.2 4.8 1.9 7.5 1.9 8.8 0 16-7.2 16-16S24.8 0 16 0z"
        />
      </svg>
      Chaîne WhatsApp 360 Foot
    </a>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Variant 4 — Hero section (for streaming hub landing)                     */
/* ────────────────────────────────────────────────────────────────────────── */

export function WhatsAppHeroSection({ message, className = "" }: CommonProps) {
  if (!WHATSAPP_URL) return null;
  const copy = CTA_COPY[message];
  const url = getWhatsAppUrl("hero-section");

  return (
    <section
      className={`rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-8 sm:p-12 shadow-xl shadow-emerald-900/20 overflow-hidden relative ${className}`}
    >
      {/* Decorative blur */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" aria-hidden />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl" aria-hidden />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
          <svg viewBox="0 0 32 32" className="w-9 h-9 sm:w-11 sm:h-11" aria-hidden="true">
            <path
              fill="#fff"
              d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.4 2 7.7L0 32l8.5-2c2.2 1.2 4.8 1.9 7.5 1.9 8.8 0 16-7.2 16-16S24.8 0 16 0zm9.3 22.6c-.4 1.1-2.3 2.1-3.2 2.2-.8.1-1.9.2-3-.2-.7-.2-1.6-.5-2.7-1-4.8-2.1-7.9-6.9-8.2-7.3-.2-.3-1.9-2.6-1.9-4.9 0-2.3 1.2-3.5 1.7-3.9.4-.5 1-.6 1.3-.6h.9c.3 0 .7-.1 1 .8.4 1 1.4 3.4 1.5 3.6.1.2.2.5 0 .8-.2.3-.3.5-.5.8-.3.3-.5.6-.8.9-.3.3-.5.6-.2 1.1.3.5 1.4 2.4 3.1 3.8 2.2 2 4 2.6 4.5 2.9.5.3.8.2 1.1-.1.3-.4 1.3-1.5 1.6-2 .3-.5.6-.4 1.1-.3.5.2 3 1.4 3.5 1.7.5.3.9.4 1 .6.1.4.1 1.5-.3 2.5z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
            {copy.title}
          </h2>
          <p className="mt-2 text-emerald-50 text-base sm:text-lg leading-relaxed">
            {copy.subtitle}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 bg-white text-emerald-700 font-bold text-base px-7 py-3 rounded-xl shadow-lg hover:bg-emerald-50 transition-all hover:-translate-y-0.5"
          >
            {copy.button}
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
