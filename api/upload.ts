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

    const { filename, content } = body || {};

    if (!filename || !content) {
      const msg = { error: 'Missing "filename" or "content" (base64) in request body.' };
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

    // Clean filename
    const cleanName = filename.replace(/\s+/g, '-');
    const safeFilename = /^\d+_/.test(cleanName)
      ? cleanName
      : `${Date.now()}_${cleanName}`;
    const targetUrl = `https://api.github.com/repos/kevildesignn/kevils-design-board/contents/Visual-design/${safeFilename}`;

    const ghRes = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Kevils-Design-Board-Vercel',
      },
      body: JSON.stringify({
        message: `Upload poster: ${safeFilename}`,
        content,
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

    if (!ghRes.ok) {
      const errorData = await ghRes.json().catch(() => ({}));
      const msg = {
        error: errorData.message || `GitHub API error (${ghRes.status})`,
      };
      if (res?.status) return res.status(ghRes.status).json(msg);
      return new Response(JSON.stringify(msg), {
        status: ghRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cdnUrl = `https://cdn.jsdelivr.net/gh/kevildesignn/kevils-design-board@main/Visual-design/${safeFilename}`;
    const result = {
      success: true,
      filename: safeFilename,
      cdnUrl,
    };

    if (res?.status) return res.status(200).json(result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const msg = { error: err?.message || 'Internal server error while uploading.' };
    if (res?.status) return res.status(500).json(msg);
    return new Response(JSON.stringify(msg), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
