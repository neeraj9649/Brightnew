"use client";
import React, { useEffect, useState } from "react";

import { Container, Row, Col } from "react-bootstrap";
import { teamSkillsData } from "@/data/teamSkillOneData";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
interface Skill {
  title: string;
  percentage: number;
}

interface TeamSkills {
  name: string;
  role: string;
  description: string;
  description2: string;
  skills: Skill[];
  text: string;
}
const TeamSkillsOne: React.FC = () => {
  const { name, role, description, description2, skills, text }: TeamSkills =
    teamSkillsData;
  const { ref, inView } = useInView({
    threshold: 0.8,
    triggerOnce: true,
  });

  return (
    <section className='team-skills-one'>
      <Container>
        <div className='row'>
          <div className='col-12'>
            <div className='team-skills-one__top'>
              <h4
                className='team-skills-one__top__title wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                Personal Information
              </h4>
              <p
                className='team-skills-one__top__text wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                {description}
              </p>
              <p
                className='team-skills-one__top__text wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                {description2}
              </p>
            </div>
            <div className='team-skills-one__inner' ref={ref}>
              <h4
                className='team-skills-one__inner__title wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                Personal Skills
              </h4>
              <div
                className='team-skills-one__skills wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                {skills.map((skill, index) => (
                  <div
                    className='team-skills-one__progress progress-box'
                    key={index}
                  >
                    <h4 className='progress-box__title'>{skill.title}</h4>
                    <div className='progress-box__bar'>
                      <div
                        className='progress-box__bar__inner count-bar'
                        style={{
                          width: inView ? `${skill.percentage}%` : "0%",
                        }}
                      >
                        <div className='progress-box__number count-text'>
                          {inView && (
                            <CountUp
                              start={0}
                              end={skill.percentage}
                              duration={1.5}
                            />
                          )}{" "}
                          %
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p
                className='team-skills-one__top__text wow fadeInUp'
                data-wow-duration='1500ms'
                data-wow-delay='300ms'
              >
                {text}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default TeamSkillsOne;
