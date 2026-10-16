import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { Database, Plane, Star } from 'lucide-react';
import BrightLogo from '../assets/BrightLogo.png';
import frontArt from '../assets/card-front.jpg';
import backArt from '../assets/card-back.jpg';

/*
 * Bright Wings membership card, front and back. Everything on it comes from the member record
 * (/loyalty/summary → card): name, membership code, tier and validity; the QR code points at the
 * public verification page (/card/<code>). Sizes are in em with 1 unit (--u) = 1/93.8 of the card width, so the
 * card scales to any container (and downloadCardImage captures it exactly as shown).
 */

const DESIGN_WIDTH = 938; // px, the width the layout was drawn at (1em = 10 design px)

function useCardFontSize(ref) {
  const [size, setSize] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => setSize((el.getBoundingClientRect().width / DESIGN_WIDTH) * 10);
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** "AA0SLV1752" → "AA0 SLV 1752" (initials+age, tier code, 4-digit number). */
export function formatMemberCode(code = '') {
  const m = /^(.*?)([A-Z]{3})(\d{4})$/.exec(code);
  return m && m[1] ? `${m[1]} ${m[2]} ${m[3]}` : code;
}

export const formatValidThru = (date) => {
  const d = date ? new Date(date) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
};

function Brand({ className = '' }) {
  return (
    <div className={`bwc-brand ${className}`}>
      <img src={BrightLogo} alt="" crossOrigin="anonymous" />
      <span><b>Bright Wings</b><small>TRAVEL &amp; TOURISM</small></span>
    </div>
  );
}

export function CardFront({ name, code, tier = 'Silver', validUntil }) {
  const ref = useRef(null);
  const size = useCardFontSize(ref);
  return (
    <div ref={ref} className="bwc bwc-front" style={{ backgroundImage: `url(${frontArt})`, '--u': size ? `${size}px` : undefined }} role="img" aria-label={`Bright Wings ${tier} membership card for ${name}`}>
      <Brand />
      <small className="bwc-label bwc-l-name">MEMBER NAME</small>
      <div className="bwc-name">{name || '—'}</div>
      <small className="bwc-label bwc-l-code">MEMBERSHIP CODE</small>
      <div className="bwc-code">{formatMemberCode(code) || '—'}</div>
      <i className="bwc-rule" />
      <div className="bwc-tier">{String(tier).toUpperCase()} MEMBER</div>
      <small className="bwc-label bwc-l-valid">VALID THRU</small>
      <div className="bwc-valid">{formatValidThru(validUntil)}</div>
    </div>
  );
}

const BENEFITS = [
  [Plane, 'Earn Wings', 'on completed travel'],
  [Database, 'Redeem Wings', 'for travel benefits'],
  [Star, 'Enjoy member-only', 'experiences'],
];

export function CardBack({ code }) {
  const ref = useRef(null);
  const size = useCardFontSize(ref);
  const [qr, setQr] = useState('');
  useEffect(() => {
    if (!code) return;
    QRCode.toDataURL(`${window.location.origin}/card/${encodeURIComponent(code)}`, { margin: 0, width: 360, color: { dark: '#0b1830', light: '#ffffff' } }).then(setQr).catch(() => setQr(''));
  }, [code]);
  return (
    <div ref={ref} className="bwc bwc-back" style={{ backgroundImage: `url(${backArt})`, '--u': size ? `${size}px` : undefined }} role="img" aria-label="Bright Wings membership benefits and verification QR code">
      <Brand className="back" />
      <h3 className="bwc-heading">MEMBERSHIP BENEFITS</h3>
      {BENEFITS.map(([Icon, title, sub], i) => (
        <div key={title} className={`bwc-ben b${i}`}>
          <span><Icon size="100%" strokeWidth={1.35} /></span>
          <b>{title}</b>
          <small>{sub}</small>
        </div>
      ))}
      <i className="bwc-div d1" /><i className="bwc-div d2" />
      <div className="bwc-qr">{qr ? <img src={qr} alt="Membership QR code" /> : null}</div>
      <small className="bwc-scan">Scan to verify membership</small>
      <i className="bwc-dash" />
      <p className="bwc-help">For assistance, visit your Bright Wings account.</p>
    </div>
  );
}

/** Both faces, stacked. Pass a ref to capture them as one image. */
export const MembershipCardPair = React.forwardRef(function MembershipCardPair({ name, code, tier, validUntil }, ref) {
  return (
    <div ref={ref} className="bwc-pair">
      <CardFront name={name} code={code} tier={tier} validUntil={validUntil} />
      <CardBack code={code} />
    </div>
  );
});

/** Saves the card(s) inside `node` as a PNG, rendered by the browser itself so it matches the screen. */
export async function downloadCardImage(node, filename) {
  if (document.fonts?.ready) await document.fonts.ready;
  node.classList.add('bwc-capture'); // drops the on-screen drop shadow, which would be clipped in the image
  let url;
  try { url = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: null }); } finally { node.classList.remove('bwc-capture'); }
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
