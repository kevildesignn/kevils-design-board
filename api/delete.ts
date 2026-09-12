export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    if (res?.status) return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  if (req.method !== 'POST') {
    const msg = { error: 'Method not allowed. Use POST.' };
    if (res?.status) return res.status(405).json(msg);
    return new Response(JSON.stringify(msg), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let body: any = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // keep as is
      }
    } else if (!body && typeof req.json === 'function') {
      body = await req.json();
    }

    const { filename } = body || {};

    if (!filename) {
      const msg = { error: 'Missing "filename" in request body.' };
      if (res?.status) return res.status(400).json(msg);
      return new Response(JSON.stringify(msg), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      const msg = {
        error:
          'GITHUB_TOKEN environment variable is not configured in Vercel. Please add GITHUB_TOKEN in your Vercel Project Settings > Environment Variables.',
      };
      if (res?.status) return res.status(500).json(msg);
      return new Response(JSON.stringify(msg), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Get file SHA from GitHub
    const getUrl = `https://api.github.com/repos/kevildesignn/kevils-design-board/contents/published-designs/${encodeURIComponent(filename)}?ref=main`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Kevils-Design-Board-Vercel',
      },
    });

    if (getRes.status === 404) {
      const result = { success: true, message: 'File was already absent from GitHub.' };
      if (res?.status) return res.status(200).json(result);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!getRes.ok) {
      const errorData = await getRes.json().catch(() => ({}));
      const msg = { error: errorData.message || `GitHub error fetching file (${getRes.status})` };
      if (res?.status) return res.status(getRes.status).json(msg);
      return new Response(JSON.stringify(msg), {
        status: getRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileData = await getRes.json();
    const sha = fileData.sha;

    // 2. Delete file using SHA
    const deleteUrl = `https://api.github.com/repos/kevildesignn/kevils-design-board/contents/published-designs/${encodeURIComponent(filename)}`;
    const delRes = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Kevils-Design-Board-Vercel',
      },
      body: JSON.stringify({
        message: `Delete poster: ${filename}`,
        sha,
        branch: 'main',
        committer: {
          name: 'Kevil Darji',
          email: 'kevildesignn@gmail.com',
        },
        author: {
          name: 'Kevil Darji',
          email: 'kevildesignn@gmail.com',
        },
      }),
    });

    if (!delRes.ok) {
      const errorData = await delRes.json().catch(() => ({}));
      const msg = { error: errorData.message || `GitHub delete failed (${delRes.status})` };
      if (res?.status) return res.status(delRes.status).json(msg);
      return new Response(JSON.stringify(msg), {
        status: delRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = { success: true, message: `"${filename}" deleted successfully.` };
    if (res?.status) return res.status(200).json(result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const msg = { error: err?.message || 'Internal server error while deleting.' };
    if (res?.status) return res.status(500).json(msg);
    return new Response(JSON.stringify(msg), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
