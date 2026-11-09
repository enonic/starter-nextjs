import { NextRequest, NextResponse } from 'next/server';
import {
    getRequestLocaleInfo,
    getLocaleMappingByProjectId,
    FROM_XP_PARAM,
} from '@enonic/nextjs-adapter';
import {
    addLocalePrefix,
    buildPreviewUrlIfNeeded,
    validatePreviewPayload,
    getXpRequestHeaders,
    removeLocalePrefix,
} from '@enonic/nextjs-adapter/server';

const BUILD_ID = process.env.BUILD_ID;

export function proxy(request: NextRequest): NextResponse {
    const { pathname, searchParams } = request.nextUrl;

    const headers = getXpRequestHeaders(request);
    const localeInfo = getRequestLocaleInfo({ contentPath: pathname, headers });
    const xpBlob = searchParams.get(FROM_XP_PARAM);
    const decoded = xpBlob !== null
        ? validatePreviewPayload({ blob: xpBlob, secret: process.env.ENONIC_API_TOKEN })
        : null;
    if (decoded && !decoded.ok) {
        return NextResponse.json({ message: 'Invalid or expired preview session' }, { status: 401 });
    }
    const params = decoded?.ok ? decoded.payload : undefined;

    // Canonical public URL: no xp param, no default-locale prefix, and the project's locale for older preview apps sending site-relative paths
    const url = request.nextUrl.clone();
    url.searchParams.delete(FROM_XP_PARAM);
    url.pathname = removeLocalePrefix(url.pathname, { locale: localeInfo.defaultLocale });
    const projectLocale = getLocaleMappingByProjectId(params?.xpProject, false)?.locale;
    if (projectLocale && projectLocale !== localeInfo.defaultLocale) {
        url.pathname = addLocalePrefix(url.pathname, { ...localeInfo, locale: projectLocale });
    }

    const draftUrl = params
        ? buildPreviewUrlIfNeeded({ request, payload: params, returnUrl: url, buildId: BUILD_ID })
        : null;
    if (draftUrl) {
        console.debug(`Proxy at '${pathname}': draft or XP session cookie needs updating, redirecting to '${draftUrl.pathname}'`);
        return NextResponse.redirect(draftUrl);
    }

    if (url.href !== request.nextUrl.href) {
        console.debug(`Proxy at '${pathname}': redirecting to '${url.pathname}'`);
        return NextResponse.redirect(url, xpBlob ? 307 : 308);
    }

    // Route internally to /[locale]/..., add even the default one
    url.pathname = addLocalePrefix(url.pathname, localeInfo);
    if (url.href === request.nextUrl.href) {
        console.debug(`Proxy at '${pathname}': ok, passing through`);
        return NextResponse.next({ request: { headers } });
    }

    console.debug(`Proxy at '${pathname}': rewriting to '${url.pathname}'`);
    return NextResponse.rewrite(url, { request: { headers } });
}


export const config = {
    // NB: should contain all files and folders in the /public folder
    matcher: ["/((?!robots.txt|sitemap.xml|manifest.json|api/|images/|fonts/|_next/|static/immutable/|assets|favicon.ico|sw.js).*)",],
};
