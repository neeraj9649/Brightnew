import React from 'react';
import { ChevronRight, Crown, Gem, Medal, Star, Users } from 'lucide-react';
import { fileUrl } from '../../services/storage';
import { Badge, VoucherTag, fmtNum } from '../ui';
import { CardFront, FlippableCard } from '../MembershipCard';
import { PHOTO, SERVICE_PHOTO, photoFor } from '../photos';
import { bookingSubtitle, bookingTitle, serviceOf, statusMeta, TIERS } from '../booking';

export const TIER_ICON = { Member: Users, Silver: Medal, Gold: Crown, Platinum: Star, Titanium: Gem };
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
        <div className="pt-row between" style={{ gap: 6, flexWrap: 'wrap' }}>
          <Badge><s.Icon size={13} /> {s.label}</Badge>
          <Badge tone={meta.tone} dot>{meta.label}</Badge>
        </div>
        <div className="pt-item-title" style={{ fontSize: 15 }}>{bookingTitle(booking)}</div>
        <div className="pt-item-sub" style={{ marginTop: 0 }}>{bookingSubtitle(booking) || 'Dates to be confirmed'}</div>
        {booking.voucherBooking && <div><VoucherTag /></div>}
        {showId && <div className="pt-tiny">Booking ID <strong style={{ color: 'var(--pt-navy)', marginLeft: 4 }}>{booking.id}</strong></div>}
      </div>
      <ChevronRight size={18} className="chev" style={{ alignSelf: 'center', color: 'var(--pt-faint)' }} />
    </button>
  );
}

/** Dark membership card with QR (Membership card screen & home). */
/** The membership card front (see MembershipCard.js). `validUntil` is the card's ISO date from the API. */
/** The card with a flip button (Home page). */
export function FlippableMemberCard({ name, code, tier = 'Member', validUntil, onOpen }) {
  return <FlippableCard name={name} code={code} tier={tier} validUntil={validUntil} onOpen={onOpen} />;
}

export function MemberCardFace({ name, code, tier = 'Member', validUntil }) {
  return <CardFront name={name} code={code} tier={tier} validUntil={validUntil} />;
}

export function TierRail({ current = 'Member' }) {
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

