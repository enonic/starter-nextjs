import {NextResponse} from 'next/server';
import {decryptParams} from '@enonic/nextjs-adapter';

export function validateBlob(blob: string | null): NextResponse | null {
    const secret = process.env.ENONIC_API_TOKEN;

    if (!blob || !secret) {
        return NextResponse.json({message: 'Invalid request'}, {status: 401});
    }

    // Decryption success proves the request came from XP (it knows the secret)
    const params = decryptParams(blob, secret);
    if (!params) {
        return NextResponse.json({message: 'Invalid secret'}, {status: 401});
    }

    return null;
}

export function validatePath(path: string | string[] | null): NextResponse | null {
    // If the slug doesn't exist prevent preview mode from being enabled
    if (path === null || path === undefined) {
        return NextResponse.json({message: 'Invalid path'}, {
            status: 400,
        });
    }
    return null;
}
