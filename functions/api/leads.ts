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
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    let query = "SELECT * FROM leads WHERE 1=1";
    const params: any[] = [];

    if (status && status !== "All") {
      query += " AND status = ?";
      params.push(status);
    }

    if (search) {
      query += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR service_interested LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += " ORDER BY created_at DESC LIMIT 100";

    const stmt = env.DB.prepare(query);
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

    return new Response(JSON.stringify({ success: true, leads: results || [] }), {
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
    const { name, email, phone, service_interested, investment_budget, message } = body;

    if (!name || !email || !phone) {
      return new Response(JSON.stringify({ success: false, error: "Name, email, and phone number are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const stmt = env.DB.prepare(
      `INSERT INTO leads (name, email, phone, service_interested, investment_budget, message, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'New')`
    );

    const res = await stmt.bind(
      name.trim(),
      email.trim(),
      phone.trim(),
      service_interested || 'General Inquiry',
      investment_budget || '₹5L - ₹25L',
      message ? message.trim() : ''
    ).run();

    return new Response(JSON.stringify({ success: true, message: "Lead submitted successfully", result: res }), {
      status: 201,
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

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const { env, request } = context;
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "D1 Database binding 'DB' not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const body: any = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Lead ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    let query = "UPDATE leads SET ";
    const sets: string[] = [];
    const params: any[] = [];

    if (status !== undefined) {
      sets.push("status = ?");
      params.push(status);
    }
    if (notes !== undefined) {
      sets.push("notes = ?");
      params.push(notes);
    }

    if (sets.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "No fields to update" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    query += sets.join(", ") + " WHERE id = ?";
    params.push(id);

    await env.DB.prepare(query).bind(...params).run();

    return new Response(JSON.stringify({ success: true, message: "Lead updated successfully" }), {
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
