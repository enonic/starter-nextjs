import { NextResponse, NextRequest } from 'next/server';
import type { UrlMappingRule } from '@enonic/nextjs-adapter';
import { localizeMappings } from '@enonic/nextjs-adapter';
import { resolveProjectMapping, validateBlob } from '../../../utils';

const MAPPINGS: UrlMappingRule[] = [
    {
        sources: ['/.*'],
        target: '/${siteRelativePath}',
    },
];

export function GET(request: NextRequest) {
    const blob = validateBlob(request.nextUrl.searchParams.get('xp'));
    if (!blob.ok) {
        return blob.response;
    }

    const mapping = resolveProjectMapping(blob.params.xpProject);
    if (!mapping) {
        return NextResponse.json({ message: `No locale mapping for project "${blob.params.xpProject}"` },
            { status: 404 });
    }

    return NextResponse.json({ mappings: localizeMappings(MAPPINGS, mapping) });
}
