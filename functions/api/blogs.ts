interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 Database binding 'DB' not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status") || "Published";

    if (slug) {
      const stmt = env.DB.prepare("SELECT * FROM blogs WHERE slug = ? LIMIT 1");
      const blog = await stmt.bind(slug).first();
      if (!blog) {
        return new Response(JSON.stringify({ success: false, error: "Blog not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ success: true, blog }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    let query = "SELECT * FROM blogs WHERE 1=1";
    const params: any[] = [];

    if (status !== "All") {
      query += " AND status = ?";
      params.push(status);
    }

    if (category && category !== "All") {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY created_at DESC";

    const stmt = env.DB.prepare(query);
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

    return new Response(JSON.stringify({ success: true, blogs: results || [] }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 Database binding 'DB' not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body: any = await request.json();
    const { title, excerpt, content, category, author, cover_image, status, read_time } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ success: false, error: "Title and content are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const slug = body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const stmt = env.DB.prepare(
      `INSERT INTO blogs (slug, title, excerpt, content, category, author, cover_image, status, read_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    await stmt.bind(
      slug,
      title.trim(),
      excerpt ? excerpt.trim() : title.slice(0, 120),
      content,
      category || 'Market Insights',
      author || 'Mann Jain (Founder & SEBI R.A.)',
      cover_image || '/assets/images/img_18.jpg',
      status || 'Published',
      read_time || '4 min read'
    ).run();

    return new Response(JSON.stringify({ success: true, message: "Blog published successfully", slug }), {
      status: 201,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 Database binding 'DB' not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body: any = await request.json();
    const { id, title, excerpt, content, category, cover_image, status, read_time } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Blog ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const stmt = env.DB.prepare(
      `UPDATE blogs SET 
        title = COALESCE(?, title),
        excerpt = COALESCE(?, excerpt),
        content = COALESCE(?, content),
        category = COALESCE(?, category),
        cover_image = COALESCE(?, cover_image),
        status = COALESCE(?, status),
        read_time = COALESCE(?, read_time),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    );

    await stmt.bind(title, excerpt, content, category, cover_image, status, read_time, id).run();

    return new Response(JSON.stringify({ success: true, message: "Blog updated successfully" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 Database binding 'DB' not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Blog ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await env.DB.prepare("DELETE FROM blogs WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true, message: "Blog deleted successfully" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
