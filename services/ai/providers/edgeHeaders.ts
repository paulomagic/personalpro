export function buildEdgeAuthHeaders(
    accessToken: string | null | undefined,
    anonKey: string
): Record<string, string> | null {
    if (!accessToken) return null;

    return {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey
    };
}
