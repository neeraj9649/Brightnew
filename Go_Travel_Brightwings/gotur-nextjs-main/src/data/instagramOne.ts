// import { StaticImageData } from 'next/image';
// import insta1 from '@/assets/images/instragarm/insta-1-1.jpg';
// import insta2 from '@/assets/images/instragarm/insta-1-2.jpg';
// import insta3 from '@/assets/images/instragarm/insta-1-3.jpg';
// import insta4 from '@/assets/images/instragarm/insta-1-4.jpg';
// import insta5 from '@/assets/images/instragarm/insta-1-5.jpg';
// import insta6 from '@/assets/images/instragarm/insta-1-6.jpg';

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
    { id: 1, image: '/images/instragarm/insta-1-1.jpg', link: 'https://www.instagram.com/' },
    { id: 2, image: '/images/instragarm/insta-1-2.jpg', link: 'https://www.instagram.com/' },
    { id: 3, image: '/images/instragarm/insta-1-3.jpg', link: 'https://www.instagram.com/' },
    { id: 4, image: '/images/instragarm/insta-1-4.jpg', link: 'https://www.instagram.com/' },
    { id: 5, image: '/images/instragarm/insta-1-5.jpg', link: 'https://www.instagram.com/' },
    { id: 6, image: '/images/instragarm/insta-1-6.jpg', link: 'https://www.instagram.com/' },
    { id: 7, image: '/images/instragarm/insta-1-1.jpg', link: 'https://www.instagram.com/' },
    { id: 8, image: '/images/instragarm/insta-1-2.jpg', link: 'https://www.instagram.com/' },
    { id: 9, image: '/images/instragarm/insta-1-3.jpg', link: 'https://www.instagram.com/' },
    { id: 10, image: '/images/instragarm/insta-1-4.jpg', link: 'https://www.instagram.com/' },
    { id: 11, image: '/images/instragarm/insta-1-5.jpg', link: 'https://www.instagram.com/' },
    { id: 12, image: '/images/instragarm/insta-1-6.jpg', link: 'https://www.instagram.com/' },
  ],
};
