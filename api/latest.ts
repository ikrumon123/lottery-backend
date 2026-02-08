import { kv } from '@vercel/kv';

export const config = { runtime: "edge" };

const SOURCE = "https://indialotteryapi.com/wp-json/klr/v1/latest";

/* Detect Kerala draw time (IST) */
function isDrawTime() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  const hour = ist.getHours();
  const minute = ist.getMinutes();

  const total = hour * 60 + minute;

  // 2:45 PM to 4:30 PM IST
  return total >= (14 * 60 + 45) && total <= (16 * 60 + 30);
}

export default async function handler() {

  // read cached result
  let cached: any = await kv.get("latest_result");

  // refresh frequency
  const MAX_AGE = isDrawTime() ? 30 : 600; // seconds

  const expired =
    !cached ||
    Date.now() - (cached.collected_at || 0) > MAX_AGE * 1000;

  if (expired) {
    try {

      const res = await fetch(SOURCE, { cache: "no-store" });

      if (res.ok) {

        const fresh = await res.json();

        /* CHANGE DETECTION */
        const oldFirst = cached?.first?.ticket;
        const oldPrizes = JSON.stringify(cached?.prizes || {});
        const newPrizes = JSON.stringify(fresh?.prizes || {});

        const changed =
          !cached ||
          oldFirst !== fresh?.first?.ticket ||
          oldPrizes !== newPrizes;

        if (changed) {

          cached = {
            ...fresh,
            collected_at: Date.now(),
            live_updated: true
          };

          // save latest
          await kv.set("latest_result", cached);

          // archive by date
          await kv.set(`draw_${fresh.draw_date}`, cached);

          // maintain draw list
          let draws: string[] = (await kv.get("draw_list")) || [];

          if (!draws.includes(fresh.draw_date)) {
            draws.unshift(fresh.draw_date);
            await kv.set("draw_list", draws);
          }
        }
      }

    } catch (e) {
      // ignore fetch failure, serve old cache
    }
  }

  if (!cached) {
    return new Response(JSON.stringify({
      status: "waiting",
      message: "Results not published yet"
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify(cached), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30"
    }
  });
}
