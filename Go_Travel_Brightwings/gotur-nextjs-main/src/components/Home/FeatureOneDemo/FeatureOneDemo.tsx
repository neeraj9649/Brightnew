import React from "react";
import Image from "next/image";
import { featureOneDemoData } from "@/data/FeatureOneDemoData";
import { Container } from "react-bootstrap";

const FeatureOneDemo = () => {
  return (
    <section className='features-one'>
      <Container>
        <h2 className='features-one__title'>Amazing Features</h2>
        <div className='features-one__grid'>
          {featureOneDemoData.slice(2).map((feature) => (
            <div key={feature.id} className='features-one__box'>
              <div className='features-one__box__image'>
                <Image
                  width={121}
                  height={121}
                  src={feature.image}
                  alt={feature.title}
                />
              </div>
              <h3 className='features-one__box__title'>{feature.title}</h3>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default FeatureOneDemo;
