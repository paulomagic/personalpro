import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore Deno edge runtime import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { createEdgeLogger } from "../_shared/edgeLogger.ts";

type UserRole = "admin" | "coach" | "student";

interface AdminUsersRequest {
    action?: "list" | "invite_coach";
    search?: string;
    limit?: number;
    offset?: number;
    email?: string;
    name?: string;
}

interface AuthAdminUser {
    id: string;
    email?: string;
    created_at?: string;
    last_sign_in_at?: string | null;
    invited_at?: string | null;
    confirmation_sent_at?: string | null;
    user_metadata?: Record<string, unknown>;
}

interface UserProfileRow {
    id: string;
    role: UserRole;
    coach_id?: string | null;
    client_id?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    created_at?: string;
    updated_at?: string;
}

const logger = createEdgeLogger("admin-users");

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

function normalizeEmail(value: string | undefined | null): string {
    return String(value || "").trim().toLowerCase();
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

async function listAllUsers(adminClient: any, limit: number): Promise<AuthAdminUser[]> {
    const users: AuthAdminUser[] = [];
    const perPage = Math.min(100, Math.max(20, limit));

    for (let page = 1; users.length < limit && page <= 10; page += 1) {
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
        if (error) {
            throw new Error(`list_users_failed:${error.message}`);
        }

        const batch = (data?.users || []) as AuthAdminUser[];
        users.push(...batch);
        if (batch.length < perPage) break;
    }

    return users.slice(0, limit);
}

async function fetchProfilesByIds(adminClient: any, ids: string[]): Promise<Map<string, UserProfileRow>> {
    const profileMap = new Map<string, UserProfileRow>();

    for (let start = 0; start < ids.length; start += 100) {
        const chunk = ids.slice(start, start + 100);
        if (chunk.length === 0) continue;

        const { data, error } = await adminClient
            .from("user_profiles")
            .select("id, role, coach_id, client_id, full_name, avatar_url, created_at, updated_at")
            .in("id", chunk);

        if (error) {
            throw new Error(`profile_batch_failed:${error.message}`);
        }

        for (const profile of (data || []) as UserProfileRow[]) {
            profileMap.set(profile.id, profile);
        }
    }

    return profileMap;
}

function deriveUserStatus(user: AuthAdminUser): "active" | "invited" | "inactive" {
    if (user.last_sign_in_at) return "active";
    if (user.invited_at || user.confirmation_sent_at) return "invited";
    return "inactive";
}

function resolveDisplayName(user: AuthAdminUser, profile?: UserProfileRow): string {
    const profileName = String(profile?.full_name || "").trim();
    if (profileName) return profileName;

    const metadata = user.user_metadata || {};
    const metadataName = String(metadata.full_name || metadata.name || "").trim();
    if (metadataName) return metadataName;

    return String(user.email || "Usuário sem nome").split("@")[0];
}

async function findUserByEmail(adminClient: any, email: string): Promise<AuthAdminUser | null> {
    const normalizedEmail = normalizeEmail(email);
    let page = 1;
    const perPage = 100;

    while (page <= 10) {
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
        if (error) {
            throw new Error(`list_users_failed:${error.message}`);
        }

        const users = (data?.users || []) as AuthAdminUser[];
        const matched = users.find((user) => normalizeEmail(user.email) === normalizedEmail);
        if (matched) return matched;
        if (users.length < perPage) break;
        page += 1;
    }

    return null;
}

serve(async (req: Request) => {
    const corsHeaders = buildCorsHeaders(req);
    if (!corsHeaders) {
        return new Response(
            JSON.stringify({ success: false, error: "Origin not allowed" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
        );
    }

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ success: false, error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
        logger.error("Missing Supabase environment configuration");
        return new Response(
            JSON.stringify({ success: false, error: "missing_service_configuration" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const requesterId = await getRequesterId(req, supabaseUrl, anonKey);
        if (!requesterId) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });

        const requesterRole = await fetchUserRole(adminClient, requesterId);
        if (requesterRole !== "admin") {
            logger.warn("Denied non-admin access to admin-users", { requesterId, requesterRole });
            return new Response(
                JSON.stringify({ success: false, error: "Forbidden" }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const body = await req.json() as AdminUsersRequest;
        const action = body.action || "list";

        if (action === "invite_coach") {
            const email = normalizeEmail(body.email);
            const name = String(body.name || "").trim();

            if (!email || !name) {
                return new Response(
                    JSON.stringify({ success: false, error: "missing_required_fields" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const existingUser = await findUserByEmail(adminClient, email);
            if (existingUser) {
                return new Response(
                    JSON.stringify({ success: false, error: "Este email já possui cadastro no sistema." }),
                    { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            const redirectTo = getAllowedOrigins()[0] || undefined;
            const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
                data: {
                    name,
                    full_name: name,
                    role: "coach"
                },
                redirectTo
            });

            if (error || !data.user) {
                logger.error("Failed to invite coach", error, { requesterId, email });
                return new Response(
                    JSON.stringify({ success: false, error: error?.message || "Falha ao enviar convite." }),
                    { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            logger.info("Coach invitation sent", {
                requesterId,
                invitedUserId: data.user.id,
                email
            });

            return new Response(
                JSON.stringify({
                    success: true,
                    user: {
                        id: data.user.id,
                        email,
                        name,
                        role: "coach",
                        status: "invited"
                    }
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const search = String(body.search || "").trim().toLowerCase();
        const limit = Math.min(50, Math.max(10, Number(body.limit || 20)));
        const offset = Math.max(0, Number(body.offset || 0));
        const scanLimit = Math.min(500, Math.max(100, offset + limit + 100));

        const authUsers = await listAllUsers(adminClient, scanLimit);
        const profileMap = await fetchProfilesByIds(adminClient, authUsers.map((user) => user.id));

        const filteredUsers = authUsers
            .map((user) => {
                const profile = profileMap.get(user.id);
                const displayName = resolveDisplayName(user, profile);
                const normalizedEmail = normalizeEmail(user.email);

                return {
                    id: user.id,
                    email: normalizedEmail,
                    name: displayName,
                    role: profile?.role || "coach",
                    avatar_url: profile?.avatar_url || null,
                    created_at: user.created_at || profile?.created_at || null,
                    updated_at: profile?.updated_at || null,
                    last_login_at: user.last_sign_in_at || null,
                    invited_at: user.invited_at || user.confirmation_sent_at || null,
                    status: deriveUserStatus(user),
                    coach_id: profile?.coach_id || null,
                    client_id: profile?.client_id || null
                };
            })
            .filter((user) => {
                if (!search) return true;
                return user.name.toLowerCase().includes(search) || user.email.includes(search);
            })
            .sort((a, b) => {
                const aTime = new Date(a.last_login_at || a.created_at || 0).getTime();
                const bTime = new Date(b.last_login_at || b.created_at || 0).getTime();
                return bTime - aTime;
            });

        const counts = filteredUsers.reduce<Record<string, number>>((acc, user) => {
            acc.total = (acc.total || 0) + 1;
            acc[user.role] = (acc[user.role] || 0) + 1;
            acc[user.status] = (acc[user.status] || 0) + 1;
            return acc;
        }, {});

        const users = filteredUsers.slice(offset, offset + limit);

        return new Response(
            JSON.stringify({
                success: true,
                users,
                counts: {
                    total: counts.total || 0,
                    admin: counts.admin || 0,
                    coach: counts.coach || 0,
                    student: counts.student || 0,
                    active: counts.active || 0,
                    invited: counts.invited || 0,
                    inactive: counts.inactive || 0
                },
                pagination: {
                    limit,
                    offset,
                    total: filteredUsers.length
                }
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        logger.error("Unexpected admin-users error", error);
        const message = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({ success: false, error: message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
