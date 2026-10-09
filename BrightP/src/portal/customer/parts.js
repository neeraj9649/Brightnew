import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ChevronRight, Crown, Gem, Medal, Star } from 'lucide-react';
import { fileUrl } from '../../services/storage';
import { Badge, fmtNum, IMG, WingsIcon } from '../ui';
import { PHOTO, SERVICE_PHOTO, photoFor } from '../photos';
import { bookingSubtitle, bookingTitle, serviceOf, statusMeta, TIERS } from '../booking';

export const TIER_ICON = { Silver: Medal, Gold: Crown, Platinum: Star, Titanium: Gem };
export const TierIcon = ({ tier, size = 18 }) => {
  const Ico = TIER_ICON[tier] || Medal;
  return <Ico size={size} />;
};

/** Photo thumbnail for a travel service, with its icon overlaid. */
export function ServiceArt({ type, size = 86, radius = 13, style, iconSize, photo }) {
  const s = serviceOf(type);
  const src = photo || SERVICE_PHOTO[type];
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: radius, flex: 'none', display: 'grid', placeItems: 'center', color: '#fff',
        background: src ? `linear-gradient(rgba(8,24,40,.14), rgba(8,24,40,.34)), url(${src}) center/cover` : `linear-gradient(135deg, ${s.tone[0]}, ${s.tone[1]})`, ...style,
      }}
    >
      <s.Icon size={iconSize || size * 0.38} strokeWidth={1.6} />
    </div>
  );
}

const rewardPhoto = (item) => {
  if (item?.image_file_id) return fileUrl(item.image_file_id);
  const text = `${item?.category || ''} ${item?.name || ''}`;
  if (/hotel|stay|resort/i.test(text)) return PHOTO.hotelroom;
  if (/flight|air ticket|voucher/i.test(text)) return PHOTO.wing;
  if (/transfer|airport|lounge|service/i.test(text)) return PHOTO.landing;
  if (/cruise/i.test(text)) return PHOTO.cruise;
  if (/ticket|experience|safari|activity/i.test(text)) return PHOTO.colosseum;
  if (/holiday|package/i.test(text)) return PHOTO.maldives;
  return PHOTO.santorini;
};
export const rewardImage = rewardPhoto;

export function RewardArt({ item, height = 120, style }) {
  return <div className="pt-art" style={{ height, backgroundImage: `url(${rewardPhoto(item)})`, ...style }} role="img" aria-label={item?.name || 'Reward'} />;
}

export function BookingCard({ booking, onClick, showId = true }) {
  const s = serviceOf(booking.type);
  const meta = statusMeta(booking.status);
  return (
    <button type="button" className="pt-item" onClick={onClick} style={{ alignItems: 'stretch', padding: 12 }}>
      <ServiceArt type={booking.type} size={92} photo={photoFor(booking.type, booking.destination, booking.to, booking.hotel, booking.region, booking.country, booking.destinations)} />
      <div className="pt-item-body" style={{ display: 'grid', alignContent: 'center', gap: 5 }}>
        <div className="pt-row between" style={{ gap: 8 }}>
          <Badge><s.Icon size={13} /> {s.label}</Badge>
          <Badge tone={meta.tone} dot>{meta.label}</Badge>
        </div>
        <div className="pt-item-title" style={{ fontSize: 15 }}>{bookingTitle(booking)}</div>
        <div className="pt-item-sub" style={{ marginTop: 0 }}>{bookingSubtitle(booking) || 'Dates to be confirmed'}</div>
        {showId && <div className="pt-tiny">Booking ID <strong style={{ color: 'var(--pt-navy)', marginLeft: 4 }}>{booking.id}</strong></div>}
      </div>
      <ChevronRight size={18} className="chev" style={{ alignSelf: 'center', color: 'var(--pt-faint)' }} />
    </button>
  );
}

/** Dark membership card with QR (Membership card screen & home). */
export function MemberCardFace({ name, code, tier = 'Silver', validUntil, qr = true, compact = false, memberLabel }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (!qr || !code) return;
    QRCode.toDataURL(`${window.location.origin}/card/${code}`, { margin: 1, width: 240 }).then(setSrc).catch(() => {});
  }, [code, qr]);

  if (compact) {
    // Dark navy "Gold Member" card used on the desktop home screen.
    return (
      <div className="bw-card-dark">
        <div className="bw-card-dark-top">
          <span className="pt-row" style={{ gap: 8 }}><WingsIcon size={26} color="#e0b25a" /><span className="pt-serif" style={{ fontSize: 19 }}>Bright Wings</span></span>
          <span className="bw-card-tier"><b>{tier.toUpperCase()}</b><small>{memberLabel || 'MEMBER'}</small></span>
        </div>
        <WingsIcon size={190} color="#c9963e" strokeWidth={0.9} />
        <div className="bw-card-dark-bottom"><div className="pt-serif" style={{ fontSize: 24, fontWeight: 600 }}>{name}</div><div className="bw-card-code">{code}</div></div>
      </div>
    );
  }

  return (
    <div className="pt-member-card" style={{ backgroundImage: IMG.palace, minHeight: 220 }}>
      <div className="pt-row between top">
        <span className="pt-brand" style={{ color: '#fff' }}><WingsIcon size={26} color="#e6b865" /><span className="pt-brand-name" style={{ fontSize: 18 }}>Bright Wings</span></span>
      </div>
      <div>
        <div className="pt-serif" style={{ fontSize: 24, fontWeight: 700 }}>{name}</div>
        <div className="pt-row between" style={{ alignItems: 'flex-end', marginTop: 14 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><div style={{ fontSize: 11, opacity: 0.75 }}>Member No.</div><strong style={{ fontSize: 18 }}>{code}</strong></div>
            {validUntil && <div><div style={{ fontSize: 11, opacity: 0.75 }}>Valid until</div><strong style={{ fontSize: 15 }}>{validUntil}</strong></div>}
          </div>
          <div style={{ display: 'grid', justifyItems: 'end', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f0c76e', fontWeight: 800, fontSize: 16 }}><TierIcon tier={tier} size={18} /> {tier}</span>
            {qr && <div style={{ background: '#fff', borderRadius: 10, padding: 6, width: 86, height: 86 }}>{src ? <img src={src} alt="Membership QR code" width="74" height="74" /> : null}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TierRail({ current = 'Silver' }) {
  const idx = Math.max(0, TIERS.findIndex(([name]) => name === current));
  return (
    <div className="pt-tier-rail">
      {TIERS.map(([name, threshold], i) => (
        <div key={name} className={`pt-tier-node ${i === idx ? 'current' : i < idx ? 'reached' : ''}`}>
          <span className="pt-tier-dot"><TierIcon tier={name} size={20} /></span>
          <span>{name}</span>
          <small>{fmtNum(threshold)} Wings</small>
        </div>
      ))}
    </div>
  );
}

