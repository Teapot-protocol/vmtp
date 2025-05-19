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

    if (request.method === 'POST' && url.pathname === '/batch') {
      let data;
      try {
        data = await request.json();
      } catch {
        return new Response('Bad Request', { status: 400 });
      }

      if (!data.messages || !Array.isArray(data.messages)) {
        return new Response('Bad Request', { status: 400 });
      }

      const ids = [];
      for (const [i, msg] of data.messages.entries()) {
        const res = await handleMessage(msg, env);
        if (res.id) ids.push(res.id);
      }
      return new Response(
        JSON.stringify({ status: 'accepted', ids }),
        { headers: { 'Content-Type': 'application/json' } }
      );
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

    const result = await handleMessage(data, env);
    return new Response(
      JSON.stringify({ status: 'accepted', id: result.id }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
};

async function handleMessage(data, env) {
  const { sender, recipients, subject, body, metadata = {}, attachments = [] } =
    data;
  if (!sender || !recipients || !subject || !body) {
    return { error: 'Missing fields' };
  }
  if (!Array.isArray(recipients)) {
    return { error: 'Recipients must be an array' };
  }

  const message = { sender, recipients, subject, body, metadata, attachments };
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
  return { id };
}
