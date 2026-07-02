// Server-only helper — sends a Web Push via web-push's request builder + fetch.
// Compatible with Cloudflare Workers (uses fetch, not node http).
import webpush from "web-push";

export interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  image?: string;
  tag?: string;
}

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contact@rya-cosmetique.com";
  if (!pub || !priv) throw new Error("VAPID keys missing");
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export async function sendPush(
  sub: StoredSubscription,
  payload: PushPayload,
): Promise<{ ok: boolean; status: number; endpoint: string }> {
  ensureConfigured();
  const details = webpush.generateRequestDetails(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    },
    JSON.stringify(payload),
    { TTL: 60 },
  );
  const res = await fetch(details.endpoint, {
    method: details.method,
    headers: details.headers as Record<string, string>,
    body: details.body as BodyInit,
  });
  return { ok: res.ok, status: res.status, endpoint: sub.endpoint };
}

export async function sendPushToAll(
  subs: StoredSubscription[],
  payload: PushPayload,
): Promise<{ sent: number; failed: number; goneEndpoints: string[] }> {
  const results = await Promise.allSettled(subs.map((s) => sendPush(s, payload)));
  let sent = 0;
  let failed = 0;
  const goneEndpoints: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      if (r.value.ok) sent++;
      else {
        failed++;
        if (r.value.status === 404 || r.value.status === 410) goneEndpoints.push(r.value.endpoint);
      }
    } else {
      failed++;
    }
  }
  return { sent, failed, goneEndpoints };
}
