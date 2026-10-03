declare module 'react-slick' {
    import * as React from 'react';
  
    interface Settings {
      accessibility?: boolean;
      adaptiveHeight?: boolean;
      arrows?: boolean;
      autoplay?: boolean;
      autoplaySpeed?: number;
      cssEase?: string;
      dots?: boolean;
      draggable?: boolean;
      easing?: string;
      fade?: boolean;
      infinite?: boolean;
      initialSlide?: number;
      lazyLoad?: 'ondemand' | 'progressive';
      pauseOnHover?: boolean;
      responsive?: Array<{
        breakpoint: number;
        settings: 'unslick' | Settings;
      }>;
      rtl?: boolean;
      slidesToShow?: number;
      slidesToScroll?: number;
      speed?: number;
      swipe?: boolean;
      swipeToSlide?: boolean;
      touchMove?: boolean;
      touchThreshold?: number;
      useCSS?: boolean;
      useTransform?: boolean;
      variableWidth?: boolean;
      vertical?: boolean;
      waitForAnimate?: boolean;
      // Add more options as needed
    }
  
    export default class Slider extends React.Component<Settings> {}
  }
  