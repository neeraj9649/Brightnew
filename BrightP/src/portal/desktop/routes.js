import React from 'react';
import { useWide } from '../ui';
import { MobileHome } from '../customer/Home';
import DeskHome from './Home';
import DeskBookings from './Bookings';
import MobileBookings from '../customer/Bookings';
import { DeskServiceSelect, DeskWizard } from './Plan';
import { ServiceSelect as MobileServiceSelect, BookingWizard as MobileWizard } from '../customer/BookingNew';
import { useParams } from 'react-router-dom';
import DeskBookingDetail from './BookingDetail';
import DeskAccount from './Account';
import DeskRefer from './Refer';
import { Referrals as MobileReferrals } from '../customer/Member';
import { Account as MobileAccount } from '../customer/Member';
import { Navigate } from 'react-router-dom';
import { DeskWings, DeskRewardDetail } from './Wings';
import { Wallet as MobileWallet, Catalog as MobileCatalog, RewardDetail as MobileRewardDetail } from '../customer/Rewards';
import { MobileBookingDetail } from '../customer/BookingDetail';

// Each customer route renders its phone layout below 900px and its desktop /
// tablet layout from 900px up. Both are real screens on the same data.
export const HomeRoute = () => (useWide() ? <DeskHome /> : <MobileHome />);
export const BookingsRoute = () => (useWide() ? <DeskBookings /> : <MobileBookings />);
export const ServiceSelectRoute = () => (useWide() ? <DeskServiceSelect /> : <MobileServiceSelect />);
export const WizardRoute = () => {
  const { service } = useParams();
  return useWide() ? <DeskWizard key={service} /> : <MobileWizard key={service} />;
};
export const BookingDetailRoute = () => (useWide() ? <DeskBookingDetail /> : <MobileBookingDetail />);
export const WalletRoute = () => (useWide() ? <DeskWings /> : <MobileWallet />);
export const CatalogRoute = () => (useWide() ? <DeskWings initialTab="rewards" showAllRewards /> : <MobileCatalog />);
export const RewardDetailRoute = () => (useWide() ? <DeskRewardDetail /> : <MobileRewardDetail />);
export const AccountRoute = () => (useWide() ? <DeskAccount /> : <MobileAccount />);
/** Pages folded into the desktop Account screen redirect there on wide screens. */
export const ToAccountOnDesktop = ({ children }) => (useWide() ? <Navigate to="/account" replace /> : children);
export const ReferRoute = () => (useWide() ? <DeskRefer /> : <MobileReferrals />);
