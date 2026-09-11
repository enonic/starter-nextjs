import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { pageUrl, PROJECT_ID_HEADER } from '@enonic/nextjs-adapter';
import { resolveProjectMapping, validateBlob } from '../../../utils';

export async function GET(request: NextRequest) {
    // Check for secret to confirm this is a valid request
    const {searchParams} = request.nextUrl;
    const blob = validateBlob(searchParams.get('xp'));
    if (!blob.ok) {
        return blob.response;
    }

    const path = searchParams.get('path');
    const project = blob.params.xpProject ?? request.headers.get(PROJECT_ID_HEADER);
    const locale = resolveProjectMapping(project)?.locale;
    try {
        if (path && locale) {
            // Without defaultLocale, pageUrl always prefixes: the cache is keyed by the /[locale] rewrite destination, not the public URL
            const localePath = pageUrl({ path }, { locale });
            revalidatePath(localePath);
            console.info(`Revalidated [${localePath}]`);
        } else {
            if (path) {
                console.warn(
                    `No locale mapping for project "${project}", revalidating everything instead of [${path}]`);
            }
            revalidatePath('/', 'layout');
            console.info(`Revalidated everything`);
        }
        return Response.json({revalidated: true}, {status: 200});
    } catch (err) {
        console.error(`Revalidation [${path ?? 'everything'}] error: ` + err);
        return Response.json({revalidated: false}, {status: 200});
    }
}
