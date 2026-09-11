import React from 'react';
import styles from './Header.module.css';
import { MetaData, pageUrl } from '@enonic/nextjs-adapter';
import Link from 'next/link';

export interface HeaderProps {
    title: string;
    logoUrl: string;
    meta: MetaData;
}


const Header = ({title, logoUrl, meta}: HeaderProps) => {

    return <header className={styles.header}>
        <div className={styles.wrapper}>
            {title && (
                <h1>
                    <Link href={pageUrl({ path: '/' }, meta)} data-content-path={meta.site}>{title}</Link>
                </h1>
            )}
            {logoUrl && (
                <img src={logoUrl}
                     width={33}
                     height={40}
                     alt={"Enonic XP logo"}
                />
            )}
        </div>
    </header>
};

export default Header
