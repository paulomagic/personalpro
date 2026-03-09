export function getBrowserSummary(userAgentOverride?: string | null): string {
    const userAgent = (userAgentOverride
        ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')).trim();

    if (!userAgent) return 'indisponivel';

    const ua = userAgent.toLowerCase();

    let browser = 'Unknown Browser';
    if (ua.includes('edg/')) browser = 'Edge';
    else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
    else if (ua.includes('samsungbrowser')) browser = 'Samsung Internet';
    else if (ua.includes('firefox/')) browser = 'Firefox';
    else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
    else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';

    let os = 'Unknown OS';
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) os = 'iOS';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac os') || ua.includes('macintosh')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';

    let device = 'desktop';
    if (ua.includes('ipad') || ua.includes('tablet')) {
        device = 'tablet';
    } else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
        device = 'mobile';
    }

    return `${browser} on ${os} (${device})`;
}
