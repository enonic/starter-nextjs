'use client';

import { RENDER_MODE, MetaData } from '@enonic/nextjs-adapter';
import {
    init,
    subscribe,
    isInitialized,
    renderLoadingComponent,
    renderComponent,
    renderErrorComponent,
} from '@enonic/page-editor';

const SINGLE_COMPONENT_MARKER = 'details[data-single-component-output="true"]';

const PageEditorScript = function ({ meta: { locale, renderMode, path: contentPath } }: { meta: MetaData }) {

    if (isInitialized()) {
        return null;
    }

    init({ editMode: renderMode === RENDER_MODE.EDIT });
    console.info(`Page editor started in ${renderMode} mode.`);

    subscribe('component-load-request', async ({ path, isExisting }) => {
        if (!path) {
            return;
        }

        renderLoadingComponent(path);

        try {
            const url = `/${locale}/${contentPath}/_/component/${path}`.replace(/\/{2,}/g, '/');

            const res = await fetch(url, { credentials: 'same-origin' });
            if (!res.ok) {
                throw new Error(`Component load failed: ${res.status} ${res.statusText}`);
            }

            const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
            const marker = doc.querySelector(SINGLE_COMPONENT_MARKER);
            if (!marker) {
                throw new Error('Single-component marker not found in response');
            }

            renderComponent(path, marker.innerHTML);
        } catch (err) {
            renderErrorComponent(path, err instanceof Error ? err : new Error(String(err)));
        }
    });

    return null;
};

export default PageEditorScript;
