import {NextResponse, NextRequest} from 'next/server';
import {validateBlob} from '../../../utils';

const MAPPINGS = [
    {
        sources: ['/.*'],
        target: '/${_path}',
    },
];

export function GET(request: NextRequest) {
    const {searchParams} = request.nextUrl;
    const xpBlob = searchParams.get('xp');

    let response = validateBlob(xpBlob);
    if (response !== null) {
        return response;
    }

    return NextResponse.json({mappings: MAPPINGS});
}
