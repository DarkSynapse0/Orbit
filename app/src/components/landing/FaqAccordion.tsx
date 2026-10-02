"use client";

import { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";

type Item = { q: string; a: string };

// Product inbox — update to the real contact address.
const CONTACT_EMAIL = "mannish079@gmail.com";

// Single-open accordion: opening one closes the others, with a smooth
// height + fade motion. Cards match the surface-tile style used above.
// A final row lets anyone send in their own question by email.
export function FaqAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const [question, setQuestion] = useState("");

  const send = () => {
    const q = question.trim();
    if (!q) return;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      "Question about Orbit",
    )}&body=${encodeURIComponent(q)}`;
  };

  return (
    <div>
      <div className="space-y-3">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={f.q}
            className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
              isOpen
                ? "border-[var(--border-strong)] bg-[var(--background)]"
                : "border-[var(--border)] bg-[var(--surface)]"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center gap-4 px-5 py-5 text-left sm:px-7"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--border-strong)] font-mono text-[11px] text-[var(--muted)]">
                {i + 1}
              </span>
              <span className="flex-1 text-[16px] font-medium sm:text-[17px]">{f.q}</span>
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)] transition-transform duration-300 ${
                  isOpen ? "rotate-45" : ""
                }`}
                aria-hidden
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>

            {/* animated reveal: grid-rows 0fr -> 1fr gives a smooth auto-height */}
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p
                  className={`px-5 pb-6 pl-[3.5rem] text-[15px] leading-relaxed text-[var(--muted)] transition-opacity duration-300 sm:px-7 sm:pl-[4.25rem] ${
                    isOpen ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {f.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      </div>

      {/* ask your own question — sends an email to the product inbox */}
      <div className="mt-12 flex items-center gap-3 rounded-full border border-[var(--border-strong)] bg-[var(--background)] p-2 shadow-[0_16px_44px_-24px_rgba(0,0,0,0.28)] transition-colors focus-within:border-[var(--accent)]">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[var(--border-strong)] font-mono text-[22px] leading-none text-[var(--muted)]">
          ?
        </span>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Still have a question? Ask us…"
          aria-label="Ask your own question"
          className="min-w-0 flex-1 bg-transparent px-1 text-[17px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none sm:text-[18px]"
        />
        <button
          type="button"
          onClick={send}
          aria-label="Send your question"
          className="group grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--foreground)] text-[var(--background)] transition hover:opacity-90 disabled:opacity-40"
          disabled={!question.trim()}
        >
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
