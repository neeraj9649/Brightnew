"use client";

import Image, { StaticImageData } from "next/image";

import destinationInfo, { mapEmbedUrl } from "@/data/destinationInfoData";
import destinationOneData from "@/data/destinationOneData";
import Link from "next/link";
import { Col, Container, Row } from "react-bootstrap";
import destinationsTwoGridData from "@/data/destinationTwoGridData";
interface Destination {
  title: string;
  image: string;
  link: string;
  colorClass: string;
  wowDelay: string;
}

const DestinationTwoLeft = () => {
  return (
    <section className='destination-one section-space'>
      <Container>
        <Row className='gutter-y-30 gutter-x-30'>
          {/* Sidebar */}
          <Col lg={4}>
            <aside className='destination-details__sidebar'>
              <div className='destination-details__sidebar__item destination-details__sidebar__item-list wow fadeInUp'>
                <h4 className='destination-details__sidebar__title'>
                  Some Information
                </h4>
                <ul className='destination-details__sidebar__list'>
                  {destinationInfo.map((item, index) => (
                    <li key={index}>
                      <p className='destination-details__sidebar__text'>
                        <i className='icon-check-star'></i> {item.label}:
                      </p>
                      <span>{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className='destination-details__sidebar__item destination-details__sidebar__item-map wow fadeInUp'>
                <iframe
                  title='Google Map'
                  src={mapEmbedUrl}
                  allowFullScreen
                  className='w-100'
                  height='300'
                />
              </div>
            </aside>
          </Col>

          {/* Destinations */}
          <Col lg={8}>
            <div className='row gutter-y-20 gutter-x-20'>
              {destinationsTwoGridData
                .slice(0, 6)
                .map((item: Destination, index: number) => (
                  <Col sm={6} md={6} key={index}>
                    <div
                      className={`destination-card-two ${item.colorClass} wow fadeInUp`}
                    >
                      <div className='destination-card-two__thumb'>
                        <Image src={item.image} alt={item.title} />
                        <Link
                          href={item.link}
                          className='destination-card-two__overly'
                        ></Link>
                      </div>
                      <div className='destination-card-two__content'>
                        <h3 className='destination-card-two__title'>
                          <Link href={item.link}>{item.title}</Link>
                        </h3>
                      </div>
                    </div>
                  </Col>
                ))}

              {/* Pagination */}
              <div className='col-12'>
                <ul className='post-pagination justify-content-center wow fadeInUp'>
                  <li>
                    <Link href='#' className='previous'>
                      Previous
                    </Link>
                  </li>
                  <li>
                    <Link href='#'>1</Link>
                  </li>
                  <li>
                    <Link href='#'>2</Link>
                  </li>
                  <li>
                    <Link href='#'>3</Link>
                  </li>
                  <li>
                    <Link href='#'>...</Link>
                  </li>
                  <li className='active'>
                    <Link href='#' className='next'>
                      Next
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default DestinationTwoLeft;
