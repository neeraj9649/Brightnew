import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import BrightLogo from '../../assets/BrightLogo.png'
import NotificationBell from './NotificationBell';

// ponytail: Navbar.css migrated to Tailwind utilities. Desktop pixel-faithful;
// max-md:/max-sm: reproduce the original's hide-on-mobile rules.
const navLink = (active) =>
  `flex cursor-pointer items-center gap-[8px] rounded-[8px] border-none py-[12px] px-[16px] text-[12px] font-medium transition-all duration-150 ${
    active
      ? 'bg-[var(--color-primary)] text-[var(--color-btn-primary-text)]'
      : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]'
  }`;
const ddBtn =
  'flex w-full cursor-pointer items-center gap-[12px] rounded-[8px] border-none bg-transparent p-[12px] text-left text-[12px] text-[var(--color-text)] transition-all duration-150 hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]';
const ddBtnLogout =
  'flex w-full cursor-pointer items-center gap-[12px] rounded-[8px] border-none bg-transparent p-[12px] text-left text-[12px] text-[var(--color-text)] transition-all duration-150 hover:bg-[rgba(var(--color-error-rgb),0.1)] hover:text-[var(--color-error)]';
const mNavLink = (active, logout) =>
  `flex w-full cursor-pointer items-center gap-[12px] rounded-[8px] border-none p-[16px] text-left font-medium transition-all duration-150 ${
    active
      ? 'bg-[var(--color-primary)] text-[var(--color-btn-primary-text)]'
      : logout
      ? 'bg-transparent text-[var(--color-text)] hover:bg-[rgba(var(--color-error-rgb),0.1)] hover:text-[var(--color-error)]'
      : 'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)]'
  }`;
const ddDivider = 'my-[8px] h-px bg-[var(--color-border)]';

const Navbar = () => {
  const { currentUser, userData, logout, isAdmin, isStaff } = useAuth();
  // A pure employee (staff, not admin) has no customer dashboard -- their
  // "Dashboard" is the staff view at /admin.
  const isEmployee = isStaff && !isAdmin;
  const navigate = useNavigate();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigationItems = [
    {
      path: isEmployee ? '/admin' : '/dashboard',
      label: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
    },
    { path: '/bookings', label: 'Bookings', icon: 'fas fa-calendar-alt' },
    ...(isEmployee
      ? []
      : [{ path: '/rewards', label: 'Rewards', icon: 'fas fa-gift' }]),
    { path: '/profile', label: 'Profile', icon: 'fas fa-user' },
  ];

  if (isAdmin) {
    navigationItems.push({ path: '/admin', label: 'Admin', icon: 'fas fa-cog' });
  }

  return (
    <nav className="sticky top-0 left-0 right-0 z-[1000] h-[70px] border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-[16px] max-sm:px-[12px]">
        {/* Brand/Logo */}
        <div
          className="flex cursor-pointer items-center gap-[12px] text-[20px] font-semibold text-[var(--color-primary)] transition-all duration-150 hover:text-[var(--color-primary-hover)] max-sm:gap-[8px] max-sm:text-[18px]"
          onClick={() => navigate('/dashboard')}
        >
          <div className='h-[3rem] sm:h-[5rem]'>
            <img src={BrightLogo} alt='BrightLogo' className='h-full w-full ' />
          </div>

          <span className="max-sm:hidden">Bright Wings</span>
        </div>

        {/* Desktop Navigation */}
        <div className="flex gap-[8px] max-md:hidden">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              className={navLink(location.pathname === item.path)}
              onClick={() => navigate(item.path)}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-[16px] max-sm:gap-[8px]">
          {/* Notifications */}
          <NotificationBell />

          {/* Tokens Display */}
          <div className="flex items-center gap-[8px] rounded-full border border-[#f59e0b] bg-[linear-gradient(135deg,var(--color-bg-2),#f59e0b)] py-[8px] px-[16px] text-[12px] font-semibold text-[#b45309] max-md:hidden">
            <i className="fas fa-coins text-[#b45309]"></i>
            <span>{userData?.tokens || 0}</span>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              className="flex cursor-pointer items-center gap-[12px] rounded-[8px] border-none bg-transparent p-[8px] transition-all duration-150 hover:bg-[var(--color-secondary)]"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <img
                src={userData?.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'}
                alt="Profile"
                className="h-[40px] w-[40px] rounded-full border-2 border-[var(--color-border)] object-cover max-sm:h-[32px] max-sm:w-[32px]"
              />
              <div className="px-5 flex flex-col items-center">
                <span className="text-[12px] font-semibold text-[var(--color-text)]">{userData?.name || 'User'}</span>
                <span className="text-[11px] text-[var(--color-text-secondary)]">{userData?.membershipTier || 'Bronze'}</span>
              </div>
              <i className={`fas fa-chevron-${isUserMenuOpen ? 'up' : 'down'}`}></i>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[280px] rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] max-sm:right-[8px] max-sm:min-w-[250px]">
                <div className="flex items-center gap-[16px] p-[16px]">
                  <img
                    src={userData?.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'}
                    alt="Profile"
                    className="h-[50px] w-[50px] rounded-full object-cover"
                  />
                  <div>
                    <h4 className="mb-[4px] font-semibold text-[var(--color-text)]">{userData?.name}</h4>
                    <p className="mb-[8px] text-[12px] text-[var(--color-text-secondary)]">{userData?.email}</p>
                    <span className="text-sm text-zinc-400">{userData?.membershipTier} Member</span>
                  </div>
                </div>

                <div className={ddDivider}></div>

                <div className="p-[8px]">
                  <button className={ddBtn} onClick={() => navigate('/profile')}>
                    <i className="fas fa-user"></i>
                    My Profile
                  </button>
                  <button className={ddBtn} onClick={() => navigate('/bookings')}>
                    <i className="fas fa-calendar-alt"></i>
                    My Bookings
                  </button>
                  <button className={ddBtn} onClick={() => navigate('/profile')}>
                    <i className="fas fa-id-card"></i>
                    Membership Card
                  </button>
                  <button className={ddBtn} onClick={() => navigate('/profile')}>
                    <i className="fas fa-cog"></i>
                    Settings
                  </button>

                  {isAdmin && (
                    <>
                      <div className={ddDivider}></div>
                      <button className={ddBtn} onClick={() => navigate('/admin')}>
                        <i className="fas fa-shield-alt"></i>
                        Admin Panel
                      </button>
                    </>
                  )}

                  <div className={ddDivider}></div>

                  <button className={ddBtn} onClick={() => {}}>
                    <i className="fas fa-question-circle"></i>
                    Help & Support
                  </button>
                  <button onClick={handleLogout} className={ddBtnLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="hidden cursor-pointer border-none bg-transparent p-[8px] text-[20px] text-[var(--color-text-secondary)]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <i className={`fas fa-${isMobileMenuOpen ? 'times' : 'bars'}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 hidden border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)] max-md:block">
          <div className="flex items-center gap-[16px] border-b border-[var(--color-border)] p-[16px] max-sm:gap-[12px] max-sm:p-[12px]">
            <img
              src={userData?.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'}
              alt="Profile"
              className="h-[60px] w-[60px] rounded-full object-cover max-sm:h-[48px] max-sm:w-[48px]"
            />
            <div>
              <h4 className="mb-[4px] font-semibold text-[var(--color-text)]">{userData?.name}</h4>
              <p className="mb-[8px] text-[12px] text-[var(--color-text-secondary)]">{userData?.membershipTier} Member</p>
              <div className="flex items-center gap-[4px] text-[12px] font-medium text-[var(--color-warning)]">
                <i className="fas fa-coins"></i>
                {userData?.tokens || 0} Tokens
              </div>
            </div>
          </div>

          <div className="p-[8px]">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                className={mNavLink(location.pathname === item.path, false)}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </button>
            ))}

            <div className={ddDivider}></div>

            <button
              className={mNavLink(false, false)}
              onClick={() => {
                navigate('/profile');
                setIsMobileMenuOpen(false);
              }}
            >
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </button>

            <button
              className={mNavLink(false, true)}
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.3)]"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
