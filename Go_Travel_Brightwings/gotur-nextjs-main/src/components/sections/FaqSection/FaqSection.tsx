"use client";
import React, { Fragment, useState } from "react";
import { Accordion, Col, Container, Row, Tab, Tabs } from "react-bootstrap";
import { faqData } from "@/data/faqData";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
// types.ts
interface Faq {
  question: string;
  answer: string;
}

interface FaqTab {
  id: string;
  title: string;
}

interface FaqTabContent {
  id: string;
  faqId: string;
  faqContent: {
    id: string;
    title: string;
    faqs: Faq[];
  }[];
}

export interface FaqData {
  title: string;
  subTitle: string;
  image: StaticImageData;
  faqTabs: FaqTab[];
  faqTabsContent: FaqTabContent[];
}

const FaqSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("1");

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <section className='faq-page section-space tabs-box'>
      <Container>
        <div className='tabs-box'>
          <Row className='gutter-y-30'>
            <Col lg={4}>
              <div className='faq-page__sidebar'>
                <div
                  className='faq-page__sidebar__item wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='300ms'
                >
                  <ul className='faq-page__sidebar__list list-unstyled tab-buttons'>
                    {faqData.faqTabs.map((tab) => (
                      <li
                        key={tab.id}
                        className={`sidebar__tab tab-btn ${
                          activeTab === tab.id ? "active-btn" : ""
                        }`}
                        data-tab={`#item${tab.id}`}
                        onClick={() => handleTabSelect(tab.id)}
                      >
                        <span>{tab.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className='faq-page__sidebar__item wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay='500ms'
                >
                  <div className='faq-page__sidebar__cta'>
                    <Image src={faqData.image} alt='sidebar' />
                    <div className='faq-page__sidebar__cta__content'>
                      <span className='faq-page__sidebar__sub-title'>
                        {faqData.subTitle}
                      </span>
                      <h3 className='faq-page__sidebar__title'>
                        {faqData.title}
                      </h3>
                      <Link
                        href='/tour-listing-details-2'
                        className='gotur-btn'
                      >
                        Book Now{" "}
                        <span className='icon'>
                          <i className='icon-right'></i>
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={8}>
              <div className='tabs-content'>
                {faqData.faqTabsContent.map((tabContent: FaqTabContent) => (
                  <div
                    key={tabContent.id}
                    className={`faq-accordion__item tab ${
                      tabContent.faqId === activeTab ? "active-tab" : ""
                    }`}
                  >
                    <div
                      title={
                        faqData.faqTabs.find(
                          (tab) => tab.id === tabContent.faqId
                        )?.title
                      }
                    >
                      {tabContent.faqContent.map((faq) => (
                        <div
                          key={faq.id}
                          className='faq-accordion gotur-accordion'
                          data-grp-name='gotur-accordion'
                        >
                          <div
                            className='faq-page__title wow fadeInUp'
                            data-wow-duration='1500ms'
                            data-wow-delay='500ms'
                          >
                            {faq.title}
                          </div>
                          <Accordion
                            defaultActiveKey='0'
                            className=' wow fadeInUp'
                            data-wow-duration='1500ms'
                            data-wow-delay='500ms'
                          >
                            {faq.faqs.map((faq, idx) => (
                              <Accordion.Item
                                eventKey={idx.toString()}
                                key={idx}
                              >
                                <Accordion.Header>
                                  <div className='accordion-title'>
                                    <h4 className='accordion-title__text'>
                                      {faq.question}
                                      <span className='accordion-title__icon'></span>
                                    </h4>
                                  </div>
                                </Accordion.Header>
                                <Accordion.Body>
                                  <div className='accordion-content'>
                                    <div className='inner'>
                                      <p className='inner__text'>
                                        {faq.answer}
                                      </p>
                                    </div>
                                  </div>
                                </Accordion.Body>
                              </Accordion.Item>
                            ))}
                          </Accordion>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  );
};

export default FaqSection;
