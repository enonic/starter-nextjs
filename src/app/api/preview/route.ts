import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';
import { BUILD_COOKIE, BUILD_ID, validateBlob, validatePath } from '../../../utils';

export function HEAD(req: NextRequest) {
    return processRequest(req);
}

export function GET(req: NextRequest) {
    return processRequest(req);
}

export async function processRequest(request: NextRequest): Promise<NextResponse> {
    const {searchParams} = request.nextUrl;
    const xpBlob = searchParams.get('xp');
    const path = searchParams.get('path') || '/';

    const blob = validateBlob(xpBlob);
    if (!blob.ok) {
        return blob.response;
    }

    const pathResponse = validatePath(path);
    if (pathResponse !== null) {
        return pathResponse;
    }

    // Enable Next.js draft mode (sets __prerender_bypass cookie)
    (await draftMode()).enable();

    // Redirect back to the clean content page: draft mode lives in the cookie, the project follows from the URL locale
    const redirectUrl = new URL(path, request.nextUrl.origin);
    const response = NextResponse.redirect(redirectUrl);

    // Same options Next uses for __prerender_bypass, used to tie prerender cookie to the next.js build
    response.cookies.set(BUILD_COOKIE, BUILD_ID ?? '', {
        httpOnly: true,
        sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax',
        secure: process.env.NODE_ENV !== 'development',
        path: '/',
    });

    console.info(`Preview route: set draft cookie and redirecting to '${redirectUrl.pathname}'...`);

    return response;
}
