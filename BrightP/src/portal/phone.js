import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js/min';

/*
 * Phone numbers are stored in one canonical form so the same person never ends up with two accounts:
 *   - India (+91): the bare 10-digit number, exactly as every existing account already stores it
 *   - everywhere else: "+" + country code + national number (E.164), e.g. +14155552671
 * The UI keeps typed values as "+<country code><national number>" and converts with toStoredPhone().
 */

export const DEFAULT_COUNTRY = 'IN';
const SUGGESTED = ['IN', 'AE', 'US', 'GB', 'SG', 'CA', 'AU'];
const LAST_KEY = 'bw_phone_country';

export const flagOf = (iso) => String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
export const dialOf = (iso) => getCountryCallingCode(iso);

let list;
export function allCountries() {
  if (list) return list;
  let names = null;
  try { names = new Intl.DisplayNames(['en'], { type: 'region' }); } catch { /* older browsers fall back to ISO codes */ }
  list = getCountries()
    .map((iso) => ({ iso, name: (names && names.of(iso)) || iso, dial: dialOf(iso) }))
    .filter((c) => c.name !== c.iso || !names)
    .sort((a, b) => a.name.localeCompare(b.name));
  return list;
}
export const countryOf = (iso) => allCountries().find((c) => c.iso === iso);

const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Search by country name, ISO code or dial code ("uk", "united kin", "+44", "44"). Best matches first. */
export function searchCountries(query) {
  const q = fold(query).trim();
  if (!q) return allCountries();
  const digits = q.replace(/[^\d]/g, '');
  const isDial = /^\+?\d+$/.test(q);
  const aliases = { uk: 'GB', uae: 'AE', usa: 'US', america: 'US', england: 'GB', holland: 'NL', emirates: 'AE' };
  const scored = [];
  allCountries().forEach((c) => {
    const name = fold(c.name);
    let score = 0;
    if (isDial) { if (c.dial === digits) score = 100; else if (c.dial.startsWith(digits)) score = 60; }
    else if (aliases[q] === c.iso || c.iso.toLowerCase() === q) score = 100;
    else if (name.startsWith(q)) score = 90;
    else if (name.split(/[\s-]+/).some((w) => w.startsWith(q))) score = 70;
    else if (name.includes(q)) score = 40;
    if (score) scored.push([score, c]);
  });
  return scored.sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name)).map((s) => s[1]);
}

export function detectCountry() {
  try {
    const locales = [...(navigator.languages || []), navigator.language].filter(Boolean);
    for (const l of locales) {
      const region = (new Intl.Locale(l).maximize().region || '').toUpperCase();
      if (region && countryOf(region)) return region;
    }
  } catch { /* ignore */ }
  return null;
}

export const rememberCountry = (iso) => { try { localStorage.setItem(LAST_KEY, iso); } catch { /* storage unavailable */ } };
export const lastCountry = () => { try { return localStorage.getItem(LAST_KEY); } catch { return null; } };

/** The country to start on: last choice, otherwise India (the primary market). */
export const initialCountry = () => { const l = lastCountry(); return l && countryOf(l) ? l : DEFAULT_COUNTRY; };

/** Countries to show first in the picker: the browser's region, the last choice, then popular ones. */
export function suggestedCountries() {
  const ids = [detectCountry(), lastCountry(), ...SUGGESTED].filter(Boolean);
  return [...new Set(ids)].map(countryOf).filter(Boolean).slice(0, 7);
}

const digitsOf = (v) => String(v || '').replace(/\D/g, '');

/** Typed/stored value -> E.164 string, or '' when it cannot be interpreted. Bare 10-digit numbers are India. */
export function toE164(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('+')) return `+${digitsOf(raw)}`;
  const d = digitsOf(raw);
  if (d.length === 10) return `+91${d}`;
  if (d.length === 12 && d.startsWith('91')) return `+${d}`;
  return d ? `+${d}` : '';
}

const parse = (value) => { const e = toE164(value); return e ? parsePhoneNumberFromString(e) : undefined; };

/** Canonical stored form: bare 10 digits for India, +E.164 for everywhere else. */
export function toStoredPhone(value) {
  const e = toE164(value);
  if (!e) return '';
  return /^\+91\d{10}$/.test(e) ? e.slice(3) : e;
}

export const isValidPhone = (value) => !!parse(value)?.isValid();

export const formatPhone = (value) => {
  const n = parse(value);
  if (!n) return value || '—';
  return n.countryCallingCode === '91' ? `+91 ${n.nationalNumber.slice(0, 5)} ${n.nationalNumber.slice(5)}` : n.formatInternational();
};

export const maskPhone = (value) => {
  const n = parse(value);
  if (!n) return '—';
  const nat = n.nationalNumber;
  return `+${n.countryCallingCode} ${nat.slice(0, 2)}${'*'.repeat(Math.max(nat.length - 5, 3))}${nat.slice(-3)}`;
};

/** Split a stored/typed value into { iso, national } (national digits only). */
export function splitPhone(value, fallbackIso = DEFAULT_COUNTRY) {
  const n = parse(value);
  if (!n) return { iso: fallbackIso, national: '' };
  return { iso: n.country || (getCountries().find((c) => dialOf(c) === n.countryCallingCode) ?? fallbackIso), national: n.nationalNumber };
}

/** Format national digits for display while typing, per country ("98765 43210", "(415) 555-2671"). */
export function formatNational(iso, national) {
  if (!national) return '';
  // AsYouType on the bare national digits never adds a trunk prefix ("0"), unlike formatNational().
  return new AsYouType(iso).input(national).replace(/^\+\d+\s?/, '');
}

/** Pasted/typed "+44 7700 900123" -> { iso, national } picked from the number itself, else null. */
export function fromInternational(raw) {
  if (!String(raw).trim().startsWith('+')) return null;
  const f = new AsYouType();
  f.input(`+${digitsOf(raw)}`);
  const num = f.getNumber();
  if (!num) return null;
  const iso = f.getCountry() || getCountries().find((c) => dialOf(c) === num.countryCallingCode);
  return iso ? { iso, national: num.nationalNumber } : null;
}

export const MAX_NATIONAL = (iso) => Math.max(15 - dialOf(iso).length, 4);
export const digitsOnly = digitsOf;
