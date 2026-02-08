import { kv } from '@vercel/kv';

export const config = { runtime: "edge" };

export default async function handler() {

  const data = await kv.get("latest_result");

  if (!data) {
    return new Response(JSON.stringify({
      status: "waiting",
      message: "Results not available yet"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60"
    }
  });
}
