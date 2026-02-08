export const config = { runtime: "edge" };

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

  // 1. fetch lottery source
  const source = await fetch(
    "https://indialotteryapi.com/wp-json/klr/v1/latest",
    { cache: "no-store" }
  );

  if (!source.ok) {
    return new Response("Source failed", { status: 500 });
  }

  const data = await source.json();

  // 2. get sha of existing file
  const sha = await getFileSha();

  // 3. update GitHub file
  await fetch(
    "https://api.github.com/repos/ikrumon123/lottery-backend/contents/data/latest.json",
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "auto lottery update",
        content: Buffer.from(JSON.stringify({
          ...data,
          collected_at: Date.now()
        }, null, 2)).toString("base64"),
        sha: sha
      })
    }
  );

  return new Response("updated");
}
