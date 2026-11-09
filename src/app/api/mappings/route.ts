import { NextResponse, NextRequest } from 'next/server';
import type { UrlMappingRule } from '@enonic/nextjs-adapter';
import { getLocaleMappingByProjectId, localizeMappings } from '@enonic/nextjs-adapter';
import { validateXpPayload } from '@enonic/nextjs-adapter/server';

const MAPPINGS: UrlMappingRule[] = [
    {
        sources: ['/.*'],
        target: '/${siteRelativePath}',
    },
];

export function GET(request: NextRequest) {
    const blob = validateXpPayload({
        blob: request.nextUrl.searchParams.get('xp'),
        secret: process.env.ENONIC_API_TOKEN,
    });
    if (!blob.ok) {
        const message = blob.reason === 'invalid-payload' ? 'Invalid secret' : 'Invalid request';
        return NextResponse.json({ message }, { status: 401 });
    }

    const mapping = getLocaleMappingByProjectId(blob.payload.xpProject, false);
    if (!mapping) {
        return NextResponse.json({ message: `No locale mapping for project "${blob.payload.xpProject}"` },
            { status: 404 });
    }

    return NextResponse.json({ mappings: localizeMappings(MAPPINGS, mapping) });
}
