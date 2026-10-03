// import { StaticImageData } from 'next/image';
// import offer1Img from '@/assets/images/resources/offer-1-1.jpg';
// import offer2Img from '@/assets/images/resources/offer-1-2.jpg';
// import element from '@/assets/images/resources/about-3-1.png';

export interface OfferCard {
  id: number;
  tagline: string;
  title: string;
  image: string;
  link: string;
  alignment: 'left' | 'right';
  buttonStyle?: 'primary' | 'default';
}

export interface OfferOneData {
  sectionTagline: string;
  sectionTitle: string;
  element: string;
  offers: OfferCard[];
}

export const offerOneData: OfferOneData = {
  sectionTagline: 'Special Offers',
  sectionTitle: 'Offers To \nInspire You',
  element: '/images/resources/about-3-1.png',
  offers: [
    {
      id: 1,
      tagline: 'Special Offer',
      title: 'Explore All Tour Of The \nWorld With Us',
      image: '/images/resources/offer-1-1.jpg',
      link: '/tour-listing-details-1',
      alignment: 'left',
      buttonStyle: 'default',
    },
    {
      id: 2,
      tagline: 'Get 40% Offer',
      title: 'Tours and Trip \nPackages, Globally',
      image: '/images/resources/offer-1-2.jpg',
      link: '/tour-listing-details-1',
      alignment: 'right',
      buttonStyle: 'primary',
    },
  ],
};
