import React from 'react';
import {clamp, easeOut} from './anim';

// Arabic captions: 2-3 words at a time, Cairo ExtraBold, white with a thick black outline,
// key words yellow #FFD23F or red #FF5A4E, lower-middle, kept out of the right 15% of the frame.
// Word.c: colour of this one occurrence (wins over the colours map).
// Group extras (all optional, from episode 04): br = words on the first line of a two-line card (or the word index of each
// line break, e.g. [2, 5] for three lines); w100 = real width of its
// widest line at 100 px (scripts/captionsizes.mjs), used instead of the estimate; fs = base size; x / maxW = own centre and width.
export type Word = {w: string; s: number; e: number; c?: string};
export type Group = {words: Word[]; s: number; e: number; style?: 'gold' | 'big' | 'hook'; br?: number | number[]; w100?: number; fs?: number; x?: number; maxW?: number};
export const YELLOW = '#FFD23F', RED = '#FF5A4E', GOLD = '#FFC93C';
const HARAKAT = /[ً-ْـ]/g;
export const norm = (w: string) => w.replace(HARAKAT, '').replace(/[.…!،,:؟?]/g, '');
export const clean = (w: string) => w.replace(/\.\.\.|…/g, '').replace(/[.،,:]$/g, '');

export const groupWords = (words: Word[], offset: number, opts: {gold?: string[]; big?: string[]} = {}): Group[] => {
  const out: Group[] = []; let cur: Word[] = [];
  const flush = () => { if (cur.length) out.push({words: cur, s: cur[0].s, e: cur[cur.length - 1].e}); cur = []; };
  const gold = new Set((opts.gold ?? []).map(norm)), big = new Set((opts.big ?? []).map(norm));
  for (const w0 of words) {
    const w = {...w0, s: w0.s + offset, e: w0.e + offset};
    const n = norm(w.w);
    if (gold.has(n) && cur.length && !gold.has(norm(cur[0].w))) flush();
    if (big.has(n)) { flush(); cur.push(w); flush(); out[out.length - 1].style = 'big'; continue; }
    cur.push(w);
    const end = /[.…!،:]$/.test(w.w) || w.w.endsWith('...');
    const short = cur.reduce((a, x) => a + norm(x.w).length, 0);
    if (!gold.has(n) && (end || cur.length >= 3 || (cur.length >= 2 && short > 11))) flush();
  }
  flush();
  for (const g of out) if (g.words.every((w) => gold.has(norm(w.w)))) g.style = 'gold';
  // each group stays up until the next one starts (no empty gaps under 0.6 s)
  for (let i = 0; i < out.length; i++) {
    const nx = out[i + 1];
    out[i].e = nx ? (nx.s - out[i].e < 0.6 ? nx.s : out[i].e + 0.25) : 1e9;
  }
  return out;
};

export const Captions: React.FC<{t: number; groups: Group[]; colors: Record<string, string>; y?: number; x?: number}> = ({t, groups, colors, y = 1250, x = 460}) => {
  const g = groups.find((x) => t >= x.s - 0.03 && t < x.e);
  if (!g) return null;
  const dt = t - g.s + 0.03;
  const pop = dt < 0.14 ? 0.82 + 0.28 * easeOut(clamp(dt / 0.14)) : 1.1 - 0.1 * clamp((dt - 0.14) / 0.08);
  const style = g.style;
  let fs = g.fs ?? (style === 'big' ? 132 : style === 'gold' ? 116 : 96);
  const cx = g.x ?? x; // keep cx + half width <= 918 (right 15% clear)
  const cuts = [0, ...(g.br === undefined ? [] : Array.isArray(g.br) ? g.br : [g.br]), g.words.length];
  const lines = cuts.slice(1).map((c, i) => g.words.slice(cuts[i], c));
  const estW = g.w100 !== undefined ? (g.w100 / 100 + 0.2) * fs
    : Math.max(...lines.map((ws) => ws.reduce((a, w) => a + norm(w.w).length + 1, 0))) * fs * 0.52;
  const maxW = g.maxW ?? 2 * Math.min(cx - 70, 900 - cx);
  if (estW > maxW) fs *= maxW / estW; // stays inside the frame and out of the right 15%
  const lh = fs * 1.34;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF1A8" /><stop offset="0.45" stopColor={GOLD} /><stop offset="1" stopColor="#E08A12" />
        </linearGradient>
      </defs>
      <g transform={`translate(${cx} ${y}) scale(${pop})`}>
        {lines.map((ws, li) => (
          <text key={li} x={0} y={(li - (lines.length - 1) / 2) * lh} textAnchor="middle" direction="rtl" fontFamily="Cairo" fontWeight={900} fontSize={fs}
            stroke="#000" strokeWidth={fs * 0.2} strokeLinejoin="round" paintOrder="stroke" fill="#fff"
            style={{filter: 'drop-shadow(0 8px 0 rgba(0,0,0,0.35))'}}>
            {ws.map((w, i) => {
              const active = t >= w.s - 0.02;
              const c = style === 'gold' ? 'url(#gold)' : w.c ?? colors[norm(w.w)] ?? '#fff';
              return <tspan key={i} fill={c} opacity={style === 'gold' && !active ? 0 : 1}>{clean(w.w)}{i < ws.length - 1 ? ' ' : ''}</tspan>;
            })}
          </text>
        ))}
      </g>
    </svg>
  );
};
