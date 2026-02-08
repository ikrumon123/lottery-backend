import { kv } from '@vercel/kv';

export const config = { runtime: "edge" };

export default async function handler(req: Request) {

  const url = new URL(req.url);
  const date = url.searchParams.get("date");

  if (!date) {
    return new Response(JSON.stringify({
      error: "missing date parameter"
    }), { status: 400 });
  }

  // check cache first
  let cached = await kv.get<any>(`result_${date}`);

  // if not cached, fetch and store
  if (!cached) {
    try {
      const res = await fetch(
        `https://indialotteryapi.com/wp-json/klr/v1/by-date?date=${date}`,
        { cache: "no-store" }
      );

      if (res.ok) {
        cached = await res.json();
        await kv.set(`result_${date}`, cached);
      }
    } catch {}
  }

  if (!cached) {
    return new Response(JSON.stringify({
      error: "no data found"
    }), { status: 404 });
  }

  return new Response(JSON.stringify(cached), {
    headers: { "Content-Type": "application/json" }
  });
}
