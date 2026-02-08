export const config = { runtime: "edge" };

export default async function handler() {

  const res = await fetch(
    "https://raw.githubusercontent.com/ikrumon123/lottery-backend/main/data/latest.json",
    { cache: "no-store" }
  );

  const text = await res.text();

  return new Response(text, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60"
    }
  });
}
