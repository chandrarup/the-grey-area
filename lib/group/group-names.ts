/**
 * Memorable two-word group names. Assigned uniquely within a batch.
 * Short session codes remain as secondary join identifiers.
 */
export const GROUP_NAME_POOL = [
  "Harbor Table",
  "North Bridge",
  "Iron Ledger",
  "Quiet Harbor",
  "Cedar Crossing",
  "Silver Quay",
  "Amber Court",
  "Stone Lantern",
  "Maple Annex",
  "Copper Line",
  "Glass Harbor",
  "Pine Gallery",
  "Ash Corridor",
  "River Bench",
  "Oak Pavilion",
  "Steel Meridian",
  "Ivory Gate",
  "Slate Workshop",
  "Bronze Archive",
  "Fog Landing",
  "Tide Chamber",
  "Lantern Row",
  "Granite Forum",
  "Willow Dock",
  "Ember Hall",
  "Coastal Ledger",
  "Summit Annex",
  "Paper Mill",
  "Night Quay",
  "Daybreak Court",
  "Hollow Bridge",
  "Signal Yard",
  "Anchor Gallery",
  "Blue Pier",
  "Redwood Desk",
  "Canvas Bay",
  "Field Station",
  "Mirror Wharf",
  "Silent Atlas",
  "Open Ledger",
  "North Lantern",
  "South Quay",
  "West Archive",
  "East Crossing",
  "Quiet Meridian",
  "Iron Harbor",
  "Soft Ledger",
  "Bright Dock",
] as const;

export function pickUniqueGroupNames(
  count: number,
  reserved: string[] = [],
): string[] {
  const used = new Set(reserved.map((n) => n.trim().toLowerCase()));
  const available = GROUP_NAME_POOL.filter(
    (n) => !used.has(n.toLowerCase()),
  );
  // Shuffle available
  const pool = [...available];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i < pool.length) {
      out.push(pool[i]!);
    } else {
      // Overflow: numbered fallback still unique within batch
      let n = i + 1;
      let candidate = `Group ${n}`;
      while (used.has(candidate.toLowerCase()) || out.includes(candidate)) {
        n += 1;
        candidate = `Group ${n}`;
      }
      out.push(candidate);
    }
  }
  return out;
}
