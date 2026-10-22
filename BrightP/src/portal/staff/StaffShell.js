import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeCheck, ChartNoAxesColumn, CalendarDays, ClipboardList, Gift, House, LayoutDashboard, LogOut, Menu, MessageCircleMore, Settings, ShieldCheck, Star, Tag, UserCog, Users, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, BrightLogo, memberName } from '../ui';

// [key, label, path, icon] entries, with ['group', label] headings between them.
const ADMIN_NAV = [
  ['group', 'Workspace'],
  ['overview', 'Overview', '/admin', LayoutDashboard], ['bookings', 'Bookings', '/admin/bookings', CalendarDays], ['customers', 'Customers', '/admin/customers', Users], ['crm', 'CRM & follow-ups', '/admin/crm', MessageCircleMore],
  ['group', 'Loyalty & rewards'],
  ['rewards', 'Rewards', '/admin/rewards', Gift], ['redemptions', 'Redemptions', '/admin/redemptions', ShieldCheck], ['approvals', 'Wings approvals', '/admin/wings-approvals', BadgeCheck], ['offers', 'Offers', '/admin/offers', Tag], ['loyalty', 'Loyalty settings', '/admin/loyalty', Settings],
  ['group', 'Insights & team'],
  ['analytics', 'Analytics', '/admin/analytics', ChartNoAxesColumn], ['employees', 'Employees & permissions', '/admin/employees', UserCog],
];
const EMPLOYEE_NAV = [
  ['group', 'Workspace'],
  ['overview', 'Overview', '/admin', House], ['bookings', 'Bookings', '/admin/bookings', CalendarDays], ['customers', 'My customers', '/admin/customers', Users], ['crm', 'CRM & follow-ups', '/admin/crm', ClipboardList],
  ['group', 'Rewards & offers'],
  ['redemptions', 'Rewards', '/admin/redemptions', Star], ['offers', 'Offers', '/admin/offers', Tag],
];

/** Dark-sidebar workspace shell for employees and admins. */
export default function StaffShell({ active, title, sub, actions, children, wide = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isAdmin, isSuperAdmin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = isAdmin ? ADMIN_NAV : EMPLOYEE_NAV;
  const links = nav.filter(([key]) => key !== 'group');
  const current = active || links.find(([, , path]) => (path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)))?.[0];

  const items = (onPick) => nav.map(([key, label, path, Icon]) => (key === 'group'
    ? <div key={`g-${label}`} className="st-group">{label}</div>
    : <button key={key} type="button" className={current === key ? 'active' : ''} onClick={() => { onPick?.(); navigate(path); }}><Icon size={19} /> {label}</button>
  ));
  const portalName = isAdmin ? 'Admin portal' : 'Staff portal';
  const signOut = async () => { await logout().catch(() => {}); navigate('/auth', { replace: true }); };

  return (
    <div className="pt-app st-app">
      <aside className="st-side">
        <button type="button" className="brand" onClick={() => navigate('/admin')}>
          <img src={BrightLogo} alt="" />
          <span><b>Bright Wings</b><small>{portalName}</small></span>
        </button>
        <nav>{items()}</nav>
        <div className="me">
          <Avatar user={userData} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}><b style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{memberName(userData)}</b><small className={`st-role ${isAdmin ? 'admin' : ''}`}>{isSuperAdmin ? 'Super admin' : isAdmin ? 'Administrator' : 'Staff'}</small></div>
          <button type="button" aria-label="Sign out" onClick={signOut} style={{ background: 'none', border: 0, color: 'rgba(255,255,255,.7)', cursor: 'pointer' }}><LogOut size={18} /></button>
        </div>
      </aside>

      <div className="st-main">
        <div className="st-mobilebar">
          <button type="button" aria-label="Menu" onClick={() => setOpen(true)} style={{ background: 'none', border: 0 }}><Menu size={22} /></button>
          <span className="pt-row" style={{ gap: 10 }}><img src={BrightLogo} alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} /><span className="pt-brand-name" style={{ color: '#fff', fontSize: 18 }}>Bright Wings</span></span>
          <Avatar user={userData} size="sm" />
        </div>
        {open && (
          <div className="pt-overlay side" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="pt-drawer" style={{ background: 'linear-gradient(180deg, #0b2340, #11365e)', color: '#fff', maxWidth: 300, marginLeft: 0, marginRight: 'auto' }}>
              <div className="pt-row between" style={{ marginBottom: 14 }}><span className="pt-row" style={{ gap: 10 }}><img src={BrightLogo} alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} /><span className="pt-brand-name" style={{ color: '#fff' }}>Bright Wings · {portalName}</span></span><button type="button" onClick={() => setOpen(false)} aria-label="Close menu" style={{ background: 'none', border: 0, color: '#fff' }}><X size={22} /></button></div>
              <nav className="st-drawer-nav" style={{ display: 'grid', gap: 4 }}>{items(() => setOpen(false)).map((el, i) => (el.type === 'div' ? React.cloneElement(el, { style: { padding: i ? '18px 14px 6px' : '4px 14px 6px', marginTop: i ? 4 : 0, font: '700 10.5px sans-serif', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', borderTop: i ? '1px solid rgba(255,255,255,.1)' : 0 } }) : React.cloneElement(el, { style: { display: 'flex', alignItems: 'center', gap: 12, height: 46, padding: '0 14px', borderRadius: 11, border: 0, background: el.props.className === 'active' ? 'rgba(201,150,62,.28)' : 'transparent', color: '#fff', font: '600 14px sans-serif', cursor: 'pointer', textAlign: 'left' } })))}</nav>
              <button type="button" onClick={signOut} style={{ marginTop: 20, display: 'flex', gap: 10, background: 'none', border: 0, color: 'rgba(255,255,255,.75)', cursor: 'pointer' }}><LogOut size={18} /> Sign out</button>
            </div>
          </div>
        )}
        <div className="st-content" style={wide ? undefined : { maxWidth: 1000 }}>
          {(title || actions) && (
            <div className="st-head">
              <div>{title && <h1>{title}</h1>}{sub && <p className="pt-sub" style={{ marginTop: 5 }}>{sub}</p>}</div>
              {actions && <div className="pt-row wrap">{actions}</div>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

