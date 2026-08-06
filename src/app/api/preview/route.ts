import {NextRequest, NextResponse} from 'next/server';
import {draftMode} from 'next/headers';
import {validatePath, validateBlob} from '../../../utils';

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

    let response = validateBlob(xpBlob);
    if (response !== null) {
        return response;
    }

    response = validatePath(path);
    if (response !== null) {
        return response;
    }

    // Enable Next.js draft mode (sets __prerender_bypass cookie)
    (await draftMode()).enable();

    // Redirect back to the content page, preserving the encrypted blob
    // so the middleware can decrypt it on the second pass.
    const redirectUrl = new URL(path, request.nextUrl.origin);
    if (xpBlob) {
        redirectUrl.searchParams.set('xp', xpBlob);
    }

    response = NextResponse.redirect(redirectUrl);

    console.info(`Preview route at [${path}], set cookie and redirecting to [${redirectUrl.pathname}]...`);

    // Override __prerender_bypass with SameSite=None; Secure so the cookie works
    // inside cross-origin iframes (Content Studio runs on a different origin).
    /*    const cookieStore = await cookies();
        const bypassValue = cookieStore.get('__prerender_bypass')?.value;
        if (bypassValue) {
            response.cookies.set('__prerender_bypass', bypassValue, {
                httpOnly: true,
                sameSite: 'none',
                secure: true,
                path: '/',
            });
        }*/

    return response;
}
