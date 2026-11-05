import { JSESSIONID_HEADER } from '@enonic/nextjs-adapter';
import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';
import { BUILD_COOKIE, BUILD_ID, validateBlob, validatePath } from '../../../utils';

const PREVIEW_PAYLOAD_MAX_AGE_MS = 5 * 60 * 1000;
const PREVIEW_PAYLOAD_CLOCK_SKEW_MS = 30 * 1000;

export function HEAD(req: NextRequest) {
    return processRequest(req);
}

export function GET(req: NextRequest) {
    return processRequest(req);
}

async function processRequest(request: NextRequest): Promise<NextResponse> {
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

    const {JSESSIONID: jsessionid, issuedAt} = blob.params;
    if (!jsessionid || typeof issuedAt !== 'number' || !Number.isFinite(issuedAt)) {
        return NextResponse.json({ message: 'Invalid preview session' }, { status: 401 });
    }
    const age = Date.now() - issuedAt;
    if (age < -PREVIEW_PAYLOAD_CLOCK_SKEW_MS || age > PREVIEW_PAYLOAD_MAX_AGE_MS) {
        return NextResponse.json({ message: 'Expired preview session' }, { status: 401 });
    }

    // Enable Next.js draft mode (sets __prerender_bypass cookie)
    (await draftMode()).enable();

    // Redirect back to the clean content page: draft mode lives in the cookie, the project follows from the URL locale
    const redirectUrl = new URL(path, request.nextUrl.origin);
    const response = NextResponse.redirect(redirectUrl);

    // Keep the XP session on the frontend domain so server-side Guillotine requests can forward it.
    response.cookies.set(JSESSIONID_HEADER, jsessionid, {
        httpOnly: true,
        sameSite: process.env.NODE_ENV !== 'development' ? 'none' : 'lax',
        secure: process.env.NODE_ENV !== 'development',
        path: '/',
    });

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
