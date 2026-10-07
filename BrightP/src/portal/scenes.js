// Illustrated hero scenes used until licensed destination photography is supplied.
// Each export is a CSS `url(...)` value (inline SVG), so it can be swapped for a
// real photo by changing the single mapping in ui.js (IMG).

const encode = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}")`;

const arches = (x, y, count, w, h, gap, fill) =>
  Array.from({ length: count }, (_, i) => {
    const ax = x + i * (w + gap);
    return `<path d="M${ax} ${y + h} v-${h - w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 v${h - w / 2} z" fill="${fill}"/>`;
  }).join('');

const dome = (cx, base, r, fill, shade) => `
  <rect x="${cx - r * 0.7}" y="${base}" width="${r * 1.4}" height="${r * 0.9}" fill="${shade}"/>
  <path d="M${cx - r} ${base} a${r} ${r} 0 0 1 ${r * 2} 0 z" fill="${fill}"/>
  <rect x="${cx - 1.5}" y="${base - r - 14}" width="3" height="16" fill="${shade}"/>`;

const palaceSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f7fa8"/><stop offset=".45" stop-color="#d9a98e"/><stop offset="1" stop-color="#f6d9a4"/></linearGradient>
    <radialGradient id="sun" cx=".72" cy=".52" r=".4"><stop offset="0" stop-color="#fff3c9" stop-opacity=".95"/><stop offset="1" stop-color="#fff3c9" stop-opacity="0"/></radialGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4b48d"/><stop offset="1" stop-color="#5d7f9c"/></linearGradient>
  </defs>
  <rect width="800" height="520" fill="url(#sky)"/>
  <rect width="800" height="520" fill="url(#sun)"/>
  <path d="M0 300 L90 250 L170 285 L260 235 L360 290 L470 245 L560 290 L680 240 L800 285 V380 H0z" fill="#8f8aa3" opacity=".55"/>
  <path d="M0 330 L120 285 L220 320 L330 290 L450 335 L580 295 L700 330 L800 305 V400 H0z" fill="#6c7c8b" opacity=".75"/>
  <g>
    <rect x="150" y="300" width="500" height="92" fill="#dcb287"/>
    <rect x="150" y="300" width="500" height="10" fill="#c99b6f"/>
    <rect x="150" y="340" width="500" height="6" fill="#c99b6f"/>
    ${arches(166, 352, 16, 18, 36, 12, '#8a6544')}
    ${arches(170, 312, 15, 16, 24, 17, '#9c7451')}
    <rect x="228" y="236" width="86" height="156" fill="#e2bb90"/><rect x="228" y="236" width="86" height="8" fill="#c99b6f"/>
    ${arches(238, 262, 4, 14, 40, 6, '#8a6544')}${arches(238, 318, 4, 14, 40, 6, '#8a6544')}
    <rect x="486" y="226" width="96" height="166" fill="#e2bb90"/><rect x="486" y="226" width="96" height="8" fill="#c99b6f"/>
    ${arches(498, 256, 4, 15, 42, 8, '#8a6544')}${arches(498, 316, 4, 15, 42, 8, '#8a6544')}
    ${dome(271, 220, 22, '#efd2a8', '#c99b6f')}
    ${dome(534, 210, 24, '#efd2a8', '#c99b6f')}
    ${dome(190, 292, 12, '#efd2a8', '#c99b6f')}
    ${dome(400, 290, 15, '#efd2a8', '#c99b6f')}
    ${dome(610, 292, 12, '#efd2a8', '#c99b6f')}
    <rect x="360" y="262" width="80" height="130" fill="#e6c196"/>
    ${arches(372, 280, 3, 16, 52, 8, '#8a6544')}
  </g>
  <rect y="392" width="800" height="128" fill="url(#water)"/>
  <g opacity=".26" transform="translate(0 784) scale(1 -1)"><rect x="150" y="300" width="500" height="92" fill="#dcb287"/><rect x="228" y="236" width="86" height="156" fill="#e2bb90"/><rect x="486" y="226" width="96" height="166" fill="#e2bb90"/></g>
  <g stroke="#fff" stroke-opacity=".18" stroke-width="2"><path d="M0 420h800M0 446h800M0 474h800M0 504h800"/></g>
  <path d="M0 360 q40-40 80-10 q30-26 70 4 v90 H0z" fill="#2f4a3b"/>
  <path d="M800 352 q-50-44-96-8 q-34-26-74 8 v98 H800z" fill="#2f4a3b"/>
</svg>`;

const lakeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb0cf"/><stop offset=".5" stop-color="#f2cfa6"/><stop offset="1" stop-color="#fbe3b8"/></linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0cfa8"/><stop offset=".5" stop-color="#9eb7c6"/><stop offset="1" stop-color="#5f8199"/></linearGradient>
  </defs>
  <rect width="800" height="520" fill="url(#sky)"/>
  <path d="M0 290 L110 215 L210 265 L320 205 L430 262 L540 220 L660 268 L800 225 V350 H0z" fill="#a89fb0" opacity=".7"/>
  <path d="M0 322 L140 262 L260 308 L380 270 L520 318 L650 276 L800 314 V380 H0z" fill="#7c8d94" opacity=".85"/>
  <rect y="372" width="800" height="148" fill="url(#water)"/>
  <g>
    <rect x="250" y="326" width="300" height="48" fill="#f7efe1"/>
    <rect x="250" y="326" width="300" height="6" fill="#e4d4b6"/>
    ${arches(262, 340, 14, 12, 28, 8, '#b49a76')}
    <rect x="318" y="296" width="64" height="78" fill="#fbf5ea"/><rect x="418" y="302" width="60" height="72" fill="#fbf5ea"/>
    ${arches(326, 308, 3, 12, 30, 6, '#b49a76')}${arches(426, 314, 3, 12, 28, 6, '#b49a76')}
    ${dome(350, 290, 16, '#fffaf0', '#e4d4b6')}${dome(448, 296, 15, '#fffaf0', '#e4d4b6')}
    ${dome(276, 320, 9, '#fffaf0', '#e4d4b6')}${dome(524, 320, 9, '#fffaf0', '#e4d4b6')}
  </g>
  <g opacity=".3" transform="translate(0 748) scale(1 -1)"><rect x="250" y="326" width="300" height="48" fill="#f7efe1"/><rect x="318" y="296" width="64" height="78" fill="#fbf5ea"/><rect x="418" y="302" width="60" height="72" fill="#fbf5ea"/></g>
  <g stroke="#fff" stroke-opacity=".2" stroke-width="2"><path d="M0 410h800M0 440h800M0 472h800M0 504h800"/></g>
  <path d="M590 372 q40-34 100-16 q60-24 110 6 v158 H590z" fill="#58704f" opacity=".92"/>
</svg>`;


const mountainsSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f6592"/><stop offset=".6" stop-color="#a9c6e3"/><stop offset="1" stop-color="#f1e6d3"/></linearGradient></defs>
  <rect width="800" height="520" fill="url(#sky)"/>
  <circle cx="610" cy="130" r="38" fill="#fff8e4" opacity=".9"/>
  <path d="M0 340 L130 190 L210 270 L330 120 L450 270 L560 170 L690 290 L800 220 V520 H0z" fill="#dfe9f4"/>
  <path d="M330 120 L290 175 L322 168 L345 196 L372 170 L402 190 Z" fill="#fff"/>
  <path d="M130 190 L100 232 L128 226 L150 246 L172 224 Z" fill="#fff"/>
  <path d="M560 170 L528 214 L556 208 L578 228 L600 206 Z" fill="#fff"/>
  <path d="M0 400 L120 330 L240 390 L380 320 L520 395 L660 335 L800 390 V520 H0z" fill="#6f8aa6"/>
  <path d="M0 450 L150 400 L300 445 L470 410 L640 450 L800 420 V520 H0z" fill="#3f5b3f"/>
  <g fill="#2c4a33"><path d="M60 470 l16-48 16 48z M96 478 l14-40 14 40z M700 468 l16-50 16 50z M736 476 l12-36 12 36z"/></g>
</svg>`;

const backwatersSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb7c9"/><stop offset=".55" stop-color="#f2dca6"/><stop offset="1" stop-color="#f6e9c4"/></linearGradient>
  <linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fc9b6"/><stop offset="1" stop-color="#2e6f62"/></linearGradient></defs>
  <rect width="800" height="520" fill="url(#sky)"/>
  <circle cx="540" cy="250" r="46" fill="#fff4cf" opacity=".95"/>
  <path d="M0 300 q100-40 200-6 t200-4 t200 6 t200-8 V350 H0z" fill="#4f8f5f" opacity=".8"/>
  <rect y="340" width="800" height="180" fill="url(#w)"/>
  <g stroke="#fff" stroke-opacity=".25" stroke-width="2"><path d="M0 380h800M0 415h800M0 452h800M0 490h800"/></g>
  <path d="M250 372 q70 28 190 0 l-16 24 q-80 18 -158 0z" fill="#7a4b2a"/>
  <path d="M290 372 q70-70 130 0z" fill="#d9b66b"/>
  <g stroke="#2d5a36" stroke-width="5" fill="none" stroke-linecap="round"><path d="M60 345 q4-90 -6-150"/><path d="M60 195 q-50 4 -64 36 M60 195 q40-14 70 10 M60 195 q-20-36 -60-40 M60 195 q30-34 66-26"/><path d="M730 350 q-4-100 6-160"/><path d="M736 190 q50 4 64 36 M736 190 q-40-14 -70 10 M736 190 q20-36 60-40 M736 190 q-30-34 -66-26"/></g>
</svg>`;

const skylineSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26406a"/><stop offset=".55" stop-color="#d98c6a"/><stop offset="1" stop-color="#f6c98a"/></linearGradient></defs>
  <rect width="800" height="520" fill="url(#sky)"/>
  <circle cx="160" cy="300" r="60" fill="#ffe3a8" opacity=".9"/>
  <g fill="#1a2f52"><rect x="60" y="330" width="46" height="190"/><rect x="118" y="290" width="40" height="230"/><rect x="170" y="350" width="56" height="170"/><rect x="250" y="250" width="34" height="270"/><path d="M262 190 l8 60 h-16z"/><rect x="300" y="330" width="60" height="190"/><rect x="380" y="270" width="48" height="250"/><path d="M404 160 l10 112 h-20z"/><rect x="450" y="320" width="54" height="200"/><rect x="526" y="240" width="40" height="280"/><rect x="584" y="340" width="58" height="180"/><rect x="660" y="300" width="42" height="220"/><rect x="716" y="350" width="64" height="170"/></g>
  <g fill="#f9d58a" opacity=".85"><rect x="130" y="320" width="5" height="7"/><rect x="142" y="348" width="5" height="7"/><rect x="262" y="290" width="5" height="7"/><rect x="396" y="310" width="5" height="7"/><rect x="408" y="350" width="5" height="7"/><rect x="536" y="290" width="5" height="7"/><rect x="672" y="340" width="5" height="7"/></g>
  <rect y="470" width="800" height="50" fill="#0f1d36"/>
</svg>`;

export const SCENE = { palace: encode(palaceSvg), lake: encode(lakeSvg), mountains: encode(mountainsSvg), backwaters: encode(backwatersSvg), skyline: encode(skylineSvg) };
