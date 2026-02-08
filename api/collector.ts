import { kv } from '@vercel/kv';

export const config = { runtime: "edge" };

export default async function handler() {

  // fetch latest lottery result
  const res = await fetch(
    "https://indialotteryapi.com/wp-json/klr/v1/latest",
    { cache: "no-store" }
  );

  if (!res.ok)
    return new Response("source failed");

  const data = await res.json();

  // store in vercel database
  await kv.set("latest_result", {
    ...data,
    collected_at: Date.now()
  });

  return new Response("saved");
}
