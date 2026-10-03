// Application Constants
export const APP_CONFIG = {
  name: 'Bright Wings Travel & Tourism',
  version: '1.0.0',
  supportEmail: 'support@brightwings.com',
  supportPhone: '+1-555-123-4567',
  website: 'https://www.brightwings.com'
};

// Membership Tiers and Token Requirements
export const MEMBERSHIP_TIERS = {
  BRONZE: {
    name: 'Bronze',
    minTokens: 0,
    maxTokens: 499,
    color: '#6b7280',
    benefits: ['Member Discounts', 'Email Support']
  },
  SILVER: {
    name: 'Silver',
    minTokens: 500,
    maxTokens: 1999,
    color: '#9ca3af',
    benefits: ['Priority Support', 'Member Discounts', '5% Bonus Wings']
  },
  GOLD: {
    name: 'Gold',
    minTokens: 2000,
    maxTokens: 4999,
    color: '#fbbf24',
    benefits: ['Priority Support', 'Exclusive Deals', 'Free Upgrades', '10% Bonus Wings']
  },
  PLATINUM: {
    name: 'Platinum',
    minTokens: 5000,
    maxTokens: Infinity,
    color: '#e5e7eb',
    benefits: ['Priority Support', 'Exclusive Deals', 'Free Upgrades', 'Lounge Access', '15% Bonus Wings']
  }
};

// Booking Types
export const BOOKING_TYPES = {
  FLIGHT: {
    id: 'flight',
    name: 'Flight',
    icon: 'fas fa-plane',
    color: '#3b82f6'
  },
  HOTEL: {
    id: 'hotel',
    name: 'Hotel',
    icon: 'fas fa-hotel',
    color: '#10b981'
  },
  TOUR: {
    id: 'tour',
    name: 'Tour Package',
    icon: 'fas fa-map-marked-alt',
    color: '#f59e0b'
  },
  VISA: {
    id: 'visa',
    name: 'Visa Service',
    icon: 'fas fa-passport',
    color: '#8b5cf6'
  }
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: {
    id: 'pending',
    name: 'Pending',
    color: '#f59e0b',
    description: 'Booking is being processed'
  },
  CONFIRMED: {
    id: 'confirmed',
    name: 'Confirmed',
    color: '#10b981',
    description: 'Booking is confirmed'
  },
  PROCESSING: {
    id: 'processing',
    name: 'Processing',
    color: '#3b82f6',
    description: 'Documents are being processed'
  },
  CANCELLED: {
    id: 'cancelled',
    name: 'Cancelled',
    color: '#ef4444',
    description: 'Booking has been cancelled'
  },
  COMPLETED: {
    id: 'completed',
    name: 'Completed',
    color: '#6b7280',
    description: 'Service has been completed'
  }
};

// Token Transaction Types
export const TOKEN_TRANSACTION_TYPES = {
  EARNED: {
    id: 'earned',
    name: 'Earned',
    icon: 'fas fa-plus',
    color: '#10b981'
  },
  REDEEMED: {
    id: 'redeemed',
    name: 'Redeemed',
    icon: 'fas fa-minus',
    color: '#ef4444'
  },
  BONUS: {
    id: 'bonus',
    name: 'Bonus',
    icon: 'fas fa-gift',
    color: '#f59e0b'
  },
  REFUND: {
    id: 'refund',
    name: 'Refund',
    icon: 'fas fa-undo',
    color: '#3b82f6'
  }
};

// Popular Destinations
export const POPULAR_DESTINATIONS = [
  {
    id: 'paris',
    name: 'Paris, France',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&h=300&fit=crop',
    startingPrice: 899,
    description: 'The City of Light awaits you'
  },
  {
    id: 'tokyo',
    name: 'Tokyo, Japan',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=300&fit=crop',
    startingPrice: 1299,
    description: 'Where tradition meets modernity'
  },
  {
    id: 'bali',
    name: 'Bali, Indonesia',
    country: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
    startingPrice: 799,
    description: 'Tropical paradise awaits'
  },
  {
    id: 'dubai',
    name: 'Dubai, UAE',
    country: 'United Arab Emirates',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop',
    startingPrice: 999,
    description: 'Luxury in the desert'
  },
  {
    id: 'london',
    name: 'London, UK',
    country: 'United Kingdom',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
    startingPrice: 749,
    description: 'Historic charm and modern culture'
  }
];

// Travel Services
export const TRAVEL_SERVICES = [
  {
    id: 'flights',
    name: 'Flight Bookings',
    icon: 'fas fa-plane',
    color: '#3b82f6',
    description: 'Find the best deals on domestic and international flights'
  },
  {
    id: 'hotels',
    name: 'Hotel Reservations',
    icon: 'fas fa-hotel',
    color: '#10b981',
    description: 'Book luxury hotels and cozy accommodations worldwide'
  },
  {
    id: 'tours',
    name: 'Tour Packages',
    icon: 'fas fa-map-marked-alt',
    color: '#f59e0b',
    description: 'Curated travel experiences and guided tour packages'
  },
  {
    id: 'visa',
    name: 'Visa Services',
    icon: 'fas fa-passport',
    color: '#8b5cf6',
    description: 'Hassle-free visa processing and documentation support'
  }
];

// Form Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\d{10}$/,
  PHONE_INTERNATIONAL: /^\+?[\d\s\-\(\)]{7,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  USER_ID: /^\d{5}$/,
  CARD_NUMBER: /^\d{11,16}$/
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  FULL: 'MMMM dd, yyyy',
  SHORT: 'MM/dd/yyyy',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\''
};

// Currency Settings
export const CURRENCY_CONFIG = {
  DEFAULT: 'USD',
  SYMBOL: '$',
  LOCALE: 'en-US',
  SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD']
};

// API Endpoints (for future use)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE: '/user/update',
    DELETE: '/user/delete'
  },
  BOOKINGS: {
    LIST: '/bookings',
    CREATE: '/bookings/create',
    UPDATE: '/bookings/update',
    DELETE: '/bookings/delete',
    DETAILS: '/bookings/:id'
  },
  ADMIN: {
    USERS: '/admin/users',
    BOOKINGS: '/admin/bookings',
    ANALYTICS: '/admin/analytics',
    TOKENS: '/admin/tokens'
  }
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  AUTH_TOKEN: 'authToken',
  REFRESH_TOKEN: 'refreshToken',
  PREFERENCES: 'userPreferences',
  CART: 'bookingCart',
  THEME: 'theme'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  AUTHENTICATION_FAILED: 'Authentication failed. Please login again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_FAILED: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  BOOKING_FAILED: 'Booking failed. Please try again.',
  PAYMENT_FAILED: 'Payment processing failed. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful! Welcome back.',
  REGISTRATION_SUCCESS: 'Registration successful! Please verify your email.',
  BOOKING_SUCCESS: 'Booking confirmed! You will receive a confirmation email.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  TOKEN_EARNED: 'Congratulations! You earned tokens.',
  PAYMENT_SUCCESS: 'Payment processed successfully.'
};

// Default User Preferences
export const DEFAULT_PREFERENCES = {
  currency: 'USD',
  language: 'en',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  privacy: {
    shareProfile: false,
    showOnlineStatus: true
  },
  booking: {
    defaultClass: 'economy',
    seatPreference: 'window',
    mealPreference: 'regular'
  }
};

// Feature Flags (for gradual rollout)
export const FEATURE_FLAGS = {
  GOOGLE_AUTH: true,
  SOCIAL_SHARING: true,
  OFFLINE_MODE: false,
  DARK_MODE: false,
  ADVANCED_ANALYTICS: false,
  MULTI_CURRENCY: false,
  CHAT_SUPPORT: false
};

// Application Routes
export const ROUTES = {
  HOME: '/',
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  BOOKINGS: '/bookings',
  PROFILE: '/profile',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_TOKENS: '/admin/tokens',
  BOOKING_DETAILS: '/bookings/:id',
  NOT_FOUND: '*'
};

// Export utility functions
export const formatCurrency = (amount, currency = CURRENCY_CONFIG.DEFAULT) => {
  return new Intl.NumberFormat(CURRENCY_CONFIG.LOCALE, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  // Simple date formatting - in production, use date-fns or similar
  return new Date(date).toLocaleDateString();
};

export const getMembershipTier = (tokens) => {
  if (tokens >= MEMBERSHIP_TIERS.PLATINUM.minTokens) return MEMBERSHIP_TIERS.PLATINUM;
  if (tokens >= MEMBERSHIP_TIERS.GOLD.minTokens) return MEMBERSHIP_TIERS.GOLD;
  if (tokens >= MEMBERSHIP_TIERS.SILVER.minTokens) return MEMBERSHIP_TIERS.SILVER;
  return MEMBERSHIP_TIERS.BRONZE;
};

export const getBookingTypeConfig = (type) => {
  return BOOKING_TYPES[type.toUpperCase()] || BOOKING_TYPES.FLIGHT;
};

export const getStatusConfig = (status) => {
  return BOOKING_STATUS[status.toUpperCase()] || BOOKING_STATUS.PENDING;
};