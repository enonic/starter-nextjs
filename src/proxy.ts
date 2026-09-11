import { NextRequest, NextResponse } from 'next/server';
import {
    getRequestLocaleInfo,
    getLocaleMappingByProjectId,
    decryptParams,
    FROM_XP_PARAM,
    JSESSIONID_HEADER,
} from '@enonic/nextjs-adapter';
import { BUILD_COOKIE, BUILD_ID, DRAFT_COOKIE } from './utils';

type LocaleInfo = ReturnType<typeof getRequestLocaleInfo>;
type Url = NextRequest['nextUrl'];

export function proxy(request: NextRequest): NextResponse {
    const { pathname, searchParams } = request.nextUrl;

    addCookiesToHeaders(request);

    const localeInfo = getRequestLocaleInfo({ contentPath: pathname, headers: request.headers });
    const xpBlob = searchParams.get(FROM_XP_PARAM);
    const params = xpBlob ? decryptXpParams(xpBlob) : null;

    // Canonical public URL: no xp param, no default-locale prefix, and the project's locale for older preview apps sending site-relative paths
    const url = request.nextUrl.clone();
    url.searchParams.delete(FROM_XP_PARAM);
    stripDefaultLocale(url, localeInfo);
    const projectLocale = getLocaleMappingByProjectId(params?.xpProject, false)?.locale;
    if (projectLocale && projectLocale !== localeInfo.defaultLocale) {
        addLocalePrefix(url, { ...localeInfo, locale: projectLocale });
    }

    if (xpBlob && params && !hasDraftCookieForThisBuild(request)) {
        // First Content Studio request: /api/preview validates the blob, enables draft mode and lands on the canonical URL
        const draftUrl = request.nextUrl.clone();
        draftUrl.pathname = '/api/preview';
        draftUrl.search = '';
        draftUrl.searchParams.set(FROM_XP_PARAM, xpBlob);
        draftUrl.searchParams.set('path', url.pathname + url.search);
        console.debug(`Proxy at '${pathname}': no draft cookie for this build, redirecting to '${draftUrl.pathname}'`);
        return NextResponse.redirect(draftUrl);
    }

    if (url.href !== request.nextUrl.href) {
        console.debug(`Proxy at '${pathname}': redirecting to '${url.pathname}'`);
        return NextResponse.redirect(url, xpBlob ? 307 : 308);
    }

    // Route internally to /[locale]/..., add even the default one
    addLocalePrefix(url, localeInfo);
    if (url.href === request.nextUrl.href) {
        console.debug(`Proxy at '${pathname}': ok, passing through`);
        return NextResponse.next({ request });
    }

    console.debug(`Proxy at '${pathname}': rewriting to '${url.pathname}'`);
    return NextResponse.rewrite(url, { request });
}

// Next ignores a draft cookie issued by another build (dev vs prod, redeploy), so /api/preview must run again for it
function hasDraftCookieForThisBuild(request: NextRequest): boolean {
    return request.cookies.has(DRAFT_COOKIE) && request.cookies.get(BUILD_COOKIE)?.value === BUILD_ID;
}

function decryptXpParams(xpBlob: string): Record<string, string> | null {
    const secret = process.env.ENONIC_API_TOKEN;
    const params = secret ? decryptParams(xpBlob, secret) : null;
    if (!params) {
        console.debug('Proxy: failed to decrypt the xp blob, treating the request as a direct one');
    }
    return params;
}

function addCookiesToHeaders(request: NextRequest) {
    const jsessionid = request.cookies.get('JSESSIONID')?.value;
    if (jsessionid) {
        request.headers.set(JSESSIONID_HEADER, jsessionid);
    }
}

function stripDefaultLocale(url: Url, { defaultLocale }: LocaleInfo): boolean {
    const [, firstSegment, ...rest] = url.pathname.split('/');
    if (!defaultLocale || firstSegment !== defaultLocale) {
        return false;
    }

    url.pathname = `/${rest.join('/')}`;
    return true;
}

function addLocalePrefix(url: Url, { locale, locales }: LocaleInfo): void {
    const firstSegment = url.pathname.split('/')[1];
    if (locales.includes(firstSegment) || !locale) {
        return;
    }

    // No trailing slash for the site root: with trailingSlash=false Next would 308 "/en/" to "/en", and that redirect carries no CORS headers
    url.pathname = `/${locale}${url.pathname}`.replace(/\/$/, '');
}

export const config = {
    // NB: should contain all files and folders in the /public folder
    matcher: ["/((?!robots.txt|sitemap.xml|manifest.json|api/|images/|fonts/|_next/webpack-hmr|_next/static|_next/image|assets|favicon.ico|sw.js).*)",],
};
