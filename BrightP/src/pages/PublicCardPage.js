import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import BrightLogo from '../assets/BrightLogo.png';

// Public QR verification is intentionally limited to identity, tier, code,
// and validity. Wings balances and booking data stay private to the member.
const PublicCardPage = () => {
  const { code } = useParams();
  const [state, setState] = useState({ loading: true, card: null, error: '' });

  useEffect(() => {
    let alive = true;
    api.get(`/cards/${encodeURIComponent(code)}`)
      .then((card) => alive && setState({ loading: false, card, error: '' }))
      .catch(() => alive && setState({ loading: false, card: null, error: 'This membership card could not be verified.' }));
    return () => { alive = false; };
  }, [code]);

  const { loading, card, error } = state;
  return <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #10243d, #1d4662)', display: 'grid', placeItems: 'center', padding: '32px 16px' }}>
    <main style={{ width: '100%', maxWidth: 430 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}><img src={BrightLogo} alt="Bright Wings" style={{ height: 42, width: 'auto' }} /><span style={{ color: '#f1d29d', fontWeight: 800, letterSpacing: '.08em', fontSize: 12 }}>MEMBERSHIP VERIFICATION</span></div>
      {loading ? <div style={{ color: '#fff', textAlign: 'center', padding: 40 }}>Verifying membership…</div> : error ? <div style={{ borderRadius: 18, padding: 28, background: '#fffdfa', color: '#9c4c42', textAlign: 'center' }}><i className="fas fa-id-card" style={{ fontSize: 34, marginBottom: 12 }} /><div>{error}</div></div> : <section style={{ borderRadius: 22, padding: 26, background: 'linear-gradient(135deg, #fffdfa, #f7f4ed)', boxShadow: '0 24px 70px rgba(0,0,0,.24)' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}><div><small style={{ color: '#6c7888', textTransform: 'uppercase', letterSpacing: '.13em', fontSize: 9 }}>Verified member</small><h1 style={{ margin: '8px 0 4px', color: '#10243d', fontSize: 25 }}>{card.name}</h1><span style={{ color: '#6c7888', fontSize: 12 }}>Bright Wings Travel &amp; Tourism</span></div><span style={{ background: '#f9ecd5', color: '#7e581f', borderRadius: 99, padding: '6px 10px', fontSize: 11, fontWeight: 800 }}>{card.membership_tier}</span></div><div style={{ borderTop: '1px solid #e8e6df', marginTop: 24, paddingTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div><small style={{ color: '#8a93a0', display: 'block', fontSize: 10 }}>MEMBERSHIP CODE</small><strong style={{ color: '#10243d', display: 'block', marginTop: 5, fontFamily: 'ui-monospace, monospace', letterSpacing: '.12em' }}>{card.membership_code}</strong></div><div><small style={{ color: '#8a93a0', display: 'block', fontSize: 10 }}>MEMBER SINCE</small><strong style={{ color: '#10243d', display: 'block', marginTop: 5 }}>{new Date(card.member_since).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</strong></div></div><div style={{ marginTop: 24, padding: '10px 12px', borderRadius: 11, background: '#eaf7ef', color: '#216b4d', fontSize: 11 }}><i className="fas fa-shield-heart" style={{ marginRight: 7 }} /> This card is valid for Bright Wings membership verification.</div></section>}
    </main>
  </div>;
};

export default PublicCardPage;
