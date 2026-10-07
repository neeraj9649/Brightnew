import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../contexts/AuthContext';
import BrightLogo from '../../assets/BrightLogo.png'

// Rounded-rect path helper (ctx.roundRect isn't in every engine version).
const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};
const hexA = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
const loadImg = (src) =>
  new Promise((res) => {
    if (!src) return res(null);
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });

// Public card page the QR points to (scan -> live member/card info). Defaults
// to the portal domain so DOWNLOADED cards scan correctly off any device;
// override with REACT_APP_PORTAL_URL.
const PORTAL_BASE = (
  process.env.REACT_APP_PORTAL_URL || 'https://portal.brightwingstravel.com'
).replace(/\/$/, '');

const MembershipCard = ({ userData, compact = false }) => {
  const { userData: contextUserData } = useAuth();
  const user = userData || contextUserData;

  const [isFlipped, setIsFlipped] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [logoImg, setLogoImg] = useState(null);
  const frontRef = useRef(null);

  // Preload the logo so the canvas export can draw it synchronously.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoImg(img);
    img.src = BrightLogo;
  }, []);

  // The QR encodes the PUBLIC card page URL -> scanning opens live member/card
  // info. Generated locally as a data URL (renders offline, no canvas taint).
  const code = user?.membershipCode || '';
  const cardUrl = code ? `${PORTAL_BASE}/card/${encodeURIComponent(code)}` : '';
  useEffect(() => {
    if (!cardUrl) { setQrDataUrl(''); return; }
    QRCode.toDataURL(cardUrl, { width: 240, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [cardUrl]);

  // Draw BOTH card faces (front + back) hand-drawn onto one canvas, stacked,
  // and download as a single PNG. Hand-drawn (not DOM-rasterised) so it never
  // chokes on the card's web fonts / CSS vars / color-mix() gradients.
  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const W = 1000, FH = 630, GAP = 40, P = 60;
      const accent = getTierAccent(user.membershipTier);
      const qrImg = await loadImg(qrDataUrl);

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = FH * 2 + GAP;
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'alphabetic';

      // shared: dark rounded body + tier glow + logo/brand
      const body = (y0) => {
        ctx.fillStyle = '#14151c';
        roundRect(ctx, 0, y0, W, FH, 30); ctx.fill();
        const glow = ctx.createRadialGradient(W * 0.18, y0, 0, W * 0.18, y0, W * 0.7);
        glow.addColorStop(0, hexA(accent, 0.45));
        glow.addColorStop(1, 'rgba(20,21,28,0)');
        ctx.fillStyle = glow;
        roundRect(ctx, 0, y0, W, FH, 30); ctx.fill();
      };
      const brand = (y0) => {
        let x = P;
        if (logoImg) { ctx.drawImage(logoImg, P, y0 + 42, 56, 56); x = P + 68; }
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 32px Arial, sans-serif';
        ctx.fillText('Bright Wings', x, y0 + 84);
      };

      // ---------- FRONT ----------
      body(0); brand(0);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '600 20px Arial, sans-serif';
      ctx.fillText('BRIGHT WINGS ELITE CARD', W - P, 78);
      ctx.textAlign = 'left';
      ctx.fillStyle = accent;
      roundRect(ctx, P, 150, 96, 70, 12); ctx.fill();
      const number = code ? code.replace(/(.{4})/g, '$1 ').trim() : 'XXXX XXXX XXXX';
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 42px "Courier New", monospace';
      ctx.fillText(number, P, 330);
      const holder = (user.displayName || user.name || 'NAME').toUpperCase();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '500 16px Arial, sans-serif';
      ctx.fillText('CARD HOLDER', P, 450);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 26px Arial, sans-serif';
      ctx.fillText(holder, P, 482);
      const since = user.memberSince || user.joinedAt;
      const year = since ? new Date(since).getFullYear() : new Date().getFullYear();
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '500 16px Arial, sans-serif';
      ctx.fillText('MEMBER SINCE', W - P, 450);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 26px Arial, sans-serif';
      ctx.fillText(String(year), W - P, 482);
      ctx.textAlign = 'left';

      // ---------- BACK ----------
      const y0 = FH + GAP;
      body(y0); brand(y0);
      ctx.fillStyle = '#0c0d12';
      ctx.fillRect(0, y0 + 120, W, 56); // magnetic strip
      const rows = [
        ['MEMBERSHIP CODE', code || '—'],
        ['TIER', user.membershipTier || 'Bronze'],
        ['WINGS', String(user.tokens ?? 0)],
        ['VALID UNTIL', '12/29'],
      ];
      let ry = y0 + 250;
      rows.forEach(([k, v]) => {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '500 14px Arial, sans-serif';
        ctx.fillText(k, P, ry);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 22px Arial, sans-serif';
        ctx.fillText(v, P, ry + 26);
        ry += 72;
      });
      if (qrImg) {
        const qs = 200, qx = W - P - qs, qy = y0 + 215;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, qx - 12, qy - 12, qs + 24, qs + 24, 12); ctx.fill();
        ctx.drawImage(qrImg, qx, qy, qs, qs);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '500 15px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scan for member info', qx + qs / 2, qy + qs + 36);
        ctx.textAlign = 'left';
      }

      const link = document.createElement('a');
      link.download = `brightwings-card-${code || 'member'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Card download failed', err);
    } finally {
      setDownloading(false);
    }
  };

  if (!user) return null;

  const getTierAccent = (tier) => {
    switch (tier) {
      case 'Platinum': return '#cbd5e1';
      case 'Gold': return '#f5b942';
      case 'Silver': return '#b8c0cc';
      default: return '#cd7f32';
    }
  };

  // Shared glass-card face. Decorative gradients/animations are inline arbitrary
  // values; keyframes (float/holo-shift/shine) live in tailwind.config.js.
  const faceCls =
    "absolute w-full h-[90%] rounded-[var(--radius-lg)] [backface-visibility:hidden] [transition:transform_0.6s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden bg-[#14151c] [background-image:linear-gradient(160deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04)_60%)] backdrop-blur-[18px] border border-[rgba(255,255,255,0.25)] shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_40px_-10px_var(--tier-accent),inset_0_1px_0_rgba(255,255,255,0.3)]";
  const bgCls =
    "absolute inset-0 overflow-hidden [background:radial-gradient(circle_at_15%_0%,color-mix(in_srgb,var(--tier-accent)_55%,transparent),transparent_60%)]";
  const patternCls =
    "absolute inset-0 [background-image:radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.218)_1px,transparent_1px),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.172)_1px,transparent_1px),radial-gradient(circle_at_40%_40%,rgba(255,255,255,0.182)_1px,transparent_1px)] [background-size:30px_30px,40px_40px,20px_20px] animate-float";
  const logoCls = "flex items-center gap-[8px] font-[600]";

  return (
    <div
      data-mcard
      className={`relative text-white w-full mx-auto ${compact ? 'max-w-[320px]' : 'max-w-[400px]'}`}
      style={{ '--tier-accent': getTierAccent(user.membershipTier) }}
    >
      <div
        data-membership-card
        className="relative w-full h-[220px] min-[769px]:h-[250px] cursor-pointer [perspective:1000px] transition-transform duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:-translate-y-[2px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Side */}
        <div
          data-card-front
          ref={frontRef}
          className={`${faceCls} ${isFlipped ? '[transform:rotateY(-180deg)]' : '[transform:rotateY(0deg)]'}`}
        >
          <div className={bgCls}>
            <div className={patternCls}></div>
            <div
              data-card-shine
              className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] [background:linear-gradient(45deg,transparent_35%,rgba(255,255,255,0.22)_50%,transparent_65%)] animate-shine"
            ></div>
          </div>

          <div className="flex flex-col p-2 sm:p-4 sm:gap-1">
            <div className="">
              <div className={`${logoCls} text-[16px]`}>
                <div className='h-[2rem]'>
                  <img src={BrightLogo} alt='BrightLogo'className='h-full w-full'/>
                </div>
                <span>Bright Wings</span>
              </div>
              <div className="text-[12px] opacity-90 text-right leading-[1.2] uppercase tracking-[0.08em]">
                Bright Wings Elite Card
              </div>
            </div>

            <div className="w-[42px] h-[32px] mt-[4px] mb-[8px]">
              <div className="w-full h-full [background:linear-gradient(135deg,color-mix(in_srgb,var(--tier-accent)_70%,white_30%),var(--tier-accent))] [background-size:200%_200%] rounded-[var(--radius-sm)] relative shadow-[var(--shadow-sm)] overflow-hidden animate-holo-shift before:content-[''] before:absolute before:inset-[4px] before:[background:repeating-linear-gradient(90deg,rgba(0,0,0,0.25)_0,rgba(0,0,0,0.25)_2px,transparent_2px,transparent_6px)] before:rounded-[2px]"></div>
            </div>

            <div className="text-[16px] min-[769px]:text-[18px] font-[550] tracking-[0.12em] [font-family:var(--font-family-mono)] my-[8px] text-white [text-shadow:0_0_12px_color-mix(in_srgb,var(--tier-accent)_60%,transparent)]">
              {user.membershipCode?.replace(/(.{4})/g, '$1 ').trim() || 'XXXX XXXX XXXX XXXX'}
            </div>

            <div className="flex justify-between mb-2 sm:mb-0">
              <div className="flex flex-col">
                <div className="text-[11px] opacity-80 font-[500] tracking-[0.05em] mb-[4px]">CARD HOLDER</div>
                <div className="text-[14px] font-[550]">{user.displayName?.toUpperCase() || 'NAME'}</div>
              </div>
              <div className="flex flex-col">
                <div className="text-[11px] opacity-80 font-[500] tracking-[0.05em] mb-[4px]">MEMBER SINCE</div>
                <div className="text-[14px] font-[550]">
                  {(user.memberSince || user.joinedAt) ? new Date(user.memberSince || user.joinedAt).getFullYear() : new Date().getFullYear()}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div>
                <i className="fas fa-credit-card text-[20px] opacity-70"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div
          data-card-back
          className={`${faceCls} ${isFlipped ? '[transform:rotateY(0deg)]' : '[transform:rotateY(180deg)]'}`}
        >
          <div className={bgCls}>
            <div className={patternCls}></div>
          </div>

          <div className="flex flex-col p-2 gap-4">
            <div className="mb-[16px]">
              <div className={`${logoCls} text-[14px]`}>
                <div className='h-[2rem]'>
                  <img src={BrightLogo} alt='BrightLogo'className='h-full w-full'/>
                </div>
                <span>Bright Wings</span>
              </div>
            </div>

            <div className="h-[30px] [background:linear-gradient(90deg,var(--color-charcoal-700),var(--color-charcoal-800),var(--color-charcoal-700))] mb-[16px] rounded-[2px]"></div>

            <div className="grid grid-cols-2 text-sm gap-3">
              <div className="grid grid-cols-2">
                <span className="opacity-80">User ID:</span>
                <span className="font-[550] [font-family:var(--font-family-mono)]">{user.userId || 'XXXXX'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="opacity-80">Wings:</span>
                <span className="font-[550] [font-family:var(--font-family-mono)]">{user.tokens || 0}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="opacity-80">Valid Until:</span>
                <span className="font-[550] [font-family:var(--font-family-mono)]">12/29</span>
              </div>
            </div>

            <div className="py-2">
              {qrDataUrl && <img className="w-[60px] h-[60px] rounded-[var(--radius-sm)] bg-[var(--color-surface)] p-[4px]" src={qrDataUrl} alt="QR Code" />}
              <p className="text-[11px] opacity-80">Scan for member info</p>
            </div>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="grid mt-[24px] gap-[16px] min-[481px]:mt-[32px] min-[481px]:gap-[24px]">
          <div className="flex items-center bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-[16px] gap-[12px] min-[481px]:p-[24px] min-[481px]:gap-[16px]">
            <div className="flex items-center justify-center rounded-full [background:linear-gradient(135deg,var(--color-orange-400),var(--color-orange-500))] text-[var(--color-surface)] w-[40px] h-[40px] text-[18px] min-[481px]:w-[50px] min-[481px]:h-[50px] min-[481px]:text-[20px]">
              <i className="fas fa-coins"></i>
            </div>
            <div>
              <h3 className="text-[color:var(--color-text)] font-[600] mb-[4px] text-[18px] min-[481px]:text-[20px]">{user.tokens || 0} Wings</h3>
              <p className="text-[color:var(--color-text-secondary)] m-0 text-[12px] min-[481px]:text-[14px]">Available Balance</p>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-[var(--color-border)] p-[16px] min-[481px]:p-[24px]">
            <div className="flex justify-between items-center mb-[16px]">
              <span className="text-[color:var(--color-text)] font-[500] text-[14px]">Next Tier Progress</span>
              <span className="text-[color:var(--color-primary)] font-[550] text-[14px]">{user.membershipTier || 'Bronze'}</span>
            </div>
            <div className="h-[8px] bg-[var(--color-secondary)] rounded-[var(--radius-sm)] overflow-hidden mb-[12px]">
              <div
                className="h-full [background:linear-gradient(90deg,var(--color-primary),var(--color-primary-hover))] rounded-[var(--radius-sm)] [transition:width_250ms_cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  width: user.membershipTier === 'Platinum' ? '100%' :
                         user.membershipTier === 'Gold' ? '75%' :
                         user.membershipTier === 'Silver' ? '50%' : '25%'
                }}
              ></div>
            </div>
            <div className="flex justify-between text-[12px] text-[color:var(--color-text-secondary)]">
              <span>Bronze</span>
              <span>Silver</span>
              <span>Gold</span>
              <span>Platinum</span>
            </div>
          </div>

          <div className="flex justify-center max-[768px]:flex-col min-[769px]:flex-row gap-[12px] min-[481px]:gap-[16px]">
            <button
              className="btn btn--outline btn--sm"
              onClick={handleDownload}
              disabled={downloading}
            >
              <i className="fas fa-download"></i>
              {downloading ? 'Preparing…' : 'Download Card'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipCard;
