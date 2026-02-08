import { kv } from '@vercel/kv';

export const config = { runtime: "edge" };

export default async function handler(req: Request) {

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 10);
  const offset = Number(url.searchParams.get("offset") || 0);

  const draws = (await kv.get<string[]>("draw_list")) || [];

  const slice = draws.slice(offset, offset + limit);

  const results = [];

  for (const d of slice) {
    const data = await kv.get(`draw_${d}`);
    if (data) results.push(data);
  }

  return new Response(JSON.stringify({
    total: draws.length,
    limit,
    offset,
    items: results
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
