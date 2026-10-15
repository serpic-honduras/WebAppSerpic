import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Missing authorization" }, 401);

    // Validate caller
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check role
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin");
    if (!roleRows || roleRows.length === 0)
      return json({ error: "Forbidden: admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const { action } = body as { action: string };

    switch (action) {
      case "list": {
        const { data: usersData, error } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (error) return json({ error: error.message }, 400);

        const userIds = usersData.users.map((u) => u.id);
        const { data: profiles } = await admin
          .from("profiles")
          .select("id, full_name, avatar_url");
        const { data: roles } = await admin
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);

        const users = usersData.users.map((u) => {
          const p = profiles?.find((x) => x.id === u.id);
          const userRoles = roles?.filter((r) => r.user_id === u.id).map((r) => r.role) ?? [];
          const role: "admin" | "auditor" | "user" = userRoles.includes("admin")
            ? "admin"
            : userRoles.includes("auditor")
              ? "auditor"
              : "user";
          return {
            id: u.id,
            email: u.email,
            full_name: p?.full_name ?? "",
            avatar_url: p?.avatar_url ?? null,
            role,
            created_at: u.created_at,
          };
        });
        return json({ users });
      }

      case "create": {
        const { email, password, full_name, role } = body as {
          email: string;
          password: string;
          full_name?: string;
          role: "admin" | "auditor" | "user";
        };
        if (!email || !password) return json({ error: "Email & password required" }, 400);

        const { data, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: full_name ?? "" },
        });
        if (error) return json({ error: error.message }, 400);

        const newId = data.user!.id;
        // Trigger creates default 'user' role; add extra role if requested.
        if (role === "admin" || role === "auditor") {
          await admin.from("user_roles").insert({ user_id: newId, role });
        }
        if (full_name) {
          await admin.from("profiles").update({ full_name }).eq("id", newId);
        }
        return json({ id: newId });
      }

      case "update_name": {
        const { user_id, full_name } = body;
        const { error } = await admin
          .from("profiles")
          .update({ full_name })
          .eq("id", user_id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "update_password": {
        const { user_id, password } = body;
        const { error } = await admin.auth.admin.updateUserById(user_id, { password });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "set_role": {
        const { user_id, role } = body as { user_id: string; role: "admin" | "auditor" | "user" };
        // Remove elevated roles, then add the requested one (besides 'user').
        await admin.from("user_roles").delete().eq("user_id", user_id).eq("role", "admin");
        await admin.from("user_roles").delete().eq("user_id", user_id).eq("role", "auditor");
        if (role === "admin" || role === "auditor") {
          await admin
            .from("user_roles")
            .upsert({ user_id, role }, { onConflict: "user_id,role" });
        }
        // Ensure base 'user' role exists
        await admin
          .from("user_roles")
          .upsert({ user_id, role: "user" }, { onConflict: "user_id,role" });
        return json({ ok: true });
      }

      case "delete": {
        const { user_id } = body;
        if (user_id === userData.user.id)
          return json({ error: "Cannot delete yourself" }, 400);
        const { error } = await admin.auth.admin.deleteUser(user_id);
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("admin-users error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
