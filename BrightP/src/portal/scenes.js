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

export const SCENE = { palace: encode(palaceSvg), lake: encode(lakeSvg) };
