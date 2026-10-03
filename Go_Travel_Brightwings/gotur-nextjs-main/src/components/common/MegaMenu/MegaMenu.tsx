// MegaMenu Component
import React from "react";

import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";
import { demoData } from "@/data/DemoData";

interface Page {
  id: number;
  image: string;
  title: string;
  alt: string;
  href: string;
  buttons?: { href: string; label: string }[];
}

interface MegaMenuProps {
  setIsMegaMenu: React.Dispatch<React.SetStateAction<boolean>>;
  isMegamenu: boolean;
}

const MegaMenu: React.FC<MegaMenuProps> = ({ setIsMegaMenu, isMegamenu }) => {
  return (
    <ul className={` ${isMegamenu ? "megamenu-clickable--active" : ""}`}>
      <li>
        <div className='megamenu-popup'>
          <Link
            href=''
            className='megamenu-clickable--close'
            onClick={() => setIsMegaMenu(false)}
          >
            <span className='icon-close'></span>
          </Link>
          <div className='megamenu-popup__content'>
            <div className='demo-one'>
              <Container>
                <Row>
                  {demoData.map((page: Page, index: number) => (
                    <Col md={6} lg={4} key={index}>
                      <div className='demo-one__card'>
                        <div className='demo-one__image'>
                          <img
                            src={page.image}
                            alt={page.title}
                            height={100}
                            width={100}
                            style={{ height: "auto" }}
                          />

                          <div className='demo-one__btns'>
                            {page?.buttons?.map((item, index) => (
                              <Link
                                href={item.href}
                                key={index}
                                className='gotur-btn demo-one__btn'
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                        <div className='demo-one__content'>
                          <h3 className='demo-one__title'>
                            <Link href={page?.href}>{page?.title}</Link>
                          </h3>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Container>
            </div>
          </div>
        </div>
      </li>
    </ul>
  );
};

export default MegaMenu;
