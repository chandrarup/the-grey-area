"use client";

import type { StoryArt, StoryFrame } from "@/lib/case/types";

/**
 * Line-art vignettes for consequence story frames. Drawn in currentColor so
 * they glow on the dark replay stage.
 */

const RULES: { art: StoryArt; match: RegExp }[] = [
  { art: "gap", match: /\b(gap|missing|stop mid|unfinished|stop updating|never wrote)/i },
  { art: "press", match: /journalist|reporter|press|headline|trade journal|story|draft alleging/i },
  { art: "regulator", match: /regulator|inquiry|documents|production|investigat/i },
  { art: "invoice", match: /invoice|billing|coordination services|line items|deliverable/i },
  { art: "ledger", match: /bank|ledger|payment|paid|vendor code|books|retainer/i },
  { art: "stamp", match: /approv|cleared|booked|backed/i },
  { art: "handshake", match: /signed|announced|partnership|on the file|met salim|closed the/i },
  { art: "phone", match: /ministry|stopped answering|went quiet|returns calls|aide|silence/i },
  { art: "board", match: /board|audit|committee/i },
  { art: "distant", match: /distant|went quiet on the call|professional/i },
];

export function pickArt(text: string): StoryArt {
  return RULES.find((r) => r.match.test(text))?.art ?? "skyline";
}

/** Split a narrative paragraph into short story frames. */
export function storyFrames(narrative: string): StoryFrame[] {
  const sentences = narrative
    .split(/(?<=[.!?])\s+(?=[A-Z‘“"'])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const merged: string[] = [];
  for (const s of sentences) {
    const last = merged[merged.length - 1];
    if (last && (last.length < 34 || s.length < 34) && last.length + s.length < 90) {
      merged[merged.length - 1] = `${last} ${s}`;
    } else {
      merged.push(s);
    }
  }
  return merged.map((text) => ({ art: pickArt(text), text }));
}

export function StoryArtwork({ art }: { art: StoryArt }) {
  const common = {
    viewBox: "0 0 240 140",
    className: "h-full w-full",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (art) {
    case "invoice":
      return (
        <svg {...common}>
          <rect x="78" y="10" width="84" height="118" rx="3" />
          <path d="M90 26h40M90 36h24" />
          {[54, 64, 74, 84].map((y) => (
            <path key={y} d={`M90 ${y}h60`} opacity="0.35" strokeDasharray="3 4" />
          ))}
          <rect x="86" y="96" width="68" height="14" rx="2" className="story-flash" stroke="#ff6b6b" />
          <text x="92" y="106" fontSize="8" fill="#ff8a8a" stroke="none">COORDINATION — ?</text>
        </svg>
      );
    case "stamp":
      return (
        <svg {...common}>
          <rect x="60" y="30" width="120" height="90" rx="3" opacity="0.6" />
          <path d="M74 50h70M74 62h50M74 74h62" opacity="0.35" />
          <g className="story-stamp">
            <rect x="116" y="78" width="80" height="26" rx="3" stroke="#ff6b6b" transform="rotate(-12 156 91)" />
            <text x="156" y="95" fontSize="10" fill="#ff8a8a" stroke="none" transform="rotate(-12 156 91)" letterSpacing="2" textAnchor="middle">APPROVED</text>
          </g>
        </svg>
      );
    case "press":
      return (
        <svg {...common}>
          <g className="story-spin-in">
            <rect x="52" y="18" width="136" height="104" rx="2" />
            <path d="M64 32h112" strokeWidth="3" />
            <path d="M64 44h80" strokeWidth="2.2" />
            <rect x="64" y="56" width="48" height="36" opacity="0.5" />
            {[58, 66, 74, 82, 90].map((y) => (
              <path key={y} d={`M120 ${y}h56`} opacity="0.35" />
            ))}
            <path d="M64 104h112M64 112h90" opacity="0.35" />
          </g>
          <circle cx="198" cy="22" r="10" className="story-flashbulb" fill="currentColor" opacity="0.15" />
        </svg>
      );
    case "regulator":
      return (
        <svg {...common}>
          <g className="story-slide-up">
            <rect x="58" y="34" width="124" height="80" rx="3" />
            <path d="M58 38l62 42 62-42" />
            <circle cx="120" cy="84" r="11" fill="currentColor" opacity="0.18" />
            <path d="M114 84l4 4 8-8" />
          </g>
          <text x="120" y="130" fontSize="8" fill="currentColor" stroke="none" opacity="0.7" letterSpacing="1.5" textAnchor="middle">DOCUMENT REQUEST</text>
        </svg>
      );
    case "ledger":
      return (
        <svg {...common}>
          <rect x="44" y="16" width="152" height="108" rx="3" />
          <path d="M44 34h152M124 16v108" opacity="0.5" />
          {[48, 62, 76, 104].map((y) => (
            <g key={y} opacity="0.4">
              <path d={`M54 ${y}h56`} />
              <path d={`M134 ${y}h48`} />
            </g>
          ))}
          <g className="story-flash" stroke="#ff6b6b">
            <path d="M54 90h56M134 90h48" />
            <path d="M188 84l6 6-6 6" />
          </g>
          <text x="140" y="29" fontSize="8" fill="currentColor" stroke="none">$</text>
        </svg>
      );
    case "handshake":
      return (
        <svg {...common}>
          <g className="story-left-in">
            <rect x="14" y="62" width="58" height="26" rx="3" fill="currentColor" fillOpacity="0.1" />
            <path d="M72 66c10-4 22-6 34-2l18 6c5 2 5 9 0 10l-14-2" />
            <path d="M72 84c12 4 26 4 38 0" />
          </g>
          <g className="story-right-in">
            <rect x="168" y="62" width="58" height="26" rx="3" fill="currentColor" fillOpacity="0.1" />
            <path d="M168 66c-10-4-24-4-36 2l-14 8c-4 3-1 9 4 8l16-4" />
            <path d="M168 84c-10 4-24 6-40 2" />
            <path d="M126 70l6 6M120 74l6 6M114 78l5 5" opacity="0.6" />
          </g>
          <path d="M120 40v10M104 46l5 6M136 46l-5 6" className="story-blink" opacity="0.7" />
          <text x="80" y="122" fontSize="9" fill="currentColor" stroke="none" opacity="0.7" letterSpacing="2">AGREEMENT SIGNED</text>
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <rect x="94" y="14" width="52" height="104" rx="9" />
          <path d="M112 22h16" opacity="0.6" />
          <g className="story-blink">
            <path d="M106 52h28" opacity="0.4" />
            <text x="104" y="70" fontSize="8" fill="currentColor" stroke="none">No reply</text>
          </g>
          <path d="M152 30c6 6 6 16 0 22M160 24c10 10 10 24 0 34" opacity="0.25" strokeDasharray="2 4" />
          <text x="100" y="134" fontSize="8" fill="currentColor" stroke="none" opacity="0.6">Ministry · 6 days</text>
        </svg>
      );
    case "board":
      return (
        <svg {...common}>
          <ellipse cx="120" cy="74" rx="72" ry="28" />
          {[-60, -30, 0, 30, 60].map((dx) => (
            <g key={dx}>
              <rect x={116 + dx} y="32" width="8" height="8" rx="2" opacity="0.6" />
              <rect x={116 + dx} y="108" width="8" height="8" rx="2" opacity="0.6" />
            </g>
          ))}
          <rect x="102" y="66" width="36" height="16" rx="2" className="story-flash" />
        </svg>
      );
    case "gap":
      return (
        <svg {...common}>
          <path d="M40 34h50l8 10h102v80H40z" />
          <rect x="58" y="54" width="36" height="52" rx="2" opacity="0.6" />
          <rect x="102" y="54" width="36" height="52" rx="2" strokeDasharray="4 4" className="story-blink" stroke="#ff6b6b" />
          <rect x="146" y="54" width="36" height="52" rx="2" opacity="0.6" />
          <text x="108" y="84" fontSize="14" fill="#ff8a8a" stroke="none">?</text>
        </svg>
      );
    case "distant":
      return (
        <svg {...common}>
          <path d="M20 120h200" opacity="0.4" />
          <g className="story-walk-away">
            <circle cx="160" cy="62" r="9" />
            <path d="M160 72v26M160 98l-8 20M160 98l8 20M160 80l-10 10M160 80l10 10" />
          </g>
          <g opacity="0.7">
            <circle cx="60" cy="58" r="11" />
            <path d="M60 70v30M60 100l-9 20M60 100l9 20M60 80l-12 12M60 80l12 12" />
          </g>
        </svg>
      );
    case "door":
      return (
        <svg {...common}>
          <path d="M70 128V14h100v114" />
          <path d="M20 128h200" opacity="0.4" />
          <g className="story-door">
            <path d="M74 126V18h92v108z" fill="currentColor" fillOpacity="0.08" />
            <circle cx="154" cy="74" r="3" />
          </g>
          <path d="M120 128v-6" opacity="0.3" className="story-blink" />
        </svg>
      );
    case "hourglass":
      return (
        <svg {...common}>
          <path d="M90 14h60M90 126h60" />
          <path d="M96 14c0 34 48 38 48 56s-48 22-48 56M144 14c0 34-48 38-48 56s48 22 48 56" />
          <path d="M108 40h24l-12 18z" fill="currentColor" fillOpacity="0.35" className="story-blink" />
          <path d="M120 70v40" strokeDasharray="1 5" className="story-sand" />
          <path d="M106 118h28l-14-10z" fill="currentColor" fillOpacity="0.35" />
          <text x="160" y="74" fontSize="8" fill="currentColor" stroke="none" opacity="0.7">REVIEW OPEN</text>
        </svg>
      );
    case "network":
      return (
        <svg {...common}>
          {[
            [120, 70, 60, 34],
            [120, 70, 182, 30],
            [120, 70, 48, 106],
            [120, 70, 190, 104],
            [60, 34, 182, 30],
            [48, 106, 190, 104],
          ].map(([x1, y1, x2, y2], i) => (
            <path
              key={i}
              d={`M${x1} ${y1}L${x2} ${y2}`}
              opacity="0.5"
              strokeDasharray="4 4"
              className="story-dash"
            />
          ))}
          <circle cx="120" cy="70" r="12" fill="currentColor" fillOpacity="0.2" />
          <circle cx="120" cy="66" r="3.5" />
          <path d="M113 77c1-4 4-6 7-6s6 2 7 6" />
          {[
            [60, 34],
            [182, 30],
            [48, 106],
            [190, 104],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="7" className="story-blink" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </svg>
      );
    case "voices":
      return (
        <svg {...common}>
          <circle cx="62" cy="62" r="12" />
          <path d="M40 120c2-22 12-32 22-32s20 10 22 32" />
          <circle cx="178" cy="62" r="12" />
          <path d="M156 120c2-22 12-32 22-32s20 10 22 32" />
          <g className="story-left-in">
            <rect x="84" y="20" width="58" height="22" rx="8" />
            <text x="92" y="35" fontSize="8" fill="currentColor" stroke="none">“It’s normal.”</text>
          </g>
          <g className="story-right-in">
            <rect x="100" y="58" width="60" height="22" rx="8" stroke="#ff6b6b" />
            <text x="106" y="73" fontSize="8" fill="#ff8a8a" stroke="none">“It is not.”</text>
          </g>
        </svg>
      );
    case "pen":
      return (
        <svg {...common}>
          <rect x="64" y="12" width="96" height="116" rx="3" />
          {[30, 42, 54].map((y) => (
            <path key={y} d={`M76 ${y}h70`} opacity="0.4" />
          ))}
          <path d="M76 70h70" stroke="#ff6b6b" className="story-strike" />
          <path d="M76 84h50" className="story-write" strokeDasharray="60" />
          <path d="M76 98h62" className="story-write" strokeDasharray="70" style={{ animationDelay: "0.8s" }} />
          <g className="story-pen">
            <path d="M172 40l-34 60 -4 12 10-8 34-60z" fill="currentColor" fillOpacity="0.15" />
          </g>
        </svg>
      );
    case "skyline":
    default:
      return (
        <svg {...common}>
          <path d="M10 118h220" opacity="0.5" />
          <path d="M24 118V84h18v34M50 118V70h14v48M72 118V92h22v26" opacity="0.6" />
          <path d="M140 118V30M140 30h70M140 30l-26 16M196 30v26" />
          <path d="M196 56v10" className="story-swing" />
          <circle cx="210" cy="30" r="2.5" fill="#ff6b6b" stroke="none" className="story-blink" />
          <path d="M104 118c10-10 22-10 32 0" opacity="0.4" />
        </svg>
      );
  }
}
