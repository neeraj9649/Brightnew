import React from 'react';
import bg from '@/assets/images/backgrounds/page-header-bg-1-1.jpg'
import Link from 'next/link';
interface PageHeaderProps {
   title?: string;
   subTitle?: string;
    
  }
const PageHeader: React.FC<PageHeaderProps> = ({title, subTitle}) => {
    return (
        <section className="page-header">
            <div className="page-header__bg" style={{backgroundImage: `url(${bg.src})`}}></div>
            <div className="container">
                <div className="page-header__content">
                    <h2 className="page-header__title bw-split-in-right">{title}</h2>
                    <ul className="gotur-breadcrumb list-unstyled">
                        <li><Link href="/">Home</Link></li>
                        <li><span>{subTitle}</span></li>
                    </ul>
                </div>
            </div>
        </section>
    );
};

export default PageHeader;