"use client";
import React from "react";
import Image, { StaticImageData } from "next/image";
import { Container, Row, Col } from "react-bootstrap";
import { teamData } from "@/data/teamPageData";
import dynamic from "next/dynamic";
import Link from "next/link";
const TinySlider = dynamic(() => import("tiny-slider-react"), {
  ssr: false,
});
interface TeamMember {
  name: string;
  role: string;
  image: string;
  socialLinks: {
    facebook: string;
    linkedin: string;
    instagram: string;
  };
}
const TeamCarousel: React.FC = () => {
  return (
    <section className='team-page section-space'>
      <Container>
        <div className='team-page__carousel gotur-owl__carousel gotur-owl__carousel--with-shadow gotur-owl__carousel--basic-nav owl-carousel owl-theme'>
          <TinySlider
            settings={{
              items: 1,
              gutter: 30,
              loop: false,
              nav: false,
              autoplay: false,
              controls: true,
              mouseDrag: true,
              controlsContainer: ".owl-nav",
              responsive: {
                0: {
                  items: 1,
                },
                768: {
                  items: 2,
                },
                992: {
                  items: 3,
                },
              },
            }}
          >
            {teamData.map((member: TeamMember, index) => (
              <div key={index}>
                <div
                  className='team-card wow fadeInUp'
                  data-wow-duration='1500ms'
                  data-wow-delay={`${100 * index}ms`}
                >
                  <div className='team-card__thumb'>
                    <div className='team-card__thumb__item'>
                      <Image
                        src={member.image}
                        alt={`team member ${member.name}`}
                        width={350}
                        height={350}
                      />
                    </div>
                    <div className='team-card__social'>
                      <Link
                        href={member.socialLinks.facebook}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <i className='icon-facebook' aria-hidden='true'></i>
                        <span className='sr-only'>Facebook</span>
                      </Link>
                      <Link
                        href={member.socialLinks.linkedin}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <i className='icon-linkedin' aria-hidden='true'></i>
                        <span className='sr-only'>LinkedIn</span>
                      </Link>
                      <Link
                        href={member.socialLinks.instagram}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <i className='fab fa-instagram' aria-hidden='true'></i>
                        <span className='sr-only'>Instagram</span>
                      </Link>
                      <p>Share</p>
                    </div>
                  </div>
                  <div className='team-card__content'>
                    <h4 className='team-card__title'>{member.name}</h4>
                    <p className='team-card__dec'>{member.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </TinySlider>
          <div className='owl-nav'>
            <button
              type='button'
              role='presentation'
              className='owl-prev'
              aria-label='carousel button'
            >
              <span className='icon-arrow-left'></span>
            </button>
            <button
              type='button'
              role='presentation'
              className='owl-next'
              aria-label='carousel button'
            >
              <span className='icon-arrow-right'></span>
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TeamCarousel;
