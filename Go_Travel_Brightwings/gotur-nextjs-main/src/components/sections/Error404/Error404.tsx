import React from 'react';
import image from '@/assets/images/shapes/error-1-1.png'
import shape1 from '@/assets/images/shapes/shape-1-1.png'
import shape2 from '@/assets/images/shapes/shape-1-2.png'
import Image from 'next/image';
import Link from 'next/link';
import { Container } from 'react-bootstrap';

const Error404: React.FC = () => {
    return (
        <section className="error-404 section-space">
            <Container>
                <div className="error-404__inner">
                <div className="error-404__thumb" >
                    <Image src={image} alt="error image" />
                </div>
                <div className="error-404__element-one">
                <Image src={shape1} alt="error image" />
                    </div>
                    <div className="error-404__element-two">
                    <Image src={shape2} alt="error image" />
                    </div>
                </div>
                <h3 className="error-404__sub-title wow fadeInUp animated" data-wow-duration="1500ms" data-wow-delay="300ms"><span>Oops!</span> Page not found</h3>
                <p className="error-404__text wow fadeInUp animated" data-wow-duration="1500ms" data-wow-delay="500ms" >The page you are looking for does not exist</p>
                <div className="error-404__btns wow fadeInUp animated" data-wow-duration="1500ms" data-wow-delay="600ms" >
                    <Link href="/" className="gotur-btn gotur-btn--primary error-404__btn">Back to Home Pages <span className="icon"><i className="icon-right"></i></span></Link>
                </div>
            </Container>
        </section>

    );
};

export default Error404;