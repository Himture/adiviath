// Best-effort only: each serverless instance has its own memory. The Vercel Firewall rule is the real limit.
const hits = new Map<string, number[]>();
export function allow(ip: string, now = Date.now(), max = 5, windowMs = 600_000): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { hits.set(ip, recent); return false; }
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}
