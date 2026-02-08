export const config = { runtime: "edge" };

// base64 encoder for edge runtime
function toBase64(str: string) {
  return btoa(unescape(encodeURIComponent(str)));
}

async function getFileSha() {
  const res = await fetch(
    "https://api.github.com/repos/ikrumon123/lottery-backend/contents/data/latest.json",
    {
      headers: {
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json"
      }
    }
  );

  const json = await res.json();
  return json.sha;
}

export default async function handler() {

  // fetch external lottery api
  const source = await fetch(
    "https://indialotteryapi.com/wp-json/klr/v1/latest",
    { cache: "no-store" }
  );

  if (!source.ok) {
    return new Response("source fetch failed", { status: 500 });
  }

  const data = await source.json();

  // get sha
  const sha = await getFileSha();

  const content = JSON.stringify({
    ...data,
    collected_at: Date.now()
  }, null, 2);

  // update github file
  const update = await fetch(
    "https://api.github.com/repos/ikrumon123/lottery-backend/contents/data/latest.json",
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: "auto lottery update",
        content: toBase64(content),
        sha: sha
      })
    }
  );

  if (!update.ok) {
    const err = await update.text();
    return new Response("github write failed: " + err, { status: 500 });
  }

  return new Response("updated");
}
