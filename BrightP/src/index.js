import { polyfillCountryFlagEmojis } from 'country-flag-emoji-polyfill';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Windows browsers have no flag emoji; this loads a small flag font only when needed.
polyfillCountryFlagEmojis('Twemoji Country Flags', `${process.env.PUBLIC_URL || ''}/fonts/TwemojiCountryFlags.woff2`);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);