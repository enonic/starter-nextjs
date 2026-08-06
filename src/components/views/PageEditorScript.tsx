'use client';

import {RENDER_MODE} from '@enonic/nextjs-adapter';
import {EditorEvents, PageEditor} from '@enonic/page-editor';

const PageEditorScript = function ({mode}: { mode: RENDER_MODE }) {

    if (PageEditor.isInitialized()) {
        return;
    }

    PageEditor.init({editMode: mode === RENDER_MODE.EDIT});
    console.info(`Page editor started in ${mode} mode.`);

    PageEditor.on(EditorEvents.ComponentLoadRequest, (event => {
            const data = event.getData();
            console.log('Component load request', data);
        })
    );

    return null;
};

export default PageEditorScript;
