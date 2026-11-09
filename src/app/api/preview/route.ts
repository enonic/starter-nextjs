import { validateRedirectPath, validatePreviewPayload, setPreviewCookies } from '@enonic/nextjs-adapter/server';
import { NextRequest, NextResponse } from 'next/server';
import { draftMode } from 'next/headers';

const BUILD_ID = process.env.BUILD_ID;

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

    const decoded = validatePreviewPayload({ blob: xpBlob, secret: process.env.ENONIC_API_TOKEN });
    if (!decoded.ok) {
        const message = decoded.reason === 'expired-session' ? 'Expired preview session' : 'Invalid preview session';
        return NextResponse.json({ message }, { status: 401 });
    }

    const destination = validateRedirectPath({ path, origin: request.nextUrl.origin });
    if (!destination.ok) {
        return NextResponse.json({ message: 'Invalid preview path' }, { status: 400 });
    }
    if (!BUILD_ID) {
        return NextResponse.json({ message: 'Preview is not configured' }, { status: 500 });
    }

    // Enable Next.js draft mode (sets __prerender_bypass cookie)
    (await draftMode()).enable();

    // Redirect back to the clean content page: draft mode lives in the cookie, the project follows from the URL locale
    const redirectUrl = destination.url;
    const response = NextResponse.redirect(redirectUrl);

    setPreviewCookies(response, { sessionId: decoded.payload.JSESSIONID, buildId: BUILD_ID });
    response.headers.set('Cache-Control', 'private, no-store');

    console.info(`Preview route: set draft cookie and redirecting to '${redirectUrl.pathname}'...`);

    return response;
}
