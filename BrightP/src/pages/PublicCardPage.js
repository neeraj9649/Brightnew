import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import MembershipCard from '../components/Profile/MembershipCard';
import BrightLogo from '../assets/BrightLogo.png';

// Public page the card QR points to. No auth -- anyone scanning a card lands
// here and sees the member's live card info.
const PublicCardPage = () => {
  const { code } = useParams();
  const [state, setState] = useState({ loading: true, card: null, error: '' });

  useEffect(() => {
    let alive = true;
    api
      .get(`/cards/${encodeURIComponent(code)}`)
      .then((card) => alive && setState({ loading: false, card, error: '' }))
      .catch(() => alive && setState({ loading: false, card: null, error: 'Card not found' }));
    return () => {
      alive = false;
    };
  }, [code]);

  const { loading, card, error } = state;
  const userData = card && {
    displayName: card.name,
    name: card.name,
    membershipCode: card.membership_code,
    membershipTier: card.membership_tier,
    tokens: card.tokens,
    memberSince: card.member_since,
    userId: card.membership_code,
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0f1117, #1f2433)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2.5rem 1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <img src={BrightLogo} alt="Bright Wings" style={{ height: 46 }} />
        <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: 24 }}>Bright Wings</span>
      </div>

      {loading ? (
        <p style={{ color: '#cbd5e1' }}>Loading card…</p>
      ) : error ? (
        <div style={{ color: '#fca5a5', textAlign: 'center' }}>
          <i className="fas fa-id-card" style={{ fontSize: 36, opacity: 0.6 }} />
          <p style={{ marginTop: 12 }}>{error}</p>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 420 }}>
          <MembershipCard userData={userData} />
        </div>
      )}
    </div>
  );
};

export default PublicCardPage;
