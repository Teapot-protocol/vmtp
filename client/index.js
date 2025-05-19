import fetch from 'node-fetch';

/**
 * Send a single VMTP message to the worker.
 *
 * @param {string} workerUrl - Endpoint of the VMTP worker.
 * @param {string} sender - Address of the sender.
 * @param {string[]} recipients - List of recipient addresses.
 * @param {string} subject - Subject line.
 * @param {string} body - Message body.
 * @param {object} [metadata] - Optional metadata key/value pairs.
 * @param {object[]} [attachments] - Optional attachments ({ filename, contentType, content }).
 *   The attachment content can be a base64 string or Buffer.
 * @returns {Promise<string>} Response from the worker.
 */
export async function sendMessage(
  workerUrl,
  sender,
  recipients,
  subject,
  body,
  metadata = {},
  attachments = []
) {
  const payload = { sender, recipients, subject, body, metadata };

  if (attachments.length > 0) {
    payload.attachments = attachments.map((a) => ({
      filename: a.filename,
      contentType: a.contentType,
      content:
        typeof a.content === 'string'
          ? a.content
          : Buffer.from(a.content).toString('base64'),
    }));
  }

  const res = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Worker responded with ${res.status}`);
  }

  return res.text();
}

/**
 * Send multiple messages using the worker batch endpoint.
 * This requires the worker to implement a `/batch` route.
 *
 * @param {string} workerUrl
 * @param {Array<object>} messages - Array of message objects accepted by sendMessage.
 */
export async function sendBatch(workerUrl, messages) {
  const res = await fetch(`${workerUrl.replace(/\/$/, '')}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error(`Worker responded with ${res.status}`);
  }

  return res.text();
}

/**
 * Convenience VMTP client class.
 */
export class VMTPClient {
  constructor(workerUrl, defaultSender = 'noreply@example.com') {
    this.workerUrl = workerUrl;
    this.defaultSender = defaultSender;
  }

  async send(recipients, subject, body, options = {}) {
    const sender = options.sender || this.defaultSender;
    return sendMessage(
      this.workerUrl,
      sender,
      recipients,
      subject,
      body,
      options.metadata,
      options.attachments
    );
  }

  async sendBatch(messages) {
    return sendBatch(this.workerUrl, messages);
  }
}
