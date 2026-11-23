// import { StaticImageData } from 'next/image';
// import insta1 from '@/assets/images/instragarm/insta-1-1.jpg';
// import insta2 from '@/assets/images/instragarm/insta-1-2.jpg';
// import insta3 from '@/assets/images/instragarm/insta-1-3.jpg';
// import insta4 from '@/assets/images/instragarm/insta-1-4.jpg';
// import insta5 from '@/assets/images/instragarm/insta-1-5.jpg';
// import insta6 from '@/assets/images/instragarm/insta-1-6.jpg';

// Every photo opens the Bright Wings Instagram profile.
const INSTAGRAM = 'https://www.instagram.com/brightwingstours/?hl=en';

export interface InstagramItem {
  id: number;
  image: string;
  link: string;
}

export interface InstagramOneData {
  title: string;
  items: InstagramItem[];
}

export const instagramOneData: InstagramOneData = {
  title: 'Follow Instagram',
  items: [
    { id: 1, image: '/images/instragarm/insta-1-1.jpg', link: INSTAGRAM },
    { id: 2, image: '/images/instragarm/insta-1-2.jpg', link: INSTAGRAM },
    { id: 3, image: '/images/instragarm/insta-1-3.jpg', link: INSTAGRAM },
    { id: 4, image: '/images/instragarm/insta-1-4.jpg', link: INSTAGRAM },
    { id: 5, image: '/images/instragarm/insta-1-5.jpg', link: INSTAGRAM },
    { id: 6, image: '/images/instragarm/insta-1-6.jpg', link: INSTAGRAM },
    { id: 7, image: '/images/instragarm/insta-1-1.jpg', link: INSTAGRAM },
    { id: 8, image: '/images/instragarm/insta-1-2.jpg', link: INSTAGRAM },
    { id: 9, image: '/images/instragarm/insta-1-3.jpg', link: INSTAGRAM },
    { id: 10, image: '/images/instragarm/insta-1-4.jpg', link: INSTAGRAM },
    { id: 11, image: '/images/instragarm/insta-1-5.jpg', link: INSTAGRAM },
    { id: 12, image: '/images/instragarm/insta-1-6.jpg', link: INSTAGRAM },
  ],
};
