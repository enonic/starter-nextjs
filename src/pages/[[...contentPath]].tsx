import React from 'react';
import {ContentApiBaseBody, Context, fetchContent, fetchGuillotine} from "../_enonicAdapter/guillotine/fetchContent";
import MainView from "../_enonicAdapter/views/MainView";
import {CONTENT_API_URL, IS_DEV_MODE, RENDER_MODE} from "../_enonicAdapter/utils";

// Register component mappings
import "../_enonicAdapter/baseMappings";
import "../components/_mappings";

const query = `query($path: ID) {
                  guillotine {
                    getChildren(key: $path) {
                      _path
                      site {
                        _name
                      }
                      contentType {
                        superType
                        name
                      }
                    }
                  }
                }`;

export async function getStaticProps(context: Context) {
    const {
        common = null,
        data = null,
        meta,
        error = null,
        page = null,
    } = await fetchContent(context.params?.contentPath || [], context);

    // HTTP 500
    if (error && error.code === '500') {
        throw error
    }

    let catchAllInNextProdMode = meta?.renderMode === RENDER_MODE.NEXT && !IS_DEV_MODE && meta?.catchAll;

    const props = {
        common,
        data,
        meta,
        error,
        page,
    }

    const notFound = (error && error.code === '404') || context.res?.statusCode === 404 || catchAllInNextProdMode || undefined;

    return {
        notFound,
        props,
        revalidate: 60 * 60 // ISR every hour
    }
}

export async function getStaticPaths() {
    const paths = await recursiveFetchChildren('\${site}/');

    return {
        paths: paths,
        fallback: 'blocking',
    };
}

interface Item {
    params: { contentPath: string }
}

async function recursiveFetchChildren(path: string, paths: Item[] = []): Promise<Item[]> {
    const body: ContentApiBaseBody = {
        query,
        variables: {path}
    };
    const result = await fetchGuillotine(CONTENT_API_URL, body, path);

    return result?.guillotine?.getChildren.reduce(async (prevPromise: Promise<Item[]>, child: any) => {
        const prev = await prevPromise;
        prev.push({
            params: {
                contentPath: child._path.replace(`/${child.site?._name}/`, '').split('/')
            }
        });

        if (child.contentType?.name === 'base:folder' || child.contentType?.superType === 'base:folder') {
            await recursiveFetchChildren(child._path, prev);
        }
        return prev;
    }, paths);
}

export default MainView;
