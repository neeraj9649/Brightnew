import React from "react";

import Image, { StaticImageData } from "next/image"; // Import Image from next/image
import { Container, Row, Col } from "react-bootstrap"; // Import Bootstrap components
import { teamData } from "@/data/teamPageData";
import Link from "next/link";
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
const TeamPage: React.FC = () => {
  return (
    <section className='team-page section-space'>
      <Container>
        <Row className='gutter-y-30'>
          {teamData.map((member: TeamMember, index) => (
            <Col lg={4} md={6} key={index}>
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
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default TeamPage;
