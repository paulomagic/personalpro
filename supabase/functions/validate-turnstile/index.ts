// Supabase Edge Function: validate-turnstile
// Validates Cloudflare Turnstile CAPTCHA tokens server-side
// 
// Deploy with: supabase functions deploy validate-turnstile
// Set secret: supabase secrets set TURNSTILE_SECRET_KEY=your-secret-key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
    success: boolean;
    "error-codes"?: string[];
    challenge_ts?: string;
    hostname?: string;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        });
    }

    // Only allow POST
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const { token } = await req.json();

        if (!token) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing CAPTCHA token" }),
                { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
            );
        }

        // Get secret key from environment
        const secretKey = Deno.env.get("TURNSTILE_SECRET_KEY");

        if (!secretKey) {
            console.error("TURNSTILE_SECRET_KEY not configured");
            // In development/misconfigured state, allow through with warning
            return new Response(
                JSON.stringify({ success: true, warning: "Validation skipped - secret not configured" }),
                { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
            );
        }

        // Validate with Cloudflare
        const formData = new FormData();
        formData.append("secret", secretKey);
        formData.append("response", token);

        // Optionally add IP for additional security
        const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] ||
            req.headers.get("cf-connecting-ip") || "";
        if (clientIP) {
            formData.append("remoteip", clientIP);
        }

        const verifyResponse = await fetch(TURNSTILE_VERIFY_URL, {
            method: "POST",
            body: formData,
        });

        const result: TurnstileResponse = await verifyResponse.json();

        if (result.success) {
            return new Response(
                JSON.stringify({
                    success: true,
                    hostname: result.hostname,
                    timestamp: result.challenge_ts
                }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                }
            );
        } else {
            console.warn("Turnstile validation failed:", result["error-codes"]);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "CAPTCHA validation failed",
                    codes: result["error-codes"]
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                }
            );
        }
    } catch (error) {
        console.error("Turnstile validation error:", error);
        return new Response(
            JSON.stringify({ success: false, error: "Validation service error" }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            }
        );
    }
});
