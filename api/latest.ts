import { kv } from '@vercel/kv';

export const config = { runtime: "edge" };

const SOURCE = "https://indialotteryapi.com/wp-json/klr/v1/latest";
const MAX_AGE = 120; // seconds (2 minutes)

export default async function handler() {

  let cached = await kv.get<any>("latest_result");

  // if no data OR older than 2 minutes → refresh
  if (!cached || (Date.now() - (cached.collected_at || 0)) > MAX_AGE * 1000) {

    try {
      const res = await fetch(SOURCE, { cache: "no-store" });

      if (res.ok) {
        const fresh = await res.json();

        cached = {
          ...fresh,
          collected_at: Date.now()
        };

        await kv.set("latest_result", cached);
      }
    } catch (e) {
      // ignore fetch failure and serve old cache
    }
  }

  if (!cached) {
    return new Response(JSON.stringify({
      status: "waiting",
      message: "Results not yet published"
    }), { headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify(cached), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60"
    }
  });
}
