import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ChevronRight, Crown, Gem, Medal, Star } from 'lucide-react';
import { fileUrl } from '../../services/storage';
import { Badge, bg, fmtNum, IMG, WingsIcon } from '../ui';
import { bookingSubtitle, bookingTitle, serviceOf, statusMeta, TIERS } from '../booking';

export const TIER_ICON = { Silver: Medal, Gold: Crown, Platinum: Star, Titanium: Gem };
export const TierIcon = ({ tier, size = 18 }) => {
  const Ico = TIER_ICON[tier] || Medal;
  return <Ico size={size} />;
};

/** Gradient + icon thumbnail for a travel service. */
export function ServiceArt({ type, size = 86, radius = 13, style, iconSize }) {
  const s = serviceOf(type);
  const photo = type === 'flight' ? IMG.coast : type === 'hotel' ? IMG.chairs : null;
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: radius, flex: 'none', display: 'grid', placeItems: 'center', color: '#fff',
        background: photo ? `linear-gradient(rgba(8,24,40,.12), rgba(8,24,40,.3)), ${bg(photo)} center/cover` : `linear-gradient(135deg, ${s.tone[0]}, ${s.tone[1]})`, ...style,
      }}
    >
      <s.Icon size={iconSize || size * 0.38} strokeWidth={1.6} />
    </div>
  );
}

export function RewardArt({ item, height = 120, style }) {
  const category = item?.category || '';
  const photo = item?.image_file_id
    ? `url(${fileUrl(item.image_file_id)})`
    : /hotel|stay/i.test(category) ? bg(IMG.chairs)
      : /travel|flight|air/i.test(category) ? bg(IMG.coast)
        : /experience|ticket/i.test(category) ? IMG.lake : IMG.palace;
  return <div className="pt-art" style={{ height, backgroundImage: photo, ...style }} role="img" aria-label={item?.name || 'Reward'} />;
}

export function BookingCard({ booking, onClick, showId = true }) {
  const s = serviceOf(booking.type);
  const meta = statusMeta(booking.status);
  return (
    <button type="button" className="pt-item" onClick={onClick} style={{ alignItems: 'stretch', padding: 12 }}>
      <ServiceArt type={booking.type} size={92} />
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
export function MemberCardFace({ name, code, tier = 'Silver', validUntil, qr = true }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (!qr || !code) return;
    QRCode.toDataURL(`${window.location.origin}/card/${code}`, { margin: 1, width: 240 }).then(setSrc).catch(() => {});
  }, [code, qr]);
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

