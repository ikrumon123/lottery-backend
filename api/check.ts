import { kv } from '@vercel/kv';

export const config = { runtime: "edge" };

export default async function handler(req: Request) {

  const url = new URL(req.url);
  const ticket = url.searchParams.get("ticket");

  if (!ticket)
    return new Response(JSON.stringify({ error: "ticket required" }), { status: 400 });

  const latest: any = await kv.get("latest_result");

  if (!latest)
    return new Response(JSON.stringify({ error: "results not ready" }), { status: 404 });

  const number = ticket.slice(-4);

  for (const [prize, list] of Object.entries(latest.prizes)) {
    if (Array.isArray(list)) {
      for (const t of list) {
        if (t.endsWith(number)) {
          return new Response(JSON.stringify({
            prize,
            ticket
          }));
        }
      }
    }
  }

  return new Response(JSON.stringify({
    prize: "No Prize",
    ticket
  }));
}
