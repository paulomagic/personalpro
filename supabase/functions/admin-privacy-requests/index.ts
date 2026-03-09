import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore Deno edge runtime import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

type UserRole = "admin" | "coach" | "student";

interface AdminPrivacyRequestsPayload {
  action?: "list_recent" | "complete_delete_request";
  limit?: number;
  requestId?: string;
  resolutionNotes?: string;
}

const logger = createEdgeLogger("admin-privacy-requests");

function getAllowedOrigins(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS") || "";
  return raw.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function buildCorsHeaders(req: Request): Record<string, string> | null {
  const origin = req.headers.get("origin");
  const configuredOrigins = getAllowedOrigins();
  const fallbackOrigins = [
    "https://personalpro-omega.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174"
  ];
  const effectiveOrigins = configuredOrigins.length > 0 ? configuredOrigins : fallbackOrigins;
  if (!origin || !effectiveOrigins.includes(origin)) return null;

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    "Vary": "Origin"
  };
}

async function getRequesterId(req: Request, supabaseUrl: string, anonKey: string): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const jwt = authHeader.slice(7);
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${jwt}`,
      "apikey": anonKey
    }
  });

  if (!response.ok) return null;
  const user = await response.json();
  return user?.id || null;
}

async function fetchUserRole(adminClient: any, userId: string): Promise<UserRole | null> {
  const { data, error } = await adminClient
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`profile_fetch_failed:${error.message}`);
  }

  const role = data?.role;
  return role === "admin" || role === "coach" || role === "student" ? role : null;
}

serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req);
  if (!corsHeaders) {
    return new Response(JSON.stringify({ success: false, error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    logger.error("Missing Supabase environment configuration");
    return new Response(JSON.stringify({ success: false, error: "missing_service_configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const requesterId = await getRequesterId(req, supabaseUrl, anonKey);
    if (!requesterId) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const requesterRole = await fetchUserRole(adminClient, requesterId);
    if (requesterRole !== "admin") {
      logger.warn("Denied non-admin access to admin-privacy-requests", { requesterId, requesterRole });
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const body = await req.json() as AdminPrivacyRequestsPayload;
    const action = body.action || "list_recent";

    if (action === "complete_delete_request") {
      const requestId = String(body.requestId || "").trim();
      if (!requestId) {
        return new Response(JSON.stringify({ success: false, error: "missing_request_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { data, error } = await adminClient.rpc("admin_complete_delete_privacy_request", {
        p_request_id: requestId,
        p_resolution_notes: body.resolutionNotes?.trim() || null
      });

      if (error) {
        logger.error("Failed to complete delete privacy request", error, { requesterId, requestId });
        return new Response(JSON.stringify({ success: false, error: error.message || "delete_request_completion_failed" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ success: true, payload: data || null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const limit = Math.min(50, Math.max(5, Number(body.limit || 20)));
    const { data: requests, error } = await adminClient
      .from("privacy_requests")
      .select("id, user_id, request_type, status, created_at, processed_at, notes, resolution_notes")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`privacy_requests_list_failed:${error.message}`);
    }

    const requestRows = Array.isArray(requests) ? requests : [];
    const userIds = [...new Set(requestRows.map((row: any) => row.user_id).filter(Boolean))];
    const profileMap = new Map<string, { full_name?: string | null }>();

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await adminClient
        .from("user_profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) {
        throw new Error(`privacy_profiles_failed:${profilesError.message}`);
      }

      for (const profile of profiles || []) {
        profileMap.set(profile.id, profile);
      }
    }

    const { data: authUsers, error: authUsersError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: Math.min(200, Math.max(50, userIds.length || 50))
    });

    if (authUsersError) {
      throw new Error(`privacy_auth_users_failed:${authUsersError.message}`);
    }

    const emailMap = new Map<string, string>();
    for (const user of authUsers?.users || []) {
      if (user.id) {
        emailMap.set(user.id, String(user.email || "").trim().toLowerCase());
      }
    }

    const normalizedRequests = requestRows.map((row: any) => ({
      ...row,
      requester_name: profileMap.get(row.user_id)?.full_name || null,
      requester_email: emailMap.get(row.user_id) || null
    }));

    const openDeleteRequests = normalizedRequests.filter((row: any) =>
      row.request_type === "delete" && (row.status === "open" || row.status === "in_review")
    ).length;

    return new Response(JSON.stringify({
      success: true,
      requests: normalizedRequests,
      openDeleteRequests
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    logger.error("Unexpected admin-privacy-requests error", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
