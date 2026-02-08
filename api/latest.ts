import { kv } from '@vercel/kv';

export const config = { runtime: "edge" };

const SOURCE = "https://indialotteryapi.com/wp-json/klr/v1/latest";
const MAX_AGE = 120;

export default async function handler() {

  let cached = await kv.get<any>("latest_result");

  // refresh if missing or old
  if (!cached || Date.now() - (cached.collected_at || 0) > MAX_AGE * 1000) {
    try {
      const res = await fetch(SOURCE, { cache: "no-store" });

      if (res.ok) {
        const fresh = await res.json();

        cached = {
          ...fresh,
          collected_at: Date.now()
        };

        // store latest
        await kv.set("latest_result", cached);

        // store archive by date
        await kv.set(`draw_${fresh.draw_date}`, cached);

        // add to list of draws
        let draws = (await kv.get<string[]>("draw_list")) || [];
        if (!draws.includes(fresh.draw_date)) {
          draws.unshift(fresh.draw_date);
          await kv.set("draw_list", draws);
        }
      }
    } catch {}
  }

  if (!cached) {
    return new Response(JSON.stringify({
      status: "waiting"
    }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify(cached), {
    headers: { "Content-Type": "application/json" }
  });
}
