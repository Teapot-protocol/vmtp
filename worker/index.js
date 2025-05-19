export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    let data;
    try {
      data = await request.json();
    } catch (err) {
      return new Response('Bad Request', { status: 400 });
    }

    // Expected fields: sender, recipients, subject, body, metadata
    console.log('Received VMTP message', data);

    // Optionally store message if KV namespace provided
    if (env.MESSAGES) {
      const key = Date.now().toString();
      await env.MESSAGES.put(key, JSON.stringify(data));
    }

    return new Response('accepted');
  }
};
