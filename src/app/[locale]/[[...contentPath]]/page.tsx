import {FetchContentResult, validateData} from "@enonic/nextjs-adapter";
import {fetchContent, fetchContentPathsForAllLocales} from "@enonic/nextjs-adapter/server";
import MainView from '@enonic/nextjs-adapter/views/MainView';

import "../../../components/_mappings";
import {Metadata} from 'next';
import {draftMode} from 'next/headers';
import React from 'react';
import PageEditorScript from '../../../components/views/PageEditorScript';

// NB. Using this option with default value bails out static generation !!!
// export const dynamic = 'auto'

// The revalidate option is only available when using the Node.js Runtime.
// This means using the revalidate option with runtime = 'edge' will not work.
export const revalidate = 3600

// PageProps type matches the Next.js route [[...contentPath]]
// where contentPath is optional (can be undefined for root paths)
export type PageProps = {
    locale: string,
    contentPath?: string[],
}

export default async function Page({params}: { params: Promise<PageProps> }) {
    const {isEnabled: draft} = await draftMode();
    const resolvedParams = await params;

    const data: FetchContentResult = await fetchContent({
        ...resolvedParams,
        contentPath: resolvedParams.contentPath || []
    });

    validateData(data);

    console.debug(`Rendered ${draft ? 'draft ' : ''}page at [/${data.meta.locale}/${data.meta.path}]`);

    return (
        <>
            <MainView {...data}/>
            <PageEditorScript mode={data.meta.renderMode}/>
        </>
    )
};

export async function generateMetadata({params}: { params: Promise<PageProps> }): Promise<Metadata> {
    const resolvedParams = await params;
    const {common} = await fetchContent({
        ...resolvedParams,
        contentPath: resolvedParams.contentPath || []
    });
    return {
        title: common?.get?.displayName || 'Not found',
    };
}

export async function generateStaticParams(props: { params: PageProps }): Promise<any[]> {
    return await fetchContentPathsForAllLocales();
}
