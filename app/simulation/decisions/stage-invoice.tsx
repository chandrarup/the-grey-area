"use client";

import type { Invoice } from "@/lib/case/types";

function money(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function monogram(vendor: string) {
  return vendor
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

/** A paper invoice, styled like a real one. Always light — it's paper. */
export function InvoicePaper({
  invoice,
  compact,
}: {
  invoice: Invoice;
  compact?: boolean;
}) {
  const total = invoice.items.reduce((sum, i) => sum + i.amount, 0);
  return (
    <div
      className={`relative mx-auto bg-[#fdfcf9] text-left text-[#1d1d1f] shadow-[0_30px_80px_rgba(0,0,0,0.35)] ${
        compact
          ? "w-[25rem] px-7 py-6 text-[10px]"
          : "invoice-in w-full max-w-[38rem] px-10 py-9 text-[12px]"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 20% 0%, rgba(0,0,0,0.025), transparent 60%)",
      }}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#1d2b45] font-serif text-sm tracking-wider text-white">
            {monogram(invoice.vendor)}
          </span>
          <div>
            <p className="font-serif text-[1.35em] leading-tight">
              {invoice.vendor}
            </p>
            <p className="text-[0.9em] text-[#6b6b70]">{invoice.vendorAddress}</p>
          </div>
        </div>
        <p className="font-serif text-[2em] uppercase tracking-[0.18em] text-[#1d2b45]">
          Invoice
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-y border-[#e3e1dc] py-3">
        <div>
          <p className="text-[0.8em] uppercase tracking-wider text-[#8a8a90]">
            Invoice no.
          </p>
          <p className="mt-0.5 font-medium tabular-nums">{invoice.number}</p>
        </div>
        <div>
          <p className="text-[0.8em] uppercase tracking-wider text-[#8a8a90]">
            Issue date
          </p>
          <p className="mt-0.5 font-medium">{invoice.date}</p>
        </div>
        <div>
          <p className="text-[0.8em] uppercase tracking-wider text-[#8a8a90]">
            Terms
          </p>
          <p className="mt-0.5 font-medium">{invoice.terms}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[0.8em] uppercase tracking-wider text-[#8a8a90]">
          Bill to
        </p>
        <p className="mt-0.5 font-medium">{invoice.billTo}</p>
      </div>

      <table className="mt-5 w-full border-collapse">
        <thead>
          <tr className="bg-[#f1efea] text-[0.85em] uppercase tracking-wider text-[#6b6b70]">
            <th className="px-2 py-1.5 text-left font-medium">Description</th>
            <th className="px-2 py-1.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.description} className="border-b border-[#ecebe6]">
              <td className="px-2 py-2">{item.description}</td>
              <td className="px-2 py-2 text-right tabular-nums">
                {money(invoice.currency, item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 ml-auto w-1/2 space-y-1 text-right">
        <div className="flex justify-between text-[#6b6b70]">
          <span>Subtotal</span>
          <span className="tabular-nums">{money(invoice.currency, total)}</span>
        </div>
        <div className="flex justify-between text-[#6b6b70]">
          <span>Tax</span>
          <span>Exempt</span>
        </div>
        <div className="flex justify-between border-t border-[#1d1d1f] pt-1.5 text-[1.15em] font-semibold">
          <span>Total due</span>
          <span className="tabular-nums">{money(invoice.currency, total)}</span>
        </div>
      </div>

      <p className="mt-6 text-[0.85em] text-[#8a8a90]">
        Remit to: {invoice.bank}
      </p>

      {invoice.stamp ? (
        <span
          className={`invoice-stamp absolute rotate-[-14deg] border-[3px] border-[#c0392b] px-3 py-1 font-bold uppercase tracking-[0.2em] text-[#c0392b] opacity-80 mix-blend-multiply ${
            compact ? "bottom-16 left-6 text-[10px]" : "bottom-24 left-10 text-sm"
          }`}
        >
          {invoice.stamp}
        </span>
      ) : null}

      {invoice.sticky && !compact ? (
        <div className="invoice-sticky absolute -right-8 top-24 w-44 rotate-[5deg] bg-[#fff2a8] px-3.5 py-3 font-[cursive] text-[13px] leading-snug text-[#3b3a2f] shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
          {invoice.sticky}
        </div>
      ) : null}
    </div>
  );
}
