import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore Deno edge runtime import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

interface InviteSignupPayload {
    inviteToken?: string;
    email?: string;
    password?: string;
    name?: string;
}

interface InvitationRow {
    id: string;
    email: string;
    coach_id: string | null;
    client_id: string | null;
    status: string;
    expires_at: string;
}

interface AdminUserRow {
    id: string;
    email?: string;
}

type ExistingRole = "admin" | "coach" | "student" | null;

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
    const allowedOrigins = Array.from(new Set([...fallbackOrigins, ...configuredOrigins]));
    const allowOrigin = !!origin && allowedOrigins.includes(origin);

    if (!allowOrigin) return null;

    return {
        "Access-Control-Allow-Origin": origin || "null",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
        "Vary": "Origin",
    };
}

function normalizeEmail(value: string | undefined): string {
    return String(value || "").trim().toLowerCase();
}

function isStrongEnoughPassword(password: string): boolean {
    return password.length >= 6;
}

async function fetchInvitation(
    supabaseUrl: string,
    serviceRoleKey: string,
    inviteToken: string
): Promise<InvitationRow | null> {
    const params = new URLSearchParams({
        token: `eq.${inviteToken}`,
        status: "eq.pending",
        select: "id,email,coach_id,client_id,status,expires_at",
        limit: "1"
    });

    const response = await fetch(`${supabaseUrl}/rest/v1/invitations?${params.toString()}`, {
        method: "GET",
        headers: {
            "apikey": serviceRoleKey,
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`invitation_fetch_failed:${response.status}`);
    }

    const rows = await response.json() as InvitationRow[];
    return rows[0] || null;
}

async function findUserByEmail(adminClient: any, email: string): Promise<AdminUserRow | null> {
    let page = 1;
    const perPage = 200;

    while (page <= 10) {
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
        if (error) {
            throw error;
        }

        const users = data?.users || [];
        const matched = users.find((user) => normalizeEmail(user.email) === email);
        if (matched) {
            return { id: matched.id, email: matched.email };
        }

        if (users.length < perPage) {
            return null;
        }

        page += 1;
    }

    return null;
}

async function fetchUserRole(
    supabaseUrl: string,
    serviceRoleKey: string,
    userId: string
): Promise<ExistingRole> {
    const params = new URLSearchParams({
        id: `eq.${userId}`,
        select: "role",
        limit: "1"
    });

    const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?${params.toString()}`, {
        method: "GET",
        headers: {
            "apikey": serviceRoleKey,
            "Authorization": `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`profile_fetch_failed:${response.status}`);
    }

    const rows = await response.json() as Array<{ role?: ExistingRole }>;
    const role = rows[0]?.role;
    return role === "admin" || role === "coach" || role === "student" ? role : null;
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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
        return new Response(
            JSON.stringify({ success: false, error: "missing_service_role" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        const body = await req.json() as InviteSignupPayload;
        const inviteToken = String(body.inviteToken || "").trim();
        const email = normalizeEmail(body.email);
        const password = String(body.password || "");
        const name = String(body.name || "").trim();

        if (!inviteToken || !email || !password || !name) {
            return new Response(
                JSON.stringify({ success: false, error: "missing_required_fields" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!isStrongEnoughPassword(password)) {
            return new Response(
                JSON.stringify({ success: false, error: "A senha deve ter pelo menos 6 caracteres." }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const invitation = await fetchInvitation(supabaseUrl, serviceRoleKey, inviteToken);
        if (!invitation) {
            return new Response(
                JSON.stringify({ success: false, error: "Convite inválido ou expirado." }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (normalizeEmail(invitation.email) !== email) {
            return new Response(
                JSON.stringify({ success: false, error: "Use o mesmo email informado no convite." }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const expiresAt = new Date(invitation.expires_at);
        if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
            return new Response(
                JSON.stringify({ success: false, error: "Convite expirado." }),
                { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });

        const existingUser = await findUserByEmail(adminClient, email);
        if (existingUser) {
            const existingRole = await fetchUserRole(supabaseUrl, serviceRoleKey, existingUser.id);
            const errorMessage = existingRole === "student"
                ? "Esta conta de aluno já existe. Use Entrar com a senha correta para concluir o convite."
                : "Este email já pertence a uma conta existente de personal/admin. Use outro email para o aluno.";
            return new Response(
                JSON.stringify({
                    success: false,
                    existingAccount: true,
                    existingRole,
                    error: errorMessage
                }),
                { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { data, error } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name,
                role: "student"
            }
        });

        if (error || !data.user) {
            return new Response(
                JSON.stringify({ success: false, error: error?.message || "Falha ao criar usuário do convite." }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                userId: data.user.id
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[complete-invite-signup] Unexpected error:", error);
        const message = error instanceof Error ? error.message : String(error);
        return new Response(
            JSON.stringify({ success: false, error: message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
