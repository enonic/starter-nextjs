import {proxyMedia} from '@enonic/nextjs-adapter/server';
import type {NextRequest} from 'next/server';

export function GET(request: NextRequest): Promise<Response> {
    return proxyMedia(request);
}

export function HEAD(request: NextRequest): Promise<Response> {
    return proxyMedia(request);
}
