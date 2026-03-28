"use client";

import { useId, useState } from "react";

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-2 text-lg font-bold text-white mb-3 group"
      >
        <span className="w-1 h-5 bg-lime-400 rounded-full" />
        <span className="flex-1 text-left">{title}</span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 group-hover:text-lime-400 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div id={contentId}>{children}</div>}
    </section>
  );
}
