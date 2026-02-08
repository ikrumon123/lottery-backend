import { kv } from '@vercel/kv';

export const config = { runtime: "edge" };

export default async function handler(req: Request) {

  const url = new URL(req.url);
  const date = url.searchParams.get("date");

  if (!date)
    return new Response(JSON.stringify({ error: "date required" }), { status: 400 });

  const data = await kv.get(`draw_${date}`);

  if (!data)
    return new Response(JSON.stringify({ error: "draw not found" }), { status: 404 });

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}
