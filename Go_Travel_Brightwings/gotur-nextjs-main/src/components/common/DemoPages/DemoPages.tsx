import React from "react";
import { demoPages } from "@/data/demoPages"; // Import your data
import Image, { StaticImageData } from "next/image"; // For image optimization
import Link from "next/link"; // Import Link from Next.js
import { Col, Container, Row } from "react-bootstrap";

interface Page {
  image: string;
  title: string;
  isNew?: boolean;
  multiPageLink?: string;
  onePageLink?: string;
  darkPageLink?: string;
  viewPageLink?: string;
}

const DemoPages: React.FC = () => {
  return (
    <ul>
      <li>
        <section className='home-showcase'>
          <Container>
            <div className='home-showcase__inner'>
              <Row>
                {demoPages.map((page: Page, index: number) => (
                  <Col lg={3} md={6} key={index}>
                    <div className='demo-one__card'>
                      <div className='demo-one__image'>
                        <Image
                          src={page.image}
                          alt={`gotur image ${page.title}`}
                        />
                        <div className='demo-one__btns'>
                          {page.multiPageLink && (
                            <Link
                              href={page.multiPageLink}
                              className='gotur-btn demo-one__btn'
                            >
                              Multi Page
                            </Link>
                          )}
                          {page.onePageLink && (
                            <Link
                              href={page.onePageLink}
                              className='gotur-btn demo-one__btn'
                            >
                              One Page
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className='demo-one__content'>
                        <h3 className='demo-one__title'>
                          {/* <Link href={page.multiPageLink}>
                         {page.title}
                            </Link> */}
                        </h3>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </Container>
        </section>
      </li>
    </ul>
  );
};

export default DemoPages;
