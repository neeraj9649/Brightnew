import React from "react";
import { Col, Container, Row } from "react-bootstrap";
import TextAnimation from "@/components/common/AnimatedText/TextAnimation";
import { teamData } from "@/data/teamPageData";

// About page: one row per team member. The first has the photo on the left and text on the right,
// the next swaps sides, and so on, so adding members to teamPageData keeps the zig-zag layout.
const TeamIntro: React.FC = () => (
  <section className='team-intro section-space-top'>
    <Container>
      <div className='sec-title text-center'>
        <h6 className='sec-title__tagline bw-split-in-right'>
          <TextAnimation text='Our Team' animationType='right' />
        </h6>
        <h3 className='sec-title__title bw-split-in-left'>
          <TextAnimation text='The People Behind BrightWings' animationType='left' />
        </h3>
      </div>
      {teamData.map((member, index) => {
        const photoRight = index % 2 === 1;
        return (
          <Row key={member.name} className='team-intro__row align-items-center gutter-y-30'>
            <Col lg={5} className={photoRight ? "order-lg-2" : ""}>
              <div className={`team-intro__photo wow ${photoRight ? "fadeInRight" : "fadeInLeft"}`} data-wow-duration='1500ms'>
                <img src={member.image} alt={member.name} />
              </div>
            </Col>
            <Col lg={7} className={photoRight ? "order-lg-1" : ""}>
              <div className='team-intro__content wow fadeInUp' data-wow-duration='1500ms' data-wow-delay='200ms'>
                <span className='team-intro__role'>{member.role}</span>
                <h3 className='team-intro__name'>{member.name}</h3>
                {member.bio.map((text, i) => (
                  <p key={i} className='team-intro__text'>{text}</p>
                ))}
              </div>
            </Col>
          </Row>
        );
      })}
    </Container>
  </section>
);

export default TeamIntro;
