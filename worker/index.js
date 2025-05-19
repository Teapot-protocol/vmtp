export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Basic routing
    if (request.method === 'GET' && url.pathname === '/messages') {
      if (!env.MESSAGES) {
        return new Response('KV namespace not configured', { status: 500 });
      }

      const id = url.searchParams.get('id');
      if (id) {
        const stored = await env.MESSAGES.get(id);
        if (!stored) {
          return new Response('Not Found', { status: 404 });
        }
        return new Response(stored, {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const list = await env.MESSAGES.list();
      const messages = [];
      for (const key of list.keys) {
        const item = await env.MESSAGES.get(key.name);
        if (item) {
          messages.push({ id: key.name, ...JSON.parse(item) });
        }
      }

      return new Response(JSON.stringify(messages), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    let data;
    try {
      data = await request.json();
    } catch (err) {
      return new Response('Bad Request', { status: 400 });
    }

    // Validate required fields
    const { sender, recipients, subject, body, metadata = {} } = data;
    if (!sender || !recipients || !subject || !body) {
      return new Response('Missing fields', { status: 400 });
    }
    if (!Array.isArray(recipients)) {
      return new Response('Recipients must be an array', { status: 400 });
    }

    const message = { sender, recipients, subject, body, metadata };
    console.log('Received VMTP message', message);

    let id;
    if (env.MESSAGES) {
      id = Date.now().toString();
      await env.MESSAGES.put(id, JSON.stringify(message));
    }

    if (env.SERVER_URL) {
      try {
        const resp = await fetch(env.SERVER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        if (!resp.ok) {
          console.log('Upstream server responded with', resp.status);
        }
      } catch (err) {
        console.log('Error forwarding message', err);
      }
    }

    return new Response(
      JSON.stringify({ status: 'accepted', id }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
};
