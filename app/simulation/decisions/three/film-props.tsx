"use client";

/** Realistic paper/screen props for consequence film shots. Always light: they're physical objects. */

export function Newspaper({ text }: { text: string }) {
  return (
    <div className="film-prop w-[34rem] max-w-[86vw] rotate-[-2deg] bg-[#f4f0e6] px-8 py-6 text-[#151515] shadow-[0_40px_90px_rgba(0,0,0,0.6)]">
      <div className="flex items-end justify-between border-b-4 border-double border-[#151515] pb-2">
        <p className="font-serif text-4xl font-bold tracking-tight">The Financial Ledger</p>
        <p className="text-[10px] uppercase tracking-widest text-[#555]">Business · Markets</p>
      </div>
      <p className="mt-4 font-serif text-[1.9rem] font-bold leading-[1.1]">{text}</p>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-1.5">
          {[95, 88, 92, 70, 90, 84, 60].map((w, i) => (
            <div key={i} className="h-[5px] rounded bg-[#151515]/20" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="h-24 bg-gradient-to-br from-[#bcb6a8] to-[#8e887a]" />
      </div>
    </div>
  );
}

export function RegulatorLetter({ text }: { text: string }) {
  return (
    <div className="film-prop w-[30rem] max-w-[86vw] rotate-[1.5deg] bg-white px-10 py-8 text-[#1d1d1f] shadow-[0_40px_90px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-3 border-b border-[#ddd] pb-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1d2b45] font-serif text-xs text-[#1d2b45]">OPI</span>
        <div>
          <p className="text-sm font-semibold">Office of Procurement Integrity</p>
          <p className="text-[11px] text-[#777]">Enforcement Division</p>
        </div>
      </div>
      <p className="mt-5 text-[11px] uppercase tracking-widest text-[#b3261e]">Document request — mandatory</p>
      <p className="mt-2 font-serif text-xl leading-snug">{text}</p>
      <div className="mt-5 space-y-1.5">
        {[90, 85, 70].map((w, i) => (
          <div key={i} className="h-[4px] rounded bg-[#1d1d1f]/15" style={{ width: `${w}%` }} />
        ))}
      </div>
      <p className="mt-6 font-[cursive] text-lg text-[#1d2b45]">— Director of Investigations</p>
    </div>
  );
}

export function BankStatement({ text }: { text: string }) {
  const rows = [
    ["Advisory retainer", "−120,000.00", false],
    ["Market intelligence services", "−95,000.00", true],
    ["Coordination — current qtr", "−385,000.00", true],
    ["Travel — Ardania", "−8,420.00", false],
  ] as const;
  return (
    <div className="film-prop w-[32rem] max-w-[86vw] rotate-[-1deg] bg-white px-8 py-7 text-[#1d1d1f] shadow-[0_40px_90px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between border-b border-[#ddd] pb-2">
        <p className="text-sm font-semibold">Account statement · Ardania bid office</p>
        <p className="text-[11px] text-[#777]">Page 3 of 7</p>
      </div>
      <table className="mt-3 w-full text-[13px]">
        <tbody>
          {rows.map(([d, a, flag]) => (
            <tr key={d} className={`border-b border-[#eee] ${flag ? "bg-[#fde8e6]" : ""}`}>
              <td className="py-2">{d}</td>
              <td className="py-2 text-right tabular-nums">{a}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 font-serif text-lg leading-snug text-[#b3261e]">{text}</p>
    </div>
  );
}

export function PhoneSilence({ text }: { text: string }) {
  return (
    <div className="film-prop w-[17rem] rotate-[3deg] rounded-[2.4rem] border-[7px] border-[#111] bg-gradient-to-b from-[#1b2233] to-[#090b10] px-5 pb-8 pt-12 text-white shadow-[0_40px_90px_rgba(0,0,0,0.7)]">
      <p className="text-center text-5xl font-light">11:48</p>
      <div className="mt-8 space-y-2">
        {["Ministry clarification — sent", "Follow-up — sent", "Second follow-up — sent"].map((m) => (
          <div key={m} className="rounded-2xl bg-white/10 px-3 py-2 text-[12px]">
            <p className="text-white/85">{m}</p>
            <p className="text-[10px] text-white/45">Delivered · no reply</p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-center text-[12px] leading-snug text-white/70">{text}</p>
    </div>
  );
}

export function FileIndex({ text }: { text: string }) {
  const items = [
    ["First decision — recorded", true],
    ["Diligence review — v3", true],
    ["Diligence review — final", false],
    ["Board summary", true],
    ["Written scope of services", false],
  ] as const;
  return (
    <div className="film-prop w-[30rem] max-w-[86vw] rotate-[-1.5deg] rounded-t-lg bg-[#e8d3a5] px-8 pb-8 pt-6 text-[#2a2216] shadow-[0_40px_90px_rgba(0,0,0,0.6)]">
      <p className="text-[11px] uppercase tracking-widest text-[#6b5a3a]">Records index · for production</p>
      <ul className="mt-4 space-y-2 bg-[#fdfaf2] px-5 py-4 text-[14px]">
        {items.map(([label, ok]) => (
          <li key={label} className={`flex justify-between ${ok ? "" : "text-[#b3261e]"}`}>
            <span className={ok ? "" : "line-through decoration-dashed"}>{label}</span>
            <span>{ok ? "✓" : "missing"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-serif text-lg leading-snug">{text}</p>
    </div>
  );
}

export function Redline({ text }: { text: string }) {
  return (
    <div className="film-prop w-[30rem] max-w-[86vw] rotate-[1deg] bg-white px-9 py-8 text-[#1d1d1f] shadow-[0_40px_90px_rgba(0,0,0,0.6)]">
      <p className="text-[11px] uppercase tracking-widest text-[#777]">Draft · file narrative · v4</p>
      <p className="mt-4 text-[14px] leading-relaxed">
        Engagement of the adviser was{" "}
        <span className="text-[#b3261e] line-through">authorised without written scope</span>{" "}
        <span className="rounded bg-[#e6f4ea] px-1 text-[#1e6b3a]">reviewed in line with local practice</span>
        . Payments were{" "}
        <span className="text-[#b3261e] line-through">approved under local discretion</span>{" "}
        <span className="rounded bg-[#e6f4ea] px-1 text-[#1e6b3a]">subject to standard controls</span>.
      </p>
      <p className="mt-6 font-serif text-lg leading-snug">{text}</p>
    </div>
  );
}
