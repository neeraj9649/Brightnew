import React from 'react';
import BrightLogo from '../../assets/BrightLogo.png';

// ponytail: LoadingSpinner.css migrated to Tailwind utilities. Size variants
// (small/medium/large) via the map below. Ring = 4 partial-circle divs spun
// with staggered delays (animate-spin); logo centers via the flex static
// position of the absolute child.
const SIZES = {
  small: { box: 'min-h-[100px] p-[16px]', ring: 'h-[32px] w-[32px]', dot: 'h-[26px] w-[26px] m-[2px] border-[2px]', logo: 'h-[18px] w-[18px]', msg: 'mt-[8px] text-[11px]' },
  medium: { box: 'min-h-[200px] p-[32px]', ring: 'h-[64px] w-[64px]', dot: 'h-[51px] w-[51px] m-[6px] border-[6px]', logo: 'h-[34px] w-[34px]', msg: 'mt-[16px] text-[12px]' },
  large: { box: 'min-h-screen p-[32px]', ring: 'h-[80px] w-[80px]', dot: 'h-[64px] w-[64px] m-[8px] border-[8px]', logo: 'h-[44px] w-[44px]', msg: 'mt-[24px] text-[14px]' },
};

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const s = SIZES[size] || SIZES.medium;
  const dot = `absolute box-border block animate-spin rounded-full border-solid border-[var(--color-primary)] border-r-transparent border-b-transparent border-l-transparent ${s.dot}`;
  return (
    <div className={`flex flex-col items-center justify-center ${s.box}`}>
      <div className="relative flex items-center justify-center">
        <div className={`relative inline-block ${s.ring}`}>
          <div className={`${dot} [animation-delay:-0.45s]`}></div>
          <div className={`${dot} [animation-delay:-0.3s]`}></div>
          <div className={`${dot} [animation-delay:-0.15s]`}></div>
          <div className={dot}></div>
        </div>
        <img className={`absolute object-contain ${s.logo}`} src={BrightLogo} alt="Bright Wings" />
      </div>
      {message && (
        <p className={`text-center font-medium text-[var(--color-text-secondary)] ${s.msg}`}>{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
