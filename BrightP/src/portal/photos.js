// Destination and service photography (Unsplash, free to use under the Unsplash
// licence). Files live in src/assets/photos; swap any of them for your own
// images with the same name and every screen follows.
import santorini from '../assets/photos/santorini.jpg';
import domes from '../assets/photos/domes.jpg';
import steps from '../assets/photos/steps.jpg';
import singapore from '../assets/photos/singapore.jpg';
import pagoda from '../assets/photos/pagoda.jpg';
import wing from '../assets/photos/wing.jpg';
import hotelroom from '../assets/photos/hotelroom.jpg';
import suite from '../assets/photos/suite.jpg';
import resort from '../assets/photos/resort.jpg';
import cruise from '../assets/photos/cruise.jpg';
import colosseum from '../assets/photos/colosseum.jpg';
import maldives from '../assets/photos/maldives.jpg';
import kerala from '../assets/photos/kerala.jpg';
import jaipur from '../assets/photos/jaipur.jpg';
import mountains from '../assets/photos/mountains.jpg';
import goa from '../assets/photos/goa.jpg';
import dubai from '../assets/photos/dubai.jpg';
import mykonos from '../assets/photos/mykonos.jpg';
import paris from '../assets/photos/paris.jpg';
import car from '../assets/photos/car.jpg';
import roadtrip from '../assets/photos/roadtrip.jpg';
import terminal from '../assets/photos/terminal.jpg';
import landing from '../assets/photos/landing.jpg';
import beach from '../assets/photos/beach.jpg';
import passport from '../assets/photos/passport.jpg';
import tokyo from '../assets/photos/tokyo.jpg';
import amalfi from '../assets/photos/amalfi.jpg';

export const PHOTO = { santorini, domes, steps, singapore, pagoda, wing, hotelroom, suite, resort, cruise, colosseum, maldives, kerala, jaipur, mountains, goa, dubai, mykonos, paris, car, roadtrip, terminal, landing, beach, passport, tokyo, amalfi };

// One photo per travel service (service picker, booking cards, review).
export const SERVICE_PHOTO = {
  flight: wing, hotel: hotelroom, car_rental: car, visa: passport, tour: domes, cruise,
  airport_transfer: landing, insurance: terminal, activity: colosseum, custom: maldives,
};

const DESTINATIONS = [
  [/singapore|sin\b/i, singapore], [/paris|france/i, paris], [/tokyo|kyoto|japan/i, pagoda], [/santorini|greece|mykonos/i, domes],
  [/dubai|uae/i, dubai], [/goa/i, goa], [/kerala|kochi|alleppey/i, kerala], [/jaipur|rajasthan|udaipur/i, jaipur],
  [/maldives/i, maldives], [/himalaya|leh|srinagar|kashmir|manali/i, mountains], [/rome|italy|colosseum/i, colosseum], [/amalfi|positano/i, amalfi],
];

// Services whose picture must always match the service itself: a hotel shows a hotel, a flight shows a
// plane. A hotel in Dubai is still a hotel, so the destination never overrides these.
const CATEGORY_FIRST = new Set(['flight', 'hotel', 'car_rental', 'visa', 'cruise', 'airport_transfer', 'insurance']);

// For destination-led services (tour, activity, customized travel) the text can name the service itself,
// e.g. a "Free Dhow Cruise" voucher trip.
const SERVICE_WORDS = [[/cruise|dhow|yacht/i, cruise], [/hotel|resort|stay/i, hotelroom], [/flight|air ?ticket|airline/i, wing], [/car rental|cab|chauffeur/i, car]];

/** Best photo for a booking: its service category first, then destination for destination-led trips. */
export const photoFor = (type, ...places) => {
  if (CATEGORY_FIRST.has(type) && SERVICE_PHOTO[type]) return SERVICE_PHOTO[type];
  const text = places.filter(Boolean).join(' ');
  const word = SERVICE_WORDS.find(([re]) => re.test(text));
  if (word) return word[1];
  const hit = DESTINATIONS.find(([re]) => re.test(text));
  return hit ? hit[1] : SERVICE_PHOTO[type] || santorini;
};
