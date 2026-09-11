import Link from 'next/link';
import React from 'react';
import { I18n } from '@enonic/nextjs-adapter';

const Footer = () => (
    <footer style={{
        margin: `0 auto`,
        maxWidth: 960,
        padding: `0 1.0875rem 1.45rem`,
    }}>
        <br/>
        <hr/>
        <br/>
        {`© ${new Date().getFullYear()}, `}
        {` ${I18n.localize('built-with')} `}
        <Link href="https://nextjs.org">Next.js</Link>
        {` ${I18n.localize('powered-by')} `}
        <Link href="https://enonic.com">Enonic XP</Link>
    </footer>
);

export default Footer;
