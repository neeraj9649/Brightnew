import React, { useEffect, useRef, useState } from 'react';

// Small dependency-free SVG charts for the admin dashboards.

const NAVY = '#10283f';
const GOLD = '#c9963e';

// Rounds up so that the four gridline steps are whole, tidy numbers.
const niceMax = (value) => {
  if (value <= 4) return 4;
  const step = value / 4;
  const pow = 10 ** Math.floor(Math.log10(step));
  const n = step / pow;
  return 4 * (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
};

function useWidth(min = 260) {
  const ref = useRef(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    if (!ref.current) return undefined;
    const el = ref.current;
    const measure = () => setW(Math.max(min, Math.floor(el.getBoundingClientRect().width)));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [min]);
  return [ref, w];
}

const shortDate = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
};

export function Spark({ data = [], color = NAVY, height = 40, width = 120 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const step = width / Math.max(data.length - 1, 1);
  const pts = data.map((v, i) => [i * step, height - 4 - (v / max) * (height - 8)]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden="true">
      <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={color} opacity="0.1" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Multi-series line chart. series: [{ name, color, data: [{date, value}], dashed }] */
export function LineChart({ series, height = 230, area = false, money = false, labelEvery }) {
  const [boxRef, W] = useWidth();
  const H = height;
  const pad = { l: 38, r: 12, t: 12, b: 26 };
  const all = series.flatMap((s) => s.data.map((d) => d.value));
  const max = niceMax(Math.max(...all, 1));
  const n = Math.max(...series.map((s) => s.data.length), 1);
  const x = (i) => pad.l + (i / Math.max(n - 1, 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const base = series[0]?.data || [];
  const every = labelEvery || Math.ceil(n / Math.max(3, Math.floor(W / 90)));
  return (
    <div ref={boxRef} style={{ width: '100%' }}>
    <svg width={W} height={H} className="st-chart" role="img" aria-label="Line chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#eee9dc" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#8b96a3">{money ? `₹${Math.round(t / 1000)}k` : Math.round(t).toLocaleString('en-IN')}</text>
        </g>
      ))}
      {base.map((d, i) => (i % every === 0 ? <text key={d.date} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#8b96a3">{shortDate(d.date)}</text> : null))}
      {series.map((s) => {
        const pts = s.data.map((d, i) => [x(i), y(d.value)]);
        const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
        return (
          <g key={s.name}>
            {area && <path d={`${line} L${x(s.data.length - 1)} ${H - pad.b} L${x(0)} ${H - pad.b} Z`} fill={s.color} opacity="0.1" />}
            <path d={line} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? '5 4' : undefined} />
            {s.data.length <= 40 && pts.map(([px, py], i) => <circle key={i} cx={px} cy={py} r="2.6" fill="#fff" stroke={s.color} strokeWidth="1.6" />)}
          </g>
        );
      })}
    </svg>
    </div>
  );
}

export function BarChart({ data, color = NAVY, height = 210, line, lineColor = GOLD, lineMax = 100, labelEvery, avg, secondary }) {
  const [boxRef, W] = useWidth();
  const H = height;
  const pad = { l: 38, r: line ? 34 : 12, t: 12, b: 26 };
  const max = niceMax(Math.max(...data.map((d) => d.value), ...(secondary || []).map((d) => d.value), 1));
  const n = data.length || 1;
  const bw = (W - pad.l - pad.r) / n;
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const every = labelEvery || Math.ceil(n / Math.max(3, Math.floor(W / 90)));
  const ticks = [0, 0.5, 1].map((f) => f * max);
  return (
    <div ref={boxRef} style={{ width: '100%' }}>
    <svg width={W} height={H} className="st-chart" role="img" aria-label="Bar chart">
      {ticks.map((t) => (
        <g key={t}><line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#eee9dc" /><text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#8b96a3">{Math.round(t * 10) / 10}</text></g>
      ))}
      {data.map((d, i) => (
        <g key={d.date}>
          <rect x={pad.l + i * bw + bw * 0.18} y={y(d.value)} width={bw * 0.64} height={Math.max(0, H - pad.b - y(d.value))} rx="2" fill={color} />
          {i % every === 0 && <text x={pad.l + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#8b96a3">{shortDate(d.date)}</text>}
        </g>
      ))}
      {secondary && secondary.map((d, i) => <rect key={d.date} x={pad.l + i * bw + bw * 0.18} y={y(d.value)} width={bw * 0.64} height={Math.max(0, H - pad.b - y(d.value))} rx="2" fill="#aab6c4" opacity="0.7" />)}
      {line && (() => {
        const ly = (v) => pad.t + (1 - v / lineMax) * (H - pad.t - pad.b);
        const pts = line.map((d, i) => [pad.l + i * bw + bw / 2, ly(d.value)]);
        return (
          <>
            <path d={pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px} ${py}`).join(' ')} fill="none" stroke={lineColor} strokeWidth="2.2" />
            {[0, 25, 50, 75, 100].map((t) => <text key={t} x={W - pad.r + 6} y={ly(t) + 4} fontSize="10" fill="#8b96a3">{t}%</text>)}
          </>
        );
      })()}
      {avg != null && <><line x1={pad.l} x2={W - pad.r} y1={y(avg)} y2={y(avg)} stroke={GOLD} strokeDasharray="5 4" /><text x={W - pad.r} y={y(avg) - 5} textAnchor="end" fontSize="10" fill="#9b6b21" fontWeight="700">Avg {avg}</text></>}
    </svg>
    </div>
  );
}

export function Donut({ slices, size = 190, center, thickness = 34 }) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = size / 2 - thickness / 2 - 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Donut chart" style={{ flex: 'none' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eee9dc" strokeWidth={thickness} />
      {slices.map((s) => {
        const len = (s.value / total) * c;
        const el = <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />;
        offset += len;
        return el;
      })}
      {center && <text textAnchor="middle" x={size / 2} y={size / 2 - 2} fontFamily="Georgia, serif" fontWeight="700" fontSize="26" fill={NAVY}>{center[0]}<tspan x={size / 2} dy="20" fontFamily="sans-serif" fontWeight="500" fontSize="12" fill="#6b7a8b">{center[1]}</tspan></text>}
    </svg>
  );
}

export function Legend({ items }) {
  return <div className="st-legend">{items.map((i) => <span key={i.label}><i style={{ background: i.color }} />{i.label}</span>)}</div>;
}

export function HBar({ label, value, max, color = NAVY, right }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 90px', gap: 12, alignItems: 'center', fontSize: 12 }}>
      <span style={{ color: '#6b7a8b', textAlign: 'right' }}>{label}</span>
      <div style={{ height: 22, background: '#f1ede3', borderRadius: 5, overflow: 'hidden' }}><div style={{ width: `${Math.max(2, (value / Math.max(max, 1)) * 100)}%`, height: '100%', background: color }} /></div>
      <span style={{ color: '#52606f', fontWeight: 700 }}>{right}</span>
    </div>
  );
}

export const CHART_COLORS = [NAVY, '#d9a43e', '#6dc2a5', '#b6a4e0', '#c8cdd4', '#e07a6a'];
