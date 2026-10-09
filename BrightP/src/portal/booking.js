import {
  Binoculars, Building2, CarFront, CarTaxiFront, Compass, IdCard, Map as MapIcon, Plane, Ship, ShieldCheck, Ticket,
} from 'lucide-react';
import { fmtDate, humanize } from './ui';

const INR_BUDGETS = ['Under ₹5,000', '₹5,000 – 10,000', '₹10,000 – 20,000', '₹20,000 – 40,000', '₹40,000+'];

export const CITIES = [
  'Delhi (DEL)', 'Mumbai (BOM)', 'Bengaluru (BLR)', 'Chennai (MAA)', 'Kolkata (CCU)', 'Hyderabad (HYD)', 'Jaipur (JAI)',
  'Udaipur (UDR)', 'Goa (GOI)', 'Kochi (COK)', 'Ahmedabad (AMD)', 'Pune (PNQ)', 'Srinagar (SXR)', 'Leh (IXL)', 'Dubai (DXB)',
  'Singapore (SIN)', 'Bangkok (BKK)', 'London (LHR)',
];

/**
 * Service catalogue. `fields` rows render in order; an inner array is a
 * two-column row. Keys deliberately match the legacy booking `details` shape so
 * existing bookings and staff tooling keep working.
 */
export const SERVICES = {
  flight: {
    desc: 'International and domestic flights, with the best options for your journey.',
    label: 'Flight', title: 'Flight request', Icon: Plane, tone: ['#3b7bb8', '#8fc3ea'],
    blurb: 'Request a quote. Price confirmed by your travel advisor.',
    heroTitle: <>New places<br />brighter stories</>,
    earnLabel: 'after the trip is completed',
    fields: [
      { key: 'tripType', type: 'seg', options: [['oneway', 'One way'], ['roundtrip', 'Return']], def: 'roundtrip' },
      { key: 'route', type: 'route' },
      [{ key: 'departureDate', label: 'Departure date', type: 'date', required: true }, { key: 'returnDate', label: 'Return date', type: 'date', showIf: (d) => d.tripType !== 'oneway', required: true }],
      [{ key: 'passengers', label: 'Travellers', type: 'counter', min: 1, max: 9, def: 1, suffix: (n) => (n === 1 ? ' adult' : ' adults') }, { key: 'class', label: 'Cabin class', type: 'select', options: [['economy', 'Economy'], ['premium_economy', 'Premium economy'], ['business', 'Business'], ['first', 'First']], def: 'economy' }],
      { key: 'flexibleDates', type: 'check', label: 'Flexible dates', hint: 'Show options within ± 3 days' },
    ],
    title_of: (d) => `${d.from || 'Departure'} → ${d.to || 'Destination'}`,
    date_of: (d) => d.departureDate,
    people_of: (d) => d.passengers,
    summary: (d) => [
      ['Route', `${d.from || '—'} → ${d.to || '—'}`], ['Trip type', d.tripType === 'oneway' ? 'One way' : 'Return'],
      ['Departure', fmtDate(d.departureDate)], d.tripType !== 'oneway' && ['Return', fmtDate(d.returnDate)],
      ['Travellers', d.passengers], ['Cabin', humanize(d.class || 'economy')], d.flexibleDates && ['Dates', 'Flexible (± 3 days)'],
    ].filter(Boolean),
  },
  hotel: {
    desc: 'Choose from handpicked hotels around the world.',
    label: 'Hotel', title: 'Hotel request', Icon: Building2, tone: ['#b7792e', '#f0c98a'],
    blurb: 'Request a quote. Price confirmed by your travel advisor.',
    heroTitle: <>Stays that<br />feel like you</>,
    earnLabel: 'after the stay is completed',
    fields: [
      { key: 'destination', label: 'Location', type: 'city', placeholder: 'Goa, India', required: true },
      [{ key: 'checkIn', label: 'Check-in date', type: 'date', required: true }, { key: 'checkOut', label: 'Check-out date', type: 'date', required: true }],
      [{ key: 'rooms', label: 'Rooms', type: 'select', options: [1, 2, 3, 4].map((n) => [n, `${n} room${n > 1 ? 's' : ''}`]), def: 1, num: true }, { key: 'guests', label: 'Guests per room', type: 'select', options: [1, 2, 3, 4].map((n) => [n, `${n} guest${n > 1 ? 's' : ''}`]), def: 2, num: true }],
      { key: 'budget', label: 'Budget per night (INR)', type: 'select', options: INR_BUDGETS.map((b) => [b, b]), def: '₹10,000 – 20,000' },
      { key: 'starRating', label: 'Star preference', type: 'select', options: [['any', 'Any'], ['3', '3 star'], ['4', '4 star'], ['5', '5 star']], def: '4' },
      { key: 'specialRequests', label: 'Special requests', type: 'textarea', optional: true, max: 500, placeholder: 'Beachfront property, early check-in if possible.' },
    ],
    title_of: (d) => d.destination || 'Hotel stay',
    date_of: (d) => d.checkIn,
    people_of: (d) => (d.guests || 1) * (d.rooms || 1),
    summary: (d) => [
      ['Location', d.destination], ['Check-in', fmtDate(d.checkIn)], ['Check-out', fmtDate(d.checkOut)],
      ['Rooms / guests', `${d.rooms || 1} room(s), ${d.guests || 1} guest(s) each`], ['Budget per night', d.budget], ['Star preference', d.starRating === 'any' ? 'Any' : `${d.starRating} star`],
    ],
  },
  car_rental: {
    desc: 'Get the right vehicle for your journey.',
    label: 'Car rental', title: 'Car rental request', Icon: CarFront, tone: ['#2f6f8f', '#9ad0e6'],
    blurb: 'Share your trip and we will arrange the right vehicle.',
    heroTitle: <>Explore at your own pace<br /><span style={{ font: '500 14px sans-serif' }}>Cars for every journey</span></>,
    earnLabel: 'after the car rental is completed',
    fields: [
      [{ key: 'pickupCity', label: 'Pickup city', type: 'city', placeholder: 'Delhi', required: true }, { key: 'dropoffCity', label: 'Drop-off city', type: 'city', placeholder: 'Delhi', required: true }],
      [{ key: 'pickupAt', label: 'Pickup date & time', type: 'datetime', required: true }, { key: 'dropoffAt', label: 'Drop-off date & time', type: 'datetime', required: true }],
      { key: 'rentalType', label: 'Rental type', type: 'seg', options: [['Self-drive', 'Self-drive'], ['With driver', 'With driver']], def: 'Self-drive' },
      { key: 'vehicleType', label: 'Vehicle type', type: 'select', options: ['Hatchback', 'Sedan', 'SUV', 'MUV / Van', 'Luxury'].map((v) => [v, v]), def: 'SUV' },
      { key: 'passengers', label: 'Number of passengers', type: 'counter', min: 1, max: 12, def: 2 },
      { key: 'specialRequests', label: 'Special requests or notes', type: 'textarea', optional: true, max: 500, placeholder: 'e.g. child seat, extra luggage space, preferred model' },
    ],
    title_of: (d) => `${d.pickupCity || 'Pickup'} → ${d.dropoffCity || 'Drop-off'}`,
    date_of: (d) => d.pickupAt,
    people_of: (d) => d.passengers,
    summary: (d) => [['Pickup', `${d.pickupCity || '—'}, ${fmtDate(d.pickupAt)}`], ['Drop-off', `${d.dropoffCity || '—'}, ${fmtDate(d.dropoffAt)}`], ['Rental type', d.rentalType], ['Vehicle', d.vehicleType], ['Passengers', d.passengers]],
  },
  visa: {
    desc: 'Get expert guidance on visa requirements and application support.',
    label: 'Visa', title: 'Visa request', Icon: IdCard, tone: ['#6e4b8f', '#c7a6e6'],
    blurb: 'Document upload after advisor review.',
    heroTitle: <>Travel further<br /><span style={{ font: '500 14px sans-serif' }}>We’ll help with your visa</span></>,
    earnLabel: 'after the visa service is completed',
    note: ['Document upload after advisor review', 'Our travel advisor will review your request and guide you on the required documents.'],
    fields: [
      { key: 'country', label: 'Destination country', type: 'text', placeholder: 'Japan', required: true },
      { key: 'nationality', label: 'Your nationality', type: 'select', options: ['Indian', 'Other'].map((v) => [v, v]), def: 'Indian' },
      { key: 'visaType', label: 'Visa type', type: 'select', options: [['tourist', 'Tourist Visa'], ['business', 'Business Visa'], ['transit', 'Transit Visa'], ['student', 'Student Visa']], def: 'tourist' },
      [{ key: 'travelDate', label: 'Intended travel date', type: 'date', required: true }, { key: 'applicants', label: 'Number of applicants', type: 'counter', min: 1, max: 12, def: 1 }],
      { key: 'urgency', label: 'Preferred appointment', type: 'select', options: [['regular', 'Any date (flexible)'], ['urgent', 'As soon as possible']], def: 'regular' },
    ],
    title_of: (d) => `${d.country || 'Visa'} visa`,
    date_of: (d) => d.travelDate,
    people_of: (d) => d.applicants,
    summary: (d) => [['Destination', d.country], ['Nationality', d.nationality], ['Visa type', humanize(d.visaType)], ['Travel date', fmtDate(d.travelDate)], ['Applicants', d.applicants], ['Appointment', d.urgency === 'urgent' ? 'As soon as possible' : 'Flexible']],
  },
  tour: {
    desc: 'Explore curated tour packages with flights, hotels and more.',
    label: 'Tour package', title: 'Tour package request', Icon: MapIcon, tone: ['#2c7a6b', '#8fd6c2'],
    blurb: 'Tell us what you love and we will shape the itinerary.',
    heroTitle: <>Curated journeys<br /><span style={{ font: '500 14px sans-serif' }}>Real places. Deeper experiences.</span></>,
    earnLabel: 'after the tour package is completed',
    fields: [
      { key: 'destination', label: 'Destination', type: 'text', placeholder: 'Thailand', required: true },
      [{ key: 'startDate', label: 'Preferred start date', type: 'date', required: true }, { key: 'endDate', label: 'Preferred end date', type: 'date', required: true }],
      { key: 'flexibleDates', type: 'check', label: 'Flexible dates?', hint: 'Yes, I’m flexible' },
      [{ key: 'participants', label: 'Number of travelers', type: 'counter', min: 1, max: 30, def: 2 }, { key: 'budget', label: 'Budget (INR)', type: 'select', options: ['Under ₹50,000', '₹50,000 – 1,00,000', '₹1,00,000 – 1,50,000', '₹1,50,000 – 3,00,000', '₹3,00,000+'].map((v) => [v, v]), def: '₹1,00,000 – 1,50,000' }],
      { key: 'activities', label: 'Interests (select all that apply)', type: 'multi', options: ['Sightseeing', 'Beaches', 'Nature', 'Culture', 'Food', 'Adventure', 'Honeymoon', 'Family-friendly'], def: [] },
      { key: 'preferences', label: 'Additional preferences', type: 'textarea', optional: true, max: 500, placeholder: 'e.g. preferred hotels, activities, special occasions' },
    ],
    title_of: (d) => d.destination || 'Tour package',
    date_of: (d) => d.startDate,
    people_of: (d) => d.participants,
    summary: (d) => [['Destination', d.destination], ['Dates', `${fmtDate(d.startDate)} – ${fmtDate(d.endDate)}`], ['Travelers', d.participants], ['Budget', d.budget], ['Interests', (d.activities || []).join(', ') || '—']],
  },
  cruise: {
    desc: 'Set sail with top cruise lines to amazing destinations.',
    label: 'Cruise', title: 'Cruise request', Icon: Ship, tone: ['#25557a', '#86b6dc'],
    blurb: 'Share a few details and we’ll plan the perfect cruise for you.',
    heroTitle: <>Cruise Holidays<br /><span style={{ font: '500 14px sans-serif' }}>Sail to new horizons</span></>,
    earnLabel: 'after your cruise booking is completed',
    fields: [
      { key: 'region', label: 'Region', type: 'select', options: ['Mediterranean (Europe)', 'Caribbean', 'Alaska', 'Asia & Far East', 'Indian Ocean & Maldives', 'Middle East'].map((v) => [v, v]), def: 'Mediterranean (Europe)' },
      { key: 'departurePort', label: 'Departure port', type: 'text', placeholder: 'Barcelona, Spain' },
      { key: 'preferredDates', label: 'Preferred departure dates', type: 'text', placeholder: '15 Nov 2026 – 22 Nov 2026', required: true },
      [{ key: 'nights', label: 'Nights', type: 'select', options: [3, 5, 7, 10, 14].map((n) => [String(n), `${n} nights`]), def: '7' }, { key: 'travelers', label: 'Travelers', type: 'select', options: [1, 2, 3, 4, 5, 6].map((n) => [String(n), `${n} traveler${n > 1 ? 's' : ''}`]), def: '2' }],
      { key: 'cabinPreference', label: 'Cabin preference', type: 'select', options: ['Inside cabin', 'Ocean view cabin', 'Balcony cabin', 'Suite'].map((v) => [v, v]), def: 'Balcony cabin' },
      { key: 'budget', label: 'Estimated budget (INR)', type: 'select', options: ['Under ₹1,00,000', '₹1,00,000 – 2,00,000', '₹2,00,000 – 3,00,000', '₹3,00,000+'].map((v) => [v, v]), def: '₹2,00,000 – 3,00,000' },
    ],
    title_of: (d) => d.region || 'Cruise',
    date_of: (d) => d.preferredDates,
    people_of: (d) => Number(d.travelers) || 1,
    summary: (d) => [['Region', d.region], ['Departure port', d.departurePort], ['Dates', d.preferredDates], ['Nights', d.nights], ['Travelers', d.travelers], ['Cabin', d.cabinPreference], ['Budget', d.budget]],
  },
  custom: {
    desc: 'Have something unique in mind? Let our advisors create a personalized itinerary for you.',
    label: 'Customized travel', title: 'Customized travel request', Icon: Compass, tone: ['#a55a2a', '#efb98a'],
    blurb: 'Tell us what you have in mind and we’ll create a personalized itinerary.',
    heroTitle: <>Your Journey, Your Way<br /><span style={{ font: '500 14px sans-serif' }}>Customized travel across India and beyond</span></>,
    earnLabel: 'after your customized travel booking is completed',
    fields: [
      { key: 'destinations', label: 'Destinations', type: 'text', placeholder: 'Jaipur, Udaipur, Jodhpur', required: true, hint: 'You can list multiple, separated by commas' },
      { key: 'travelDates', label: 'Travel dates', type: 'text', placeholder: '10 Nov 2026 – 18 Nov 2026', required: true },
      [{ key: 'travelers', label: 'Travelers', type: 'select', options: [1, 2, 3, 4, 5, 6, 8, 10].map((n) => [String(n), `${n} traveler${n > 1 ? 's' : ''}`]), def: '2' }, { key: 'budget', label: 'Estimated budget (INR)', type: 'select', options: ['Under ₹1,00,000', '₹1,00,000 – 1,50,000', '₹1,50,000 – 2,50,000', '₹2,50,000+'].map((v) => [v, v]), def: '₹1,50,000 – 2,50,000' }],
      { key: 'travelStyle', label: 'Travel style (select all that apply)', type: 'multi', options: ['Culture', 'Nature', 'Relaxation', 'Adventure'], def: [], join: true },
      { key: 'specialRequests', label: 'Any special requests or custom needs?', type: 'textarea', optional: true, max: 500, placeholder: 'E.g. heritage stays, private guide, unique experiences…' },
    ],
    title_of: (d) => d.destinations || 'Customized travel',
    date_of: (d) => d.travelDates,
    people_of: (d) => Number(d.travelers) || 1,
    summary: (d) => [['Destinations', d.destinations], ['Dates', d.travelDates], ['Travelers', d.travelers], ['Budget', d.budget], ['Style', d.travelStyle || '—']],
  },
  airport_transfer: {
    desc: 'Arrange a private or shared transfer for a smooth arrival and departure.',
    label: 'Airport transfer', title: 'Airport transfer request', Icon: CarTaxiFront, tone: ['#34495e', '#9fb2c6'],
    blurb: 'Share your travel details and we’ll take care of the rest.',
    heroTitle: <>Seamless Airport Transfers<br /><span style={{ font: '500 14px sans-serif' }}>Comfortable rides for a smoother journey</span></>,
    earnLabel: 'after your airport transfer booking is completed',
    fields: [
      { key: 'airport', label: 'Airport', type: 'select', options: ['Indira Gandhi International Airport (DEL)', 'Chhatrapati Shivaji Maharaj International Airport (BOM)', 'Kempegowda International Airport (BLR)', 'Jaipur International Airport (JAI)', 'Goa International Airport (GOI)', 'Other'].map((v) => [v, v]), def: 'Indira Gandhi International Airport (DEL)' },
      { key: 'flightReference', label: 'Flight arrival reference', type: 'text', optional: true, placeholder: 'e.g. AI 308, 15 Nov 2026, 14:20' },
      { key: 'pickupLocation', label: 'Pickup location', type: 'text', placeholder: 'Terminal 3 – Arrivals', required: true },
      { key: 'dropoffLocation', label: 'Drop-off location', type: 'text', placeholder: 'The Leela Palace New Delhi', required: true },
      { key: 'pickupAt', label: 'Pickup date & time', type: 'datetime', required: true },
      [{ key: 'passengers', label: 'Passengers', type: 'select', options: [1, 2, 3, 4, 5, 6].map((n) => [String(n), `${n} passenger${n > 1 ? 's' : ''}`]), def: '2' }, { key: 'luggage', label: 'Luggage pieces', type: 'select', options: [0, 1, 2, 3, 4, 5, 6].map((n) => [String(n), `${n} piece${n === 1 ? '' : 's'}`]), def: '3' }],
      { key: 'vehiclePreference', label: 'Vehicle preference', type: 'select', options: ['Sedan', 'Premium SUV', 'Luxury sedan', 'Van / MUV'].map((v) => [v, v]), def: 'Premium SUV' },
    ],
    title_of: (d) => d.airport?.replace(/ International Airport.*/, '') || 'Airport transfer',
    date_of: (d) => d.pickupAt,
    people_of: (d) => Number(d.passengers) || 1,
    summary: (d) => [['Airport', d.airport], ['Flight', d.flightReference], ['Pickup', d.pickupLocation], ['Drop-off', d.dropoffLocation], ['Pickup time', fmtDate(d.pickupAt)], ['Passengers', d.passengers], ['Vehicle', d.vehiclePreference]],
  },
  insurance: {
    desc: 'Get peace of mind for your trip with trusted travel insurance plans.',
    label: 'Insurance', title: 'Travel insurance request', Icon: ShieldCheck, tone: ['#2a6b5e', '#8ad0be'],
    blurb: 'Coverage and price confirmed by our advisor after your request.',
    heroTitle: <>Travel with added peace of mind<br /><span style={{ font: '500 14px sans-serif' }}>Curated insurance for your next journey.</span></>,
    earnLabel: 'after the insurance service is completed',
    fields: [
      { key: 'destination', label: 'Destination', type: 'text', placeholder: 'Kashmir, India', required: true },
      [{ key: 'departureDate', label: 'Departure date', type: 'date', required: true }, { key: 'returnDate', label: 'Return date', type: 'date', required: true }],
      { key: 'travelerAges', label: 'Travellers and ages', type: 'text', placeholder: 'e.g. 32, 28', required: true, hint: 'Ages of everyone travelling, separated by commas' },
      { key: 'coverage', label: 'Coverage preferences', type: 'cards', options: [['Standard', 'Medical, trip delay and baggage'], ['Enhanced', 'Higher coverage and more benefits'], ['Premium', 'Comprehensive for longer trips']], def: 'Standard' },
    ],
    title_of: (d) => d.destination || 'Travel insurance',
    date_of: (d) => d.departureDate,
    people_of: (d) => (d.travelerAges ? String(d.travelerAges).split(',').filter(Boolean).length : 1),
    summary: (d) => [['Destination', d.destination], ['Dates', `${fmtDate(d.departureDate)} – ${fmtDate(d.returnDate)}`], ['Traveller ages', d.travelerAges], ['Coverage', d.coverage]],
  },
  activity: {
    desc: 'Book tickets for attractions, shows, and local experiences.',
    label: 'Activity tickets', title: 'Activity tickets request', Icon: Ticket, tone: ['#a8412f', '#f0a898'],
    blurb: 'Availability and price confirmed by our advisor after your request.',
    heroTitle: <>Unforgettable experiences await<br /><span style={{ font: '500 14px sans-serif' }}>Get activity tickets for your next destination.</span></>,
    earnLabel: 'after the activity is completed',
    fields: [
      { key: 'destination', label: 'Destination', type: 'city', placeholder: 'Jaipur, Rajasthan', required: true },
      { key: 'activity', label: 'Search activities', type: 'text', placeholder: 'e.g. Amber Fort, city tour, cultural show', required: true },
      { key: 'visitDate', label: 'Visit date', type: 'date', required: true },
      [{ key: 'adults', label: 'Adults (12+ years)', type: 'counter', min: 1, max: 20, def: 2 }, { key: 'children', label: 'Children (2–11 years)', type: 'counter', min: 0, max: 20, def: 0 }],
      { key: 'preferences', label: 'Preferences', type: 'multi', optional: true, options: ['Cultural', 'Adventure', 'Family friendly', 'Indoor'], def: [], join: true },
    ],
    title_of: (d) => d.activity || d.destination || 'Activity tickets',
    date_of: (d) => d.visitDate,
    people_of: (d) => (Number(d.adults) || 0) + (Number(d.children) || 0) || 1,
    summary: (d) => [['Destination', d.destination], ['Activity', d.activity], ['Visit date', fmtDate(d.visitDate)], ['Adults / children', `${d.adults || 0} / ${d.children || 0}`], ['Preferences', Array.isArray(d.preferences) ? d.preferences.join(', ') : d.preferences]],
  },
};

export const SERVICE_ORDER = ['flight', 'hotel', 'car_rental', 'visa', 'tour', 'cruise', 'custom', 'airport_transfer', 'insurance', 'activity'];
export const serviceOf = (type) => SERVICES[type] || { label: humanize(type), Icon: Binoculars, tone: ['#4a5a6a', '#a9b6c3'], title_of: () => humanize(type), date_of: () => null, people_of: () => null, summary: () => [] };

export const STATUS = {
  new: { label: 'Requested', tone: 'amber', step: 0 },
  assigned: { label: 'Assigned', tone: 'blue', step: 1 },
  contacted: { label: 'In progress', tone: 'blue', step: 1 },
  awaiting_approval: { label: 'Quote ready', tone: 'amber', step: 2 },
  awaiting_payment: { label: 'Awaiting payment', tone: 'amber', step: 3 },
  payment_received: { label: 'Payment received', tone: 'green', step: 3 },
  booking_confirmed: { label: 'Confirmed', tone: 'green', step: 3 },
  completed: { label: 'Completed', tone: 'green', step: 4 },
  cancelled: { label: 'Cancelled', tone: 'red', step: -1 },
};
export const statusMeta = (status) => STATUS[status] || { label: humanize(status), tone: '', step: 0 };
export const isPast = (b) => b.status === 'completed' || b.status === 'cancelled';

// The five customer-facing milestones (the 9 backend stages collapse onto these).
export const MILESTONES = ['Requested', 'Assigned', 'Quote ready', 'Confirmed', 'Completed'];

export const bookingTitle = (b) => serviceOf(b.type).title_of(b);
export const bookingDate = (b) => serviceOf(b.type).date_of(b);
export const bookingPeople = (b) => serviceOf(b.type).people_of(b);

export const bookingSubtitle = (b) => {
  const date = bookingDate(b);
  const people = bookingPeople(b);
  const parts = [];
  if (date) parts.push(/^\d{4}-\d{2}-\d{2}/.test(String(date)) ? fmtDate(date) : String(date));
  if (people) parts.push(`${people} ${Number(people) === 1 ? 'traveller' : 'travellers'}`);
  return parts.join('  •  ');
};

export const TIER_BENEFITS = {
  Silver: ['Earn Wings on all bookings', 'Member-only support', 'Birthday greeting'],
  Gold: ['Earn Wings on all bookings', 'Exclusive member fares', 'Priority support', 'Early access to offers', 'Birthday surprise'],
  Platinum: ['Everything in Gold', 'Enhanced travel support', 'Preferred partner offers', 'Complimentary itinerary reviews'],
  Titanium: ['Everything in Platinum', 'Dedicated travel assistance', 'Highest-tier recognition', 'First access to new experiences'],
};
export const TIERS = [['Silver', 0], ['Gold', 1000], ['Platinum', 5000], ['Titanium', 20000]];
