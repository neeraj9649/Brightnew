// app/components/TextAnimation.tsx

'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/all'; 

interface AnimatedTextProps {
  tag: 'h1' | 'h2' | 'p'; // Specify allowed tags
  text: string;
  animationType: 'fade' | 'right' | 'left' | 'up' | 'down' | 'rotate' | 'scale'; // Pass animation type
}

const AnimatedText = ({ tag, text, animationType }: AnimatedTextProps) => {
  useEffect(() => {
    const splitTextElement = new SplitText(`#split-text-${tag}`, {
      type: 'chars, words',
    });

    gsap.set(`#split-text-${tag}`, {
      perspective: 400,
    });

    const setAnimation = (splitText: any) => {
      const animationSettings: any = {
        opacity: 0,
        ease: 'circ.out',
      };

      switch (animationType) {
        case 'fade':
          gsap.set(splitText.chars, { opacity: 0, ease: 'Back.easeOut' });
          break;
        case 'right':
          gsap.set(splitText.chars, { opacity: 0, x: '20', ease: 'Back.easeOut' });
          break;
        case 'left':
          gsap.set(splitText.chars, { opacity: 0, x: '-20', ease: 'Back.easeOut' });
          break;
        case 'up':
          gsap.set(splitText.chars, { opacity: 0, y: '20', ease: 'circ.out' });
          break;
        case 'down':
          gsap.set(splitText.chars, { opacity: 0, y: '-20', ease: 'circ.out' });
          break;
        case 'rotate':
          gsap.set(splitText.chars, { opacity: 0, rotateX: '50deg', ease: 'circ.out' });
          break;
        case 'scale':
          gsap.set(splitText.chars, { opacity: 0, rotateX: '50deg', ease: 'circ.out' });
          break;
        default:
          break;
      }

      gsap.to(splitText.chars, {
        scrollTrigger: {
          trigger: `#split-text-${tag}`,
          toggleActions: 'restart pause resume reverse',
          start: 'top 90%',
        },
        x: '0',
        y: '0',
        rotateX: '0',
        scale: 1,
        opacity: 1,
        duration: 1.2,
        stagger: 0.02,
      });
    };

    setAnimation(splitTextElement);

    return () => {
      splitTextElement.revert();
    };
  }, [tag, animationType]);

  const Tag = tag; // Dynamically render the appropriate tag (h1, h2, p)

  return (
    <Tag id={`split-text-${tag}`} className={`bw-split-in-${animationType}`}>
      {text}
    </Tag>
  );
};

export default AnimatedText;
