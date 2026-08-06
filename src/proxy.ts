import {NextRequest, NextResponse} from 'next/server'
import {
    getRequestLocaleInfo,
    decryptParams,
    getLocaleMappingByProjectId,
    PROJECT_ID_HEADER,
    JSESSIONID_HEADER
} from '@enonic/nextjs-adapter'

export function proxy(request: NextRequest): NextResponse {
    const {searchParams, pathname} = request.nextUrl;
    const xpBlob = searchParams.get('xp');
    const secret = process.env.ENONIC_API_TOKEN;

    // Copy jsessionid to header
    addCookiesToHeaders(request);

    if (!xpBlob || !secret) {
        // Not a Content Studio request
        console.debug(`Middleware at '${pathname}': no blob or secret, passing through...`);

        if (addLanguageToPath(request)) {
            console.debug(`Middleware at '${pathname}': rewriting to '${request.nextUrl}'...`);
            return NextResponse.rewrite(request.nextUrl, {request});
        }

        return NextResponse.next({request});
    }

    const params = decryptParams(xpBlob, secret);
    if (!params) {
        // Not a valid Content Studio request
        console.debug(`Middleware at '${pathname}': failed to decrypt blob, passing through...`);

        if (addLanguageToPath(request)) {
            console.debug(`Middleware at '${pathname}': rewriting to '${request.nextUrl}'...`);
            return NextResponse.rewrite(request.nextUrl, {request});
        }

        return NextResponse.next({request});
    }

    addParamsToHeaders(request, params);

    // Content Studio requests come in as /<siteName>/content/path with no locale.
    // Use the project's mapping to both strip the site name and add the locale, so they
    // stay consistent and the result matches the site-relative, locale-prefixed routes.
    const mapping = getLocaleMappingByProjectId(params.xpProject);
    const removedSite = removeSiteName(request, mapping?.site);
    const addedLanguage = addLanguageToPath(request, mapping?.locale);

    // It's a valid request from Content Studio, so we want to enable draft mode for it
    const hasDraftCookie = request.cookies.has('__prerender_bypass');

    if (!hasDraftCookie) {
        // No draft-mode cookie yet — redirect to the API route that enables it.
        const draftUrl = request.nextUrl.clone();
        draftUrl.pathname = '/api/preview';
        draftUrl.searchParams.set('path', request.nextUrl.pathname);

        console.debug(`Middleware at '${pathname}': no draft cookie, redirecting to '${draftUrl.pathname}'...`);

        return NextResponse.redirect(draftUrl);
    }

    // Rewrite to a clean URL (without xp param, data is added to headers)
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete('xp');

    if (addedLanguage || removedSite) {
        console.debug(`Middleware at '${pathname}': rewriting to '${cleanUrl.pathname}'...`);
        return NextResponse.rewrite(cleanUrl, {request});
    }

    return NextResponse.next({request});
}

function addCookiesToHeaders(request: NextRequest) {
    const headers = request.headers;
    const jsessionid = request.cookies.get('JSESSIONID')?.value;
    if (jsessionid) {
        console.debug(`Middleware at '${request.nextUrl.pathname}': using jsessionid from cookie`);
        headers.set(JSESSIONID_HEADER, jsessionid);
    }
}

function addParamsToHeaders(request: NextRequest, params: Record<string, string>) {
    const requestHeaders = request.headers;
    if (params.xpProject) {
        console.debug(`Middleware at '${request.nextUrl.pathname}': using project from params`);
        requestHeaders.set(PROJECT_ID_HEADER, params.xpProject);
    }
}

function removeSiteName(req: NextRequest, site?: string): boolean {
    if (!site || site === '/') {
        return false;
    }

    const pathname = req.nextUrl.pathname;
    if (pathname === site || pathname.startsWith(`${site}/`)) {
        req.nextUrl.pathname = pathname.substring(site.length) || '/';
        console.debug(`Middleware at '${pathname}': stripped site name '${site}' -> '${req.nextUrl.pathname}'`);
        return true;
    }

    return false;
}

function addLanguageToPath(req: NextRequest, explicitLocale?: string): boolean {
    const pathname = req.nextUrl.pathname;
    const {locale: detectedLocale, locales} = getRequestLocaleInfo({
        contentPath: pathname,
        headers: req.headers
    });
    // Prefer the explicit (project-derived) locale so it stays consistent with site-name removal.
    const locale = explicitLocale || detectedLocale;

    const pathPart = pathname.split('/')[1];    // pathname always starts with a slash, followed by locale
    const pathHasLocale = locales.indexOf(pathPart) >= 0

    if (pathHasLocale) {
        // locale is already in the path, no need to redirect
        console.debug(`Middleware at '${pathname}': '${pathPart}' locale present in path`);
        return false;
    } else if (!locale) {
        // no locale found in path or headers, return 404
        console.debug(`Middleware at '${pathname}': no locale found`);
        return false;
    }

    req.nextUrl.pathname = `/${locale}${pathname}`
    return true;
}

export const config = {
    // NB: should contain all files and folders in the /public folder
    matcher: ["/((?!robots.txt|sitemap.xml|manifest.json|api/|images/|fonts/|_next/webpack-hmr|_next/static|_next/image|assets|favicon.ico|sw.js).*)",],
};
