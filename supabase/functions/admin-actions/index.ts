import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client for privileged operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, target_user_id } = await req.json();

    switch (action) {
      case "get_stats": {
        // Get all users
        const { data: usersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
        const users = usersData?.users || [];

        // Get all profiles
        const { data: profiles } = await adminClient.from("profiles").select("*");

        // Get all emotion history
        const { data: allHistory } = await adminClient
          .from("emotion_history")
          .select("id, emotion, confidence, date_time, user_id")
          .order("date_time", { ascending: false })
          .limit(1000);

        // Get roles
        const { data: roles } = await adminClient.from("user_roles").select("*");

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));

        const enrichedUsers = users.map((u: any) => ({
          id: u.id,
          email: u.email,
          display_name: profileMap.get(u.id)?.display_name || "—",
          is_blocked: profileMap.get(u.id)?.is_blocked || false,
          role: roleMap.get(u.id) || "user",
          created_at: u.created_at,
          detection_count: (allHistory || []).filter((h: any) => h.user_id === u.id).length,
        }));

        return new Response(JSON.stringify({
          users: enrichedUsers,
          total_users: users.length,
          total_detections: (allHistory || []).length,
          history: allHistory || [],
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "block_user": {
        if (!target_user_id) throw new Error("target_user_id required");
        const { data: profile } = await adminClient
          .from("profiles")
          .select("is_blocked")
          .eq("user_id", target_user_id)
          .single();

        const newBlocked = !(profile?.is_blocked);
        await adminClient
          .from("profiles")
          .update({ is_blocked: newBlocked })
          .eq("user_id", target_user_id);

        return new Response(JSON.stringify({ success: true, is_blocked: newBlocked }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        if (!target_user_id) throw new Error("target_user_id required");
        // Prevent deleting self
        if (target_user_id === user.id) {
          return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(target_user_id);
        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "export_analytics": {
        const { data: allHistory } = await adminClient
          .from("emotion_history")
          .select("emotion, confidence, date_time, user_id")
          .order("date_time", { ascending: false });

        const csv = [
          "user_id,emotion,confidence,date_time",
          ...(allHistory || []).map((h: any) =>
            `${h.user_id},${h.emotion},${h.confidence},${h.date_time}`
          ),
        ].join("\n");

        return new Response(csv, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=emotion_analytics.csv",
          },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("admin-actions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
