import fetch from 'node-fetch';

export async function sendMessage(workerUrl, sender, recipients, subject, body, metadata = {}) {
  const res = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender, recipients, subject, body, metadata })
  });
  if (!res.ok) {
    throw new Error(`Worker responded with ${res.status}`);
  }
  return res.text();
}
