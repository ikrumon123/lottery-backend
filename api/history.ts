import { kv } from '@vercel/kv';

export const config = { runtime: "edge" };

export default async function handler(req: Request) {

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 10);
  const offset = Number(url.searchParams.get("offset") || 0);

  try {
    const res = await fetch(
      `https://indialotteryapi.com/wp-json/klr/v1/history?limit=${limit}&offset=${offset}`,
      { cache: "no-store" }
    );

    if (!res.ok)
      throw new Error();

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });

  } catch {
    return new Response(JSON.stringify({
      error: "history unavailable"
    }), { status: 500 });
  }
}
