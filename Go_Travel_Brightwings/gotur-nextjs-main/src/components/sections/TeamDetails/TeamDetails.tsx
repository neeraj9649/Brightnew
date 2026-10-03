import React from "react";

import Image, { StaticImageData } from "next/image"; // Import Image from next/image
import { Container, Row, Col } from "react-bootstrap"; // Import Bootstrap components
import { teamDetailsData } from "@/data/teamDetailsData";
import Link from "next/link";
interface TeamDetails {
  name: string;
  role: string;
  description: string;
  description2: string;
  phone: string;
  email: string;
  address: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
    youtube: string;
  };
  image: string;
  signature: string;
}
const TeamDetails: React.FC = () => {
  const {
    name,
    role,
    description,
    description2,
    phone,
    email,
    address,
    socialLinks,
    image,
    signature,
  }: TeamDetails = teamDetailsData;

  return (
    <section className='team-details-card section-space-top'>
      <Container>
        <div
          className='team-details-card__inner wow fadeInUp'
          data-wow-duration='1500ms'
          data-wow-delay='100ms'
        >
          <Row className='gutter-y-30'>
            <Col lg={4}>
              <div
                className='team-details-card__thumb wow fadeInLeft'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                <Image
                  src={image}
                  alt='team details'
                  width={350}
                  height={350}
                />
              </div>
            </Col>
            <Col lg={8}>
              <div className='team-details-card__content'>
                <div
                  className='team-details-card__content__top wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
                >
                  <div className='team-details-card__content__author'>
                    <h5 className='team-details-card__content__title'>
                      {name}
                    </h5>
                    <span className='team-details-card__content__dec'>
                      {role}
                    </span>
                  </div>
                  <div className='team-details-card__content__social'>
                    <Link
                      href={socialLinks.facebook}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <i className='icon-facebook' aria-hidden='true'></i>
                      <span className='sr-only'>Facebook</span>
                    </Link>
                    <Link
                      href={socialLinks.twitter}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <i className='fab fa-twitter' aria-hidden='true'></i>
                      <span className='sr-only'>Twitter</span>
                    </Link>
                    <Link
                      href={socialLinks.linkedin}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <i className='icon-linkedin' aria-hidden='true'></i>
                      <span className='sr-only'>LinkedIn</span>
                    </Link>
                    <Link
                      href={socialLinks.youtube}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <i className='icon-youtube' aria-hidden='true'></i>
                      <span className='sr-only'>YouTube</span>
                    </Link>
                  </div>
                </div>
                <p
                  className='team-details-card__content__text wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
                >
                  {description}
                </p>
                <p
                  className='team-details-card__content__text wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
                >
                  {description2}
                </p>
                <div
                  className='team-details-card__content__signeture wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
                >
                  <Image
                    src={signature}
                    alt='signature'
                    width={120}
                    height={60}
                  />
                </div>
                <ul
                  className='team-details-card__content__list list-unstyled wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
                >
                  <li>
                    <div className='team-details-card__content__list__icon'>
                      <i className='icon-telephone'></i>
                    </div>
                    <Link
                      href={`tel:${phone}`}
                      className='team-details-card__content__list__title'
                    >
                      {phone}
                    </Link>
                  </li>
                  <li>
                    <div className='team-details-card__content__list__icon'>
                      <i className='icon-paper-plane'></i>
                    </div>
                    <Link
                      href={`mailto:${email}`}
                      className='team-details-card__content__list__title'
                    >
                      {email}
                    </Link>
                  </li>
                  <li>
                    <div className='team-details-card__content__list__icon'>
                      <i className='icon-maps-and-flags'></i>
                    </div>
                    <Link
                      href='https://maps.google.com/'
                      className='team-details-card__content__list__title'
                    >
                      {address}
                    </Link>
                  </li>
                </ul>
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  );
};

export default TeamDetails;
