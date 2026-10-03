"use client";

import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { footerOneData } from "@/data/footerOneData";
import MailchimpSubscribe from "react-mailchimp-subscribe";

const url = "//xxxx.us13.list-manage.com/subscribe/post?u=zefzefzef&id=fnfgn";

interface SocialLink {
  icon: string;
  link: string;
  label: string;
}

interface FooterDataType {
  logo: string;
  cardImage: string;
  shape1: string;
  shape2: string;
  contact: {
    email: string;
    phone: string;
    hours: string;
  };
  about: {
    text: string;
    socials: {
      icon: string;
      link: string;
      label: string;
    }[];
  };
  destinations: {
    title: string;
    href: string;
  }[];
  usefulLinks: {
    title: string;
    href: string;
  }[];
  newsletter: {
    text: string;
    privacyLink: string;
  };
}
const FooterOne: React.FC = () => {
  const data: FooterDataType = footerOneData;

  return (
    <footer className='main-footer'>
      <div className='main-footer__top'>
        <Container>
          <div
            className='main-footer__top__inner wow fadeInUp'
            data-wow-duration='1500ms'
            data-wow-delay='200ms'
          >
            <div className='footer-widget__logo logo-retina'>
              <Link href='/'>
                <img
                  src={data.logo}
                  alt='bright wings logo'
                  width={188}
                  height={65}
                />
              </Link>
            </div>
            <ul className='list-unstyled footer-widget__list'>
              <li>
                <div className='footer-widget__list__icon'>
                  <i className='icon-email'></i>
                </div>
                <div className='footer-widget__list__content'>
                  <span className='footer-widget__list__subtitle'>
                    send email
                  </span>
                  <Link href={`mailto:${data.contact.email}`}>
                    {data.contact.email}
                  </Link>
                </div>
              </li>
              <li>
                <div className='footer-widget__list__icon'>
                  <i className='icon-telephone'></i>
                </div>
                <div className='footer-widget__list__content'>
                  <span className='footer-widget__list__subtitle'>
                    call agent
                  </span>
                  <Link href={`tel:${data.contact.phone}`}>
                    {data.contact.phone}
                  </Link>
                </div>
              </li>
              <li>
                <div className='footer-widget__list__icon'>
                  <i className='icon-clock-1'></i>
                </div>
                <div className='footer-widget__list__content'>
                  <span className='footer-widget__list__subtitle'>
                    opening time
                  </span>
                  <p>{data.contact.hours}</p>
                </div>
              </li>
            </ul>
          </div>
        </Container>
      </div>

      <div className='main-footer__middle'>
        <Container>
          <Row className='gutter-y-40'>
            <Col md={6} lg={4} xl={3}>
              <div
                className='footer-widget footer-widget--about wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='00ms'
              >
                <h2 className='footer-widget__title'>about BrightWings</h2>
                <p className='footer-widget__about-text'>{data.about.text}</p>
                <div className='footer-widget__social'>
                  {data.about.socials.map((social: SocialLink, idx) => (
                    <Link key={idx} href={social.link}>
                      <i className={social.icon} aria-hidden='true'></i>
                      <span className='sr-only'>{social.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </Col>

            <Col md={6} lg={4} xl={3}>
              <div
                className='footer-widget footer-widget--links wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='200ms'
              >
                <h2 className='footer-widget__title'>Destinations</h2>
                <ul className='list-unstyled footer-widget__links'>
                  {data.destinations.map((item, idx) => (
                    <li key={idx}>
                      <Link href={item.href}>{item.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Col>

            <Col md={6} lg={4} xl={3}>
              <div
                className='footer-widget footer-widget--post wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='400ms'
              >
                <h2 className='footer-widget__title'>useful links</h2>
                <ul className='list-unstyled footer-widget__links'>
                  {data.usefulLinks.map((item, idx) => (
                    <li key={idx}>
                      <Link href={item.href}>{item.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Col>

            <Col md={6} lg={5} xl={3}>
              <div
                className='footer-widget footer-widget--contact wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='600ms'
              >
                <h2 className='footer-widget__title'>Newsletter</h2>
                <p className='footer-widget__contact-text'>
                  {data.newsletter.text}
                </p>
                <MailchimpSubscribe
                  url={url}
                  render={(props: any) => {
                    const { subscribe, status, message } = props || {};
                    return (
                      <div className='mc-form'>
                        <form
                          className='footer-widget__newsletter mc-form'
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const emailInput = form.querySelector(
                              'input[name="EMAIL"]'
                            ) as HTMLInputElement;
                            if (emailInput && emailInput.value) {
                              subscribe({ EMAIL: emailInput.value });
                            }
                          }}
                        >
                          <div className='form-group__form'>
                            <input
                              type='email'
                              name='EMAIL'
                              placeholder='Your email address'
                            />
                            <button type='submit' className='gotur-btn'>
                              <span className='icon-right-arrow'></span>
                            </button>
                          </div>
                          <div className='form-group__check'>
                            <input type='checkbox' name='checkbox' id='check' />
                            <label htmlFor='check'>
                              I agree to the{" "}
                              <Link href={data.newsletter.privacyLink}>
                                Privacy Policy.
                              </Link>
                            </label>
                          </div>
                        </form>

                        <div className='mc-form__response'>
                          {" "}
                          {status === "sending" && <div>sending...</div>}
                          {status === "error" && (
                            <div
                              dangerouslySetInnerHTML={{ __html: message }}
                            />
                          )}
                          {status === "success" && <div>Subscribed !</div>}
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            </Col>
          </Row>
        </Container>

        <div className='main-footer__element-one'>
          <img src={data.shape1} alt='footer shape' width={200} height={100} />
        </div>
        <div className='main-footer__element-two'>
          <img src={data.shape2} alt='footer shape' width={300} height={100}  />
        </div>
      </div>

      <div className='main-footer__bottom'>
        <Container>
          <div className='main-footer__bottom__inner'>
            <p className='main-footer__copyright'>
              &copy; Copyright{" "}
              <span className='dynamic-year'>{new Date().getFullYear()}</span>{" "}
              Bright Wings Travel & Tourism. All rights reserved.
            </p>
            <div className='main-footer__bottom__pyment'>
              <Link href='/checkout'>
                <img src={data.cardImage} alt='gotur payment' width={200} height={100} />
              </Link>
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
};

export default FooterOne;
