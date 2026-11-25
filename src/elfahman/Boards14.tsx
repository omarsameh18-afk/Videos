// The 20 boards of الفهمان #14 "أقدم واحد زوّغ من الشغل" — all drawn in code (0 picture credits).
// Each board is a 1080x1920 scene; only the band y 250..853 shows inside the wall board (860 x 480).
// Props: t = seconds since the board started, d = board length (s), ev = word onsets relative to the board start.
// Recurring characters (same look every time): Seba (worker: white kilt, short black hair, tan skin, big eyes, blue bead
// collar), the scribe (shaved head, reed pen, limestone slab), the slab (cracked cream limestone, black rows, red absences).
import React from 'react';
import {clamp, easeIn, easeInOut, easeOut, popIn, rand, seg, wobble} from './lib/anim';

export type BoardProps = {t: number; d: number; ev: number[]};
const W = 1080;
const H = 1920;
export const YEL = '#FFD23F';
export const RED = '#FF5A4E';
export const INK = '#1b1410';
export const SKIN = '#C98B5E';
const STONE = '#EFE2C2';
export const AR: React.CSSProperties = {fontFamily: 'Cairo', fontWeight: 900, direction: 'rtl'};
export const CY = 560; // vertical middle of the visible band
export const FLOOR = 800;

// ------------------------------------------------------------------ shared scene + text
export const Scene: React.FC<{bg: string; children?: React.ReactNode; html?: React.ReactNode}> = ({bg, children, html}) => (
  <div style={{position: 'absolute', inset: 0, background: bg, overflow: 'hidden'}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>{children}</svg>
    {html}
  </div>
);
export const Txt: React.FC<{x: number; y: number; s?: number; size?: number; color?: string; stroke?: number; rot?: number; children: React.ReactNode; o?: number}> = ({x, y, s = 1, size = 70, color = '#fff', stroke = 10, rot = 0, children, o = 1}) => (s <= 0 ? null : (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: o, ...AR, fontSize: size, color,
    WebkitTextStroke: `${stroke}px ${INK}`, paintOrder: 'stroke fill', whiteSpace: 'nowrap', lineHeight: 1.2}}>{children}</div>
));
const Pill: React.FC<{x: number; y: number; s?: number; size?: number; bg?: string; color?: string; children: React.ReactNode; rot?: number}> = ({x, y, s = 1, size = 60, bg = YEL, color = INK, children, rot = 0}) => (s <= 0 ? null : (
  <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, ...AR, fontSize: size, color, background: bg,
    padding: '0px 34px 10px', borderRadius: 999, border: `7px solid ${INK}`, boxShadow: `0 10px 0 ${INK}`, whiteSpace: 'nowrap', lineHeight: 1.45}}>{children}</div>
));
export const Dust: React.FC<{t: number; color?: string; n?: number; o?: number}> = ({t, color = '#fff', n = 22, o = 0.25}) => (
  <g opacity={o}>
    {Array.from({length: n}, (_, i) => (
      <circle key={i} cx={rand(i + 1) * W + Math.sin(t * 0.5 + i) * 20} cy={260 + rand(i + 40) * 580 + Math.cos(t * 0.4 + i * 2) * 16} r={3 + rand(i + 80) * 7} fill={color} />
    ))}
  </g>
);
export const Ground: React.FC<{c?: string; o?: number}> = ({c = '#000', o = 0.18}) => <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill={c} opacity={o} />;
export const SAND = 'linear-gradient(180deg,#FFD9A0 0%,#F4B66A 60%,#D98E45 100%)';
const DUSK = 'linear-gradient(180deg,#5B6FD6 0%,#F49A6A 70%,#E5774A 100%)';
const NIGHT = 'radial-gradient(ellipse at 50% 35%,#36406E 0%,#1A1F3A 60%,#0D1020 100%)';

// ------------------------------------------------------------------ the slab (ostracon): cracked cream limestone
// rows: marks per row; red: rows with a red mark; glow: row whose red mark glows; empty: an empty row (beat 19)
export const Slab: React.FC<{x: number; y: number; s: number; t?: number; rows?: number; red?: number[]; glow?: number; empty?: number; rot?: number; label?: string; labelK?: number}> =
({x, y, s, t = 0, rows = 6, red = [2], glow = -1, empty = -1, rot = 0, label, labelK = 0}) => {
  const w = 420, h = 300;
  const path = 'M -205 -128 Q -150 -152 -60 -140 L 40 -150 Q 150 -146 202 -118 L 214 -20 Q 206 60 196 118 Q 120 150 10 140 L -110 148 Q -190 142 -208 104 L -214 10 Z';
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={path} transform="translate(10 14)" fill={INK} opacity={0.3} />
      <path d={path} fill={STONE} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <path d="M -150 -100 Q -120 -60 -150 -20 M 60 -140 L 80 -100 L 66 -70 M 150 90 L 120 120 L 130 140" stroke="#B89F73" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M -190 -40 Q -170 0 -195 60" stroke="#fff" strokeWidth={8} opacity={0.35} fill="none" strokeLinecap="round" />
      {Array.from({length: rows}, (_, r) => {
        const ry = -h / 2 + 40 + r * ((h - 70) / (rows - 1));
        if (r === empty) return <line key={r} x1={-150} y1={ry} x2={150} y2={ry} stroke="#B89F73" strokeWidth={4} strokeDasharray="12 12" />;
        return (
          <g key={r}>
            {Array.from({length: 7}, (_, k) => {
              const gx = 150 - k * 42 - (r % 2) * 8, gw = 14 + rand(r * 9 + k) * 18;
              const kind = Math.floor(rand(r * 13 + k * 7) * 3);
              return kind === 0 ? <rect key={k} x={gx - gw} y={ry - 9} width={gw} height={7} rx={3} fill={INK} />
                : kind === 1 ? <path key={k} d={`M ${gx - gw} ${ry + 6} Q ${gx - gw / 2} ${ry - 16} ${gx} ${ry + 2}`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
                : <circle key={k} cx={gx - 8} cy={ry - 2} r={6} fill={INK} />;
            })}
            {red.includes(r) && (
              <g transform={`translate(${-170} ${ry})`}>
                {glow === r && <circle r={34 + 6 * Math.sin(t * 6)} fill={RED} opacity={0.3 + 0.15 * Math.sin(t * 6)} />}
                <path d="M -18 -2 Q 0 -22 18 -4 Q 2 6 -10 16" stroke={RED} strokeWidth={9} fill="none" strokeLinecap="round" />
              </g>
            )}
          </g>
        );
      })}
      {label && labelK > 0 && (
        <g transform={`translate(-60 ${-h / 2 + 40 + (red[0] ?? 2) * ((h - 70) / (rows - 1))}) scale(${labelK})`}>
          <rect x={-70} y={-26} width={140} height={46} rx={10} fill="#fff" opacity={0.6} />
        </g>
      )}
    </g>
  );
};

// ------------------------------------------------------------------ ancient Egyptian worker (Seba is the default look)
type WPose = 'stand' | 'carry' | 'fist' | 'sit' | 'belly' | 'walk' | 'ouch' | 'peek' | 'stir';
type Expr = 'smile' | 'guilty' | 'ouch' | 'sad' | 'shout' | 'stare' | 'grin';
export const Worker: React.FC<{x: number; y: number; s?: number; pose?: WPose; expr?: Expr; t?: number; band?: string; skin?: string; flip?: boolean; seba?: boolean; patch?: boolean; look?: number; o?: number; hairless?: boolean}> =
({x, y, s = 1, pose = 'stand', expr = 'smile', t = 0, band, skin = SKIN, flip = false, seba = false, patch = false, look = 0, o = 1}) => {
  const step = pose === 'walk' ? Math.sin(t * 9) : 0;
  const bob = pose === 'walk' || pose === 'carry' ? Math.abs(Math.sin(t * 9)) * -6 : 0;
  const sit = pose === 'sit';
  const legY = sit ? -40 : -95;
  const arm = (side: number, kind: string) => {
    const sx = side * 40, sy = -150;
    const p: Record<string, string> = {
      down: `M ${sx} ${sy} Q ${side * 56} -115 ${side * 52} -88`,
      up: `M ${sx} ${sy} Q ${side * 70} -190 ${side * 44} -232`,
      fist: `M ${sx} ${sy} Q ${side * 66} -200 ${side * 58} -250`,
      belly: `M ${sx} ${sy} Q ${side * 60} -110 ${side * 6} -112`,
      cross: `M ${sx} ${sy} Q ${side * 58} -118 ${-side * 30} -126`,
      stir: `M ${sx} ${sy} Q ${side * 70} -130 ${side * 96} -150`,
      fwd: `M ${sx} ${sy} Q ${side * 60} -150 ${side * 82} -168`,
    };
    return <path d={p[kind]} stroke={skin} strokeWidth={22} fill="none" strokeLinecap="round" />;
  };
  const armsK: [string, string] = pose === 'carry' ? ['up', 'up'] : pose === 'fist' ? ['down', 'fist'] : pose === 'belly' ? ['belly', 'belly']
    : sit ? ['cross', 'cross'] : pose === 'stir' ? ['down', 'stir'] : pose === 'peek' ? ['fwd', 'fwd'] : ['down', 'down'];
  const eyeY = -228, ex = 18 + look * 6;
  const pupil = expr === 'guilty' ? 8 : expr === 'stare' ? 0 : look * 6;
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${flip ? -s : s} ${s})`} opacity={o}>
      <ellipse cx={0} cy={2} rx={60} ry={10} fill={INK} opacity={0.2} />
      {/* legs */}
      {sit ? (
        <path d="M -40 -40 Q -10 -8 40 -18 M 40 -40 Q 10 -8 -40 -18" stroke={skin} strokeWidth={24} fill="none" strokeLinecap="round" />
      ) : pose === 'ouch' ? (
        <g><line x1={-14} y1={legY} x2={-18} y2={0} stroke={skin} strokeWidth={22} strokeLinecap="round" /><path d={`M 14 ${legY} Q 40 -50 26 -40`} stroke={skin} strokeWidth={22} fill="none" strokeLinecap="round" /></g>
      ) : (
        <g>
          <line x1={-14} y1={legY} x2={-16 - step * 18} y2={0} stroke={skin} strokeWidth={22} strokeLinecap="round" />
          <line x1={14} y1={legY} x2={16 + step * 18} y2={0} stroke={skin} strokeWidth={22} strokeLinecap="round" />
        </g>
      )}
      {/* back arm */}
      {arm(-1, armsK[0])}
      {/* torso */}
      <path d="M -40 -165 Q -46 -120 -36 -96 L 36 -96 Q 46 -120 40 -165 Q 0 -178 -40 -165 Z" fill={skin} stroke={INK} strokeWidth={6} />
      {seba && <path d="M -30 -164 Q 0 -140 30 -164" stroke="#2F7FD8" strokeWidth={10} fill="none" />}
      {seba && [-20, -8, 4, 16].map((bx, i) => <circle key={i} cx={bx + 2} cy={-152 + Math.abs(bx + 2) * 0.12} r={5} fill="#6FC3FF" stroke={INK} strokeWidth={2} />)}
      {/* white kilt */}
      <path d={sit ? 'M -46 -100 L 46 -100 L 54 -46 L -54 -46 Z' : 'M -42 -104 L 42 -104 L 54 -46 Q 0 -38 -54 -46 Z'} fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <line x1={-42} y1={-98} x2={42} y2={-98} stroke="#E2D6B8" strokeWidth={8} />
      {!sit && <path d="M 0 -96 L 10 -48" stroke="#D9CFB4" strokeWidth={4} />}
      {/* front arm */}
      {arm(1, armsK[1])}
      {(pose === 'fist') && <circle cx={58} cy={-256} r={16} fill={skin} stroke={INK} strokeWidth={5} />}
      {/* head */}
      <circle cx={0} cy={-218} r={46} fill={skin} stroke={INK} strokeWidth={7} />
      <path d="M -46 -222 Q -50 -272 0 -270 Q 50 -272 46 -222 Q 34 -246 0 -248 Q -34 -246 -46 -222 Z" fill="#17120f" />
      {band && <path d="M -46 -236 Q 0 -256 46 -236" stroke={band} strokeWidth={9} fill="none" />}
      {/* eyes: big and expressive */}
      {patch ? (
        <g>
          <ellipse cx={ex} cy={eyeY} rx={15} ry={17} fill="#fff" stroke={INK} strokeWidth={4} />
          <circle cx={ex + pupil * 0.5} cy={eyeY + 2} r={7} fill={INK} />
          <rect x={-40} y={eyeY - 18} width={36} height={34} rx={8} fill="#fff" stroke={INK} strokeWidth={4} transform={`rotate(-8 -22 ${eyeY})`} />
          <path d="M -48 -250 L 40 -206" stroke="#F3EBDD" strokeWidth={8} />
          <path d={`M -34 ${eyeY - 6} L -12 ${eyeY + 8} M -12 ${eyeY - 6} L -34 ${eyeY + 8}`} stroke={RED} strokeWidth={4} opacity={0.7} />
        </g>
      ) : (
        [-1, 1].map((sd) => (
          <g key={sd}>
            <ellipse cx={sd * 18} cy={eyeY} rx={15} ry={expr === 'ouch' ? 4 : expr === 'stare' ? 19 : 17} fill="#fff" stroke={INK} strokeWidth={4} />
            {expr !== 'ouch' && <circle cx={sd * 18 + pupil * 0.6} cy={eyeY + (expr === 'guilty' ? 4 : 2)} r={expr === 'stare' ? 5 : 7.5} fill={INK} />}
            {expr === 'guilty' && <path d={`M ${sd * 18 - 14} ${eyeY - 16} L ${sd * 18 + 14} ${eyeY - 10 * (sd > 0 ? 1 : 1.6)}`} stroke={INK} strokeWidth={4} />}
            {expr === 'shout' && <path d={`M ${sd * 30} ${eyeY - 22} L ${sd * 8} ${eyeY - 14}`} stroke={INK} strokeWidth={5} />}
          </g>
        ))
      )}
      {/* mouth */}
      {expr === 'smile' || expr === 'grin' ? <path d="M -16 -194 Q 0 -180 16 -194" stroke={INK} strokeWidth={5} fill={expr === 'grin' ? '#fff' : 'none'} strokeLinecap="round" />
        : expr === 'guilty' ? <path d="M -14 -190 Q -4 -196 4 -190 Q 10 -186 16 -192" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        : expr === 'ouch' ? <ellipse cx={0} cy={-190} rx={12} ry={11} fill="#5a1f14" stroke={INK} strokeWidth={4} />
        : expr === 'shout' ? <ellipse cx={0} cy={-190} rx={14} ry={13} fill="#5a1f14" stroke={INK} strokeWidth={4} />
        : expr === 'stare' ? <line x1={-10} y1={-190} x2={10} y2={-190} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        : <path d="M -14 -186 Q 0 -198 14 -186" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />}
      <circle cx={-46} cy={-216} r={8} fill={skin} stroke={INK} strokeWidth={4} />
    </g>
  );
};
const LOOK = [{band: '#E05A3A', skin: '#B97A4E'}, {band: '#2FA36B', skin: '#C98B5E'}, {band: '#E0A53A', skin: '#A86B43'}, {band: '#7A5AE0', skin: '#D49A6A'},
  {band: '#3A8FE0', skin: '#B5774A'}, {band: '#E05A9A', skin: '#C08050'}, {band: '#2FA3A3', skin: '#A9714A'}];

// the scribe: seated, shaved head, reed pen over a limestone slab
export const Scribe: React.FC<{x: number; y: number; s?: number; t?: number; writing?: number}> = ({x, y, s = 1, t = 0, writing = 1}) => {
  const pen = writing * Math.sin(t * 11) * 10;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={110} ry={14} fill={INK} opacity={0.2} />
      <path d="M -90 -10 Q -60 -60 0 -60 Q 60 -60 90 -10 Z" fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d="M -70 -20 Q -20 -4 70 -24" stroke={SKIN} strokeWidth={22} fill="none" strokeLinecap="round" />
      <path d="M -42 -170 Q -50 -110 -40 -62 L 40 -62 Q 50 -110 42 -170 Q 0 -184 -42 -170 Z" fill={SKIN} stroke={INK} strokeWidth={6} />
      <Slab x={34} y={-74} s={0.36} rot={-12} rows={5} red={[]} />
      <path d={`M -40 -150 Q -66 -110 -20 -96`} stroke={SKIN} strokeWidth={20} fill="none" strokeLinecap="round" />
      <path d={`M 40 -150 Q 70 -120 ${30 + pen} -104`} stroke={SKIN} strokeWidth={20} fill="none" strokeLinecap="round" />
      <line x1={30 + pen} y1={-104} x2={58 + pen} y2={-150} stroke="#8A6A2E" strokeWidth={7} strokeLinecap="round" />
      <circle cx={0} cy={-222} r={48} fill={SKIN} stroke={INK} strokeWidth={7} />
      <ellipse cx={-16} cy={-250} rx={20} ry={10} fill="#fff" opacity={0.35} />
      {[-1, 1].map((sd) => <g key={sd}><path d={`M ${sd * 18 - 11} -226 Q ${sd * 18} -218 ${sd * 18 + 11} -226`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" /></g>)}
      <path d="M -24 -250 L -8 -246 M 8 -246 L 24 -250" stroke={INK} strokeWidth={4} />
      <path d="M -10 -196 Q 0 -192 10 -196" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <circle cx={-48} cy={-220} r={8} fill={SKIN} stroke={INK} strokeWidth={4} />
    </g>
  );
};

// ------------------------------------------------------------------ small props
export const StoneBlock: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-70} y={-46} width={140} height={92} rx={8} fill="#D8B77A" stroke={INK} strokeWidth={7} />
    <path d="M -70 -10 L 70 -18 M -20 -46 L -26 46" stroke="#B48F55" strokeWidth={5} />
  </g>
);
export const Cliff: React.FC<{t: number}> = ({t}) => (
  <g>
    <path d={`M 0 ${FLOOR} L 0 330 Q 120 290 260 320 Q 420 270 560 300 Q 760 260 900 300 Q 1000 290 1080 320 L 1080 ${FLOOR} Z`} fill="#C9874A" stroke={INK} strokeWidth={8} />
    <path d="M 0 420 Q 300 400 540 430 Q 800 410 1080 440" stroke="#A86A36" strokeWidth={8} fill="none" />
    {[180, 470, 820].map((dx, i) => (
      <g key={i} transform={`translate(${dx} 580)`}>
        <rect x={-62} y={-30} width={124} height={170} fill="#3B2414" stroke={INK} strokeWidth={8} />
        <rect x={-84} y={-58} width={168} height={32} fill="#E0B070" stroke={INK} strokeWidth={7} />
        <circle cx={0} cy={-42} r={9} fill={YEL} stroke={INK} strokeWidth={3} />
      </g>
    ))}
    <circle cx={950} cy={340 + Math.sin(t) * 4} r={46} fill="#FFF1B8" opacity={0.85} />
  </g>
);
const Scorpion: React.FC<{x: number; y: number; s?: number; t: number; nip?: number}> = ({x, y, s = 1, t, nip = 0}) => {
  const leg = Math.sin(t * 30) * 6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[-1, 1].map((sd) => [0, 1, 2].map((k) => (
        <path key={`${sd}${k}`} d={`M ${-20 + k * 20} 0 L ${-28 + k * 20 + (k % 2 ? leg : -leg)} ${sd * 26} L ${-34 + k * 20} ${sd * 34}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      )))}
      <ellipse cx={0} cy={0} rx={42} ry={20} fill="#2B1D12" stroke={INK} strokeWidth={4} />
      <path d={`M -40 0 Q -80 -10 -84 -50 Q -84 ${-84 - nip * 10} ${-50 + nip * 20} ${-90 - nip * 6}`} stroke="#2B1D12" strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d={`M ${-50 + nip * 20} ${-90 - nip * 6} l 14 6 l -6 10`} fill={RED} stroke={INK} strokeWidth={3} />
      {[-1, 1].map((sd) => <g key={sd}><path d={`M 36 ${sd * 8} Q 60 ${sd * 22} 74 ${sd * 14}`} stroke="#2B1D12" strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d={`M 70 ${sd * 6} l 18 ${sd * 2} l -10 ${sd * 16} Z`} fill="#2B1D12" stroke={INK} strokeWidth={3} /></g>)}
      <circle cx={30} cy={-6} r={4} fill="#fff" /><circle cx={30} cy={6} r={4} fill="#fff" />
    </g>
  );
};
const Burst: React.FC<{x: number; y: number; s: number; color?: string}> = ({x, y, s, color = YEL}) => {
  if (s <= 0) return null;
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, r = i % 2 ? 60 : 100; pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`); }
  return <polygon transform={`translate(${x} ${y}) scale(${s})`} points={pts.join(' ')} fill={color} stroke={INK} strokeWidth={7} strokeLinejoin="round" />;
};
const Jar: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={120} ry={14} fill={INK} opacity={0.2} />
    <path d="M -60 -260 L 60 -260 Q 70 -230 110 -180 Q 150 -100 110 -20 Q 80 6 0 6 Q -80 6 -110 -20 Q -150 -100 -110 -180 Q -70 -230 -60 -260 Z" fill="#C06A3A" stroke={INK} strokeWidth={8} />
    <path d="M -110 -150 Q 0 -120 110 -150" stroke="#8E4626" strokeWidth={8} fill="none" />
    <path d="M -90 -100 Q -100 -60 -80 -30" stroke="#fff" strokeWidth={10} opacity={0.3} fill="none" strokeLinecap="round" />
    {/* foam */}
    {Array.from({length: 9}, (_, i) => (
      <circle key={i} cx={-60 + i * 15} cy={-262 - Math.abs(Math.sin(t * 3 + i)) * 14} r={22 + 4 * Math.sin(t * 4 + i * 2)} fill="#FFF6DD" stroke={INK} strokeWidth={4} />
    ))}
    {Array.from({length: 7}, (_, i) => {
      const u = ((t * 0.7 + i / 7) % 1);
      return <circle key={i} cx={-40 + rand(i) * 80 + Math.sin(t * 3 + i) * 8} cy={-290 - u * 150} r={8 + rand(i + 3) * 10} fill="#FFF6DD" stroke={INK} strokeWidth={3} opacity={1 - u} />;
    })}
  </g>
);
const Boss: React.FC<{x: number; y: number; s?: number; t: number}> = ({x, y, s = 1, t}) => {
  const step = Math.sin(t * 9);
  return (
    <g transform={`translate(${x} ${y + Math.abs(step) * -5}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={70} ry={12} fill={INK} opacity={0.2} />
      <line x1={-16} y1={-110} x2={-18 - step * 18} y2={0} stroke="#B07A50" strokeWidth={26} strokeLinecap="round" />
      <line x1={16} y1={-110} x2={18 + step * 18} y2={0} stroke="#B07A50" strokeWidth={26} strokeLinecap="round" />
      <path d="M -54 -200 Q -60 -140 -50 -110 L 50 -110 Q 60 -140 54 -200 Q 0 -214 -54 -200 Z" fill="#B07A50" stroke={INK} strokeWidth={7} />
      <path d="M -52 -122 L 52 -122 L 66 -40 L -66 -40 Z" fill="#fff" stroke={INK} strokeWidth={7} />
      <path d="M -46 -200 Q 0 -160 46 -200" stroke={YEL} strokeWidth={18} fill="none" />
      <path d="M -46 -200 Q 0 -160 46 -200" stroke={INK} strokeWidth={4} fill="none" />
      <line x1={70} y1={-260} x2={74} y2={0} stroke="#7A4A20" strokeWidth={10} strokeLinecap="round" />
      <path d="M 54 -190 Q 80 -170 72 -150" stroke="#B07A50" strokeWidth={22} fill="none" strokeLinecap="round" />
      <circle cx={0} cy={-256} r={52} fill="#B07A50" stroke={INK} strokeWidth={7} />
      <path d="M -56 -262 Q -60 -320 0 -318 Q 60 -320 56 -262 L 66 -200 L 48 -206 L 50 -250 Q 0 -280 -50 -250 L -48 -206 L -66 -200 Z" fill="#3A6FD8" stroke={INK} strokeWidth={6} />
      <path d="M -54 -290 L 54 -290 M -58 -270 L 58 -270" stroke={YEL} strokeWidth={7} />
      {[-1, 1].map((sd) => <g key={sd}><circle cx={sd * 20} cy={-256} r={6} fill={INK} /><path d={`M ${sd * 32} -276 L ${sd * 8} -270`} stroke={INK} strokeWidth={5} /></g>)}
      <path d="M -14 -228 Q 0 -222 14 -228" stroke={INK} strokeWidth={5} fill="none" />
    </g>
  );
};
const Case: React.FC<{x: number; y: number; t: number; light: number}> = ({x, y, t, light}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M -60 -440 L 60 -440 L 260 60 L -260 60 Z`} fill="#FFF6C8" opacity={0.18 + 0.2 * light} />
    <rect x={-170} y={-10} width={340} height={70} fill="#5A3A22" stroke={INK} strokeWidth={8} />
    <rect x={-150} y={40} width={300} height={200} fill="#6B4528" stroke={INK} strokeWidth={8} />
    <Slab x={0} y={-130} s={0.58} t={t} red={[1, 3]} glow={-1} />
    <rect x={-190} y={-290} width={380} height={290} fill="#BFEFFF" opacity={0.22} stroke={INK} strokeWidth={8} />
    <path d="M -150 -270 L -90 -40 M -110 -270 L -70 -120" stroke="#fff" strokeWidth={10} opacity={0.5} strokeLinecap="round" />
    <rect x={-190} y={-306} width={380} height={22} fill="#8FA8B8" stroke={INK} strokeWidth={6} />
  </g>
);
const Sack: React.FC<{x: number; y: number; s?: number; fill: number}> = ({x, y, s = 1, fill}) => {
  const h = 120 + 140 * fill;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={140} ry={14} fill={INK} opacity={0.2} />
      <path d={`M -120 0 Q -150 ${-h * 0.5} -100 ${-h} L -60 ${-h - 30} L 60 ${-h - 30} L 100 ${-h} Q 150 ${-h * 0.5} 120 0 Z`} fill="#D9B884" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d={`M -64 ${-h - 30} Q 0 ${-h - 60} 64 ${-h - 30}`} fill="#E8C85A" stroke={INK} strokeWidth={6} />
      {Array.from({length: 5}, (_, i) => (
        <g key={i} transform={`translate(${-48 + i * 24} ${-h - 46}) rotate(${-20 + i * 10})`}>
          <line x1={0} y1={0} x2={0} y2={-46} stroke="#C9A23A" strokeWidth={4} />
          {[0, 1, 2].map((k) => <ellipse key={k} cx={0} cy={-46 - k * 12} rx={6} ry={9} fill="#F2C94C" stroke={INK} strokeWidth={2} />)}
        </g>
      ))}
      <path d={`M -60 ${-h * 0.5} Q 0 ${-h * 0.42} 60 ${-h * 0.5}`} stroke="#B8945A" strokeWidth={6} fill="none" />
    </g>
  );
};
const Clock: React.FC<{x: number; y: number; r: number; spin: number}> = ({x, y, r, spin}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#fff" stroke={INK} strokeWidth={r * 0.12} />
    {Array.from({length: 12}, (_, i) => <line key={i} x1={0} y1={-r * 0.8} x2={0} y2={-r * 0.66} stroke={INK} strokeWidth={r * 0.06} transform={`rotate(${i * 30})`} />)}
    <line x1={0} y1={0} x2={Math.sin(spin) * r * 0.7} y2={-Math.cos(spin) * r * 0.7} stroke={INK} strokeWidth={r * 0.08} strokeLinecap="round" />
    <line x1={0} y1={0} x2={Math.sin(spin / 12) * r * 0.45} y2={-Math.cos(spin / 12) * r * 0.45} stroke={RED} strokeWidth={r * 0.1} strokeLinecap="round" />
    <circle r={r * 0.08} fill={INK} />
  </g>
);
export const Stamp: React.FC<{x: number; y: number; dt: number; text: string; color?: string; size?: number; rot?: number}> = ({x, y, dt, text, color = RED, size = 64, rot = -10}) => {
  if (dt <= 0) return null;
  const sc = dt < 0.12 ? 1.9 - 0.9 * easeIn(dt / 0.12) : 1 + wobble(dt - 0.12, 3, 10) * 0.05;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${sc})`, opacity: clamp(dt / 0.06),
      ...AR, fontSize: size, color, border: `9px solid ${color}`, borderRadius: 18, padding: '0 26px 8px', background: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', lineHeight: 1.35}}>{text}</div>
  );
};
const Temple: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -420 0 L -380 -380 L 380 -380 L 420 0 Z" fill="#E9C98E" stroke={INK} strokeWidth={9} />
    <rect x={-400} y={-420} width={800} height={50} fill="#D8AE66" stroke={INK} strokeWidth={8} />
    <path d="M -400 -405 L 400 -405" stroke="#2F7FD8" strokeWidth={10} />
    {[-300, -180, -60, 60, 180, 300].map((cx, i) => (
      <g key={i}>
        <rect x={cx - 34} y={-370} width={68} height={370} fill="#F4DDB0" stroke={INK} strokeWidth={7} />
        <path d={`M ${cx - 48} -370 Q ${cx} -400 ${cx + 48} -370 Z`} fill="#7FBF6A" stroke={INK} strokeWidth={6} />
        <line x1={cx - 14} y1={-330} x2={cx - 14} y2={-20} stroke="#D9BC86" strokeWidth={6} />
      </g>
    ))}
  </g>
);
const Pastry: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <g transform={`translate(${x} ${y})`}>
    {k % 2 ? <path d="M -40 10 Q -46 -30 0 -34 Q 46 -30 40 10 Z" fill="#E8A44A" stroke={INK} strokeWidth={5} /> : <circle r={30} cy={-10} fill="#D98E3A" stroke={INK} strokeWidth={5} />}
    <path d={k % 2 ? 'M -22 -14 Q 0 -24 22 -14' : 'M -14 -16 Q 0 -4 14 -16'} stroke="#FFF1C8" strokeWidth={5} fill="none" strokeLinecap="round" />
  </g>
);
const Flag: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <line x1={-62} y1={-50} x2={-62} y2={90} stroke={INK} strokeWidth={8} strokeLinecap="round" />
    <rect x={-60} y={-50} width={120} height={30} fill="#CE1126" stroke={INK} strokeWidth={4} />
    <rect x={-60} y={-20} width={120} height={30} fill="#fff" stroke={INK} strokeWidth={4} />
    <rect x={-60} y={10} width={120} height={30} fill="#111" stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={-5} r={9} fill="#C09300" />
  </g>
);
const ArrowDown: React.FC<{x: number; y: number; s: number; color?: string}> = ({x, y, s, color = YEL}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -24 -70 L 24 -70 L 24 0 L 56 0 L 0 60 L -56 0 L -24 0 Z" fill={color} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
  </g>
));
const SendIcon: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <circle r={70} fill="#2F9BFF" stroke={INK} strokeWidth={8} />
    <path d="M -36 -4 L 38 -30 L 14 38 L 4 8 Z" fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  </g>
));
const Pen: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-14} y={-120} width={28} height={130} rx={6} fill="#8A6A2E" stroke={INK} strokeWidth={6} />
    <path d="M -14 10 L 0 44 L 14 10 Z" fill="#3A2A14" stroke={INK} strokeWidth={5} />
  </g>
));
export const Rays: React.FC<{x: number; y: number; t: number; color?: string; o?: number}> = ({x, y, t, color = '#FFE98A', o = 0.35}) => (
  <g transform={`translate(${x} ${y}) rotate(${t * 12})`} opacity={o}>
    {Array.from({length: 16}, (_, i) => <path key={i} d="M 0 0 L -60 -900 L 60 -900 Z" fill={color} transform={`rotate(${i * 22.5})`} />)}
  </g>
);

// ================================================================== 1 — hook: the slab slides on with a pop, a red mark glows, Seba peeks
// t < 0 is used by board 20 (loop): the slab slides in from the right and lands exactly at t = 0.
export const B1: React.FC<BoardProps> = ({t, ev}) => {
  const enter = t < 0 ? easeIn(clamp(-t / 0.55)) : 0;
  const pop = t >= 0 ? 1 + 0.05 * Math.exp(-t * 7) * Math.cos(t * 22) : 1;
  const peek = t < 0 ? 0 : 0.55 + 0.45 * Math.sin(t * 2.2 - 0.6);
  const duck = ev[0] !== undefined ? seg(t, ev[0], ev[0] + 0.15) * (1 - seg(t, ev[0] + 0.5, ev[0] + 0.8)) : 0;
  const sx = 540 + enter * 760;
  return (
    <Scene bg={SAND}>
      <Rays x={540} y={CY} t={t} />
      <Dust t={t} />
      <g opacity={1 - enter}>
        <Worker x={sx + 255 + peek * 40} y={CY + 190 + duck * 40} s={1.0} seba expr="guilty" pose="peek" t={t} flip look={-1} />
      </g>
      <g transform={`translate(${sx} ${CY}) scale(${pop}) translate(${-sx} ${-CY})`}>
        <Slab x={sx} y={CY} s={1.05} t={t} red={[2]} glow={2} rot={-3} />
      </g>
      <Ground o={0.12} />
    </Scene>
  );
};

// ================================================================== 2 — Seba carries a stone in front of the tomb cliff; "+٣٠٠٠ سنة"
export const B2: React.FC<BoardProps> = ({t, ev}) => {
  const x = 860 - t * 120;
  return (
    <Scene bg={SAND} html={<>
      <Txt x={x - 130} y={FLOOR - 120} size={52} s={popIn(t - ev[0])} color={YEL} stroke={8}>سِبا</Txt>
      <Pill x={540} y={300} size={52} s={popIn(t - ev[1])}>+٣٠٠٠ سنة</Pill>
    </>}>
      <Cliff t={t} />
      <Worker x={x} y={FLOOR - 40} s={0.95} seba pose="carry" t={t} flip expr="smile" />
      <StoneBlock x={x} y={FLOOR - 40 - 290 + Math.abs(Math.sin(t * 9)) * -6} s={0.9} />
    </Scene>
  );
};

// ================================================================== 3 — a row of workers with a gap: Seba's dotted outline
export const B3: React.FC<BoardProps> = ({t, ev}) => {
  const gap = seg(t, ev[0] - 0.1, ev[0] + 0.25);
  const xs = [140, 300, 460, 620, 780, 940];
  return (
    <Scene bg={SAND} html={<Txt x={620} y={420} size={110} color={RED} s={popIn(t - ev[0] - 0.15)} rot={8}>؟</Txt>}>
      <Cliff t={t} />
      <rect x={0} y={FLOOR - 30} width={W} height={40} fill="#B37845" />
      {xs.map((x, i) => i === 3 ? (
        <g key={i} opacity={1 - gap * 0.0}>
          <g opacity={1 - gap}><Worker x={x} y={FLOOR - 10} s={0.8} seba t={t} /></g>
          <g opacity={gap}>
            <path d="M 0 0 L 0 -95 M 0 -95 Q -46 -120 -40 -165 Q 0 -178 40 -165 Q 46 -120 0 -95 M 0 -170 A 46 46 0 1 1 0.1 -170" transform={`translate(${x} ${FLOOR - 10}) scale(0.8)`}
              stroke="#fff" strokeWidth={8} strokeDasharray="14 12" fill="none" strokeLinecap="round" />
          </g>
        </g>
      ) : (
        <Worker key={i} x={x} y={FLOOR - 10 + Math.sin(t * 3 + i) * 3} s={0.8} t={t} band={LOOK[i].band} skin={LOOK[i].skin} look={i === 2 ? 1 : i === 4 ? -1 : 0} expr={gap > 0.5 && (i === 2 || i === 4) ? 'stare' : 'smile'} />
      ))}
    </Scene>
  );
};

// ================================================================== 4 — the scribe writes on the slab: "مين غاب… وليه؟"
export const B4: React.FC<BoardProps> = ({t, ev}) => (
  <Scene bg="linear-gradient(180deg,#FBE3B4 0%,#EBC07A 100%)" html={<Pill x={760} y={330} size={50} bg="#fff" s={popIn(t - ev[0])}>مين غاب… وليه؟</Pill>}>
    <Dust t={t} />
    <Scribe x={360} y={FLOOR - 10} s={1.25} t={t} />
    <Slab x={760} y={CY + 60} s={0.62} t={t} rows={5} red={t > ev[1] ? [1] : []} rot={4} />
    <Ground o={0.12} />
  </Scene>
);

// ================================================================== 5 — a scorpion nips Seba's foot: "آه!"; red mark "عقرب"
export const B5: React.FC<BoardProps> = ({t, ev}) => {
  const [ea, eq] = ev; // العقرب, قرصه
  const sx = -120 + 520 * easeOut(seg(t, ea - 0.5, eq));
  const hit = t > eq;
  return (
    <Scene bg={SAND} html={<>
      <Txt x={560} y={330} size={84} color={RED} s={popIn(t - eq)} rot={-8}>آه!</Txt>
      <Stamp x={880} y={720} dt={t - eq - 0.35} text="عقرب" size={44} />
    </>}>
      <Dust t={t} />
      <Burst x={470} y={340} s={popIn(t - eq) * 0.9} />
      <Worker x={470 + (hit ? Math.sin(t * 30) * 4 * Math.exp(-(t - eq) * 3) : 0)} y={FLOOR - 10 - (hit ? 30 * Math.exp(-(t - eq) * 2) : 0)} s={1.05} seba pose={hit ? 'ouch' : 'stand'} expr={hit ? 'ouch' : 'smile'} t={t} />
      <Scorpion x={sx - (hit ? (t - eq) * 160 : 0)} y={FLOOR - 20} s={0.95} t={t} nip={hit ? 1 - clamp((t - eq) / 0.3) : seg(t, eq - 0.2, eq)} />
      <Slab x={880} y={CY + 30} s={0.5} t={t} rows={5} red={hit ? [1] : []} glow={1} rot={6} />
      <Ground o={0.12} />
    </Scene>
  );
};

// ================================================================== 6 — "ماشي، عذر محترم": thumbs-up stamp on the slab
const ThumbIcon: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (s <= 0 ? null : (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={80} fill="#35C46B" stroke={INK} strokeWidth={8} />
    <path d="M -36 -6 L -14 -6 L 4 -48 Q 22 -52 20 -26 L 16 -10 L 42 -10 Q 54 -6 50 10 L 40 44 Q 36 52 26 52 L -14 52 L -14 -6 M -36 -6 L -36 52 L -14 52" fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </g>
));
export const B6: React.FC<BoardProps> = ({t, ev}) => (
  <Scene bg="linear-gradient(180deg,#BDEBC8 0%,#7CCB93 100%)" html={<Stamp x={650} y={700} dt={t - ev[0]} text="عذر محترم" color="#1E9E50" size={56} rot={-8} />}>
    <Dust t={t} />
    <Slab x={420} y={CY} s={0.95} t={t} red={[1]} glow={1} rot={-4} />
    <ThumbIcon x={800} y={420} s={popIn(t - ev[0] - 0.1)} />
  </Scene>
);

// ================================================================== 7 — zoom out: 40 tiny workers, many with red marks
const REDS40 = [2, 5, 9, 11, 14, 17, 20, 23, 27, 30, 33, 36, 38];
const Icon: React.FC<{x: number; y: number; s: number; red: number; i: number}> = ({x, y, s, red, i}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-22} y={-14} width={44} height={40} rx={10} fill={LOOK[i % 7].skin} stroke={INK} strokeWidth={4} />
    <rect x={-24} y={14} width={48} height={18} rx={4} fill="#fff" stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={-34} r={20} fill={LOOK[i % 7].skin} stroke={INK} strokeWidth={4} />
    <path d="M -20 -36 Q 0 -66 20 -36 Q 0 -48 -20 -36" fill="#17120f" />
    {red > 0 && <g transform={`scale(${red})`}><circle cx={22} cy={-44} r={14} fill={RED} stroke={INK} strokeWidth={3} /><path d="M 15 -44 L 29 -44" stroke="#fff" strokeWidth={5} /></g>}
  </g>
);
export const B7: React.FC<BoardProps> = ({t, ev}) => {
  const z = easeInOut(seg(t, 0, 0.9));
  return (
    <Scene bg="linear-gradient(180deg,#FBE3B4 0%,#EBC07A 100%)" html={<Pill x={540} y={300} size={50} s={popIn(t - ev[0])}>٤٠ عامل</Pill>}>
      <g opacity={1 - z}><Slab x={540} y={CY} s={1.05 * (1 - z * 0.6)} t={t} red={[2]} /></g>
      <g opacity={z}>
        {Array.from({length: 40}, (_, i) => {
          const c = i % 10, r = Math.floor(i / 10);
          const red = REDS40.includes(i) ? popIn(t - ev[0] - 0.1 - REDS40.indexOf(i) * 0.08) : 0;
          return <Icon key={i} x={135 + c * 90} y={430 + r * 105} s={0.85 * z + 0.1} red={red} i={i} />;
        })}
      </g>
    </Scene>
  );
};

// ================================================================== 8 — a worker with a bandaged eye; counter ١… ٢… ٣
export const B8: React.FC<BoardProps> = ({t, ev}) => {
  const n = ev.filter((e) => t >= e).length;
  return (
    <Scene bg="linear-gradient(180deg,#CFE3FF 0%,#8FB6EE 100%)" html={<>
      {n > 0 && <Txt x={760} y={460} size={120} color={n === 3 ? RED : YEL} s={1 + 0.25 * Math.exp(-(t - ev[n - 1]) * 8)}>{['١', '١… ٢', '١… ٢… ٣'][n - 1]}</Txt>}
    </>}>
      <Dust t={t} />
      <Worker x={380} y={FLOOR - 10} s={1.2} patch band={LOOK[0].band} skin={LOOK[0].skin} expr="sad" t={t} />
      {n > 0 && <Slab x={600} y={720} s={0.3} t={t} rows={4} red={Array.from({length: n}, (_, i) => i)} />}
    </Scene>
  );
};

// ================================================================== 9 — a clay jar bubbling with foam: "بوظة"
export const B9: React.FC<BoardProps> = ({t, ev}) => (
  <Scene bg="linear-gradient(180deg,#FFE3A6 0%,#F3B45A 100%)" html={<Pill x={560} y={640} size={54} s={popIn(t - ev[0])} rot={-4}>بوظة</Pill>}>
    <Dust t={t} color="#FFF6DD" />
    <Jar x={560} y={FLOOR - 10} s={1.0} t={t} />
    <Worker x={260} y={FLOOR - 10} s={0.95} pose="stir" expr="grin" t={t} band={LOOK[2].band} skin={LOOK[2].skin} />
    <line x1={340} y1={FLOOR - 160} x2={470} y2={FLOOR - 330 + Math.sin(t * 6) * 10} stroke="#7A4A20" strokeWidth={10} strokeLinecap="round" />
  </Scene>
);

// ================================================================== 10 — a worker walks beside the boss; "واسطة" stamps on
export const B10: React.FC<BoardProps> = ({t, ev}) => {
  const x = 700 - t * 50;
  return (
    <Scene bg={SAND} html={<Stamp x={540} y={330} dt={t - ev[0]} text="واسطة" color="#C98A00" size={60} rot={-6} />}>
      <Dust t={t} />
      <Boss x={x - 150} y={FLOOR - 10} s={1.0} t={t} />
      <Worker x={x + 120} y={FLOOR - 10} s={0.85} pose="walk" expr="grin" t={t + 0.3} band={LOOK[4].band} skin={LOOK[4].skin} flip look={-1} />
      <Ground o={0.1} />
    </Scene>
  );
};

// ================================================================== 11 — the slab in a museum glass case: "لحد النهارده"
export const B11: React.FC<BoardProps> = ({t, ev}) => (
  <Scene bg={NIGHT} html={<Pill x={540} y={300} size={50} bg="#fff" s={popIn(t - ev[0])}>لحد النهارده</Pill>}>
    <Dust t={t} color="#FFF6C8" o={0.2} />
    <Case x={540} y={FLOOR - 230} t={t} light={0.5 + 0.5 * Math.sin(t * 2)} />
  </Scene>
);

// ================================================================== 12 — the wheat sack, a clock and a red "متأخر" stamp; the sack empties; "+٨٠ سنة"
export const B12: React.FC<BoardProps> = ({t, ev, d}) => {
  const [e80, eLate] = ev;
  const fill = 1 - 0.75 * easeInOut(seg(t, eLate, d));
  return (
    <Scene bg={SAND} html={<>
      <Pill x={540} y={300} size={50} s={popIn(t - e80)}>+٨٠ سنة</Pill>
      <Stamp x={560} y={560} dt={t - eLate} text="متأخر" size={60} />
    </>}>
      <Dust t={t} />
      <Sack x={360} y={FLOOR - 10} s={1.0} fill={fill} />
      <Clock x={790} y={CY + 40} r={110} spin={t * (t > eLate ? 8 : 2)} />
      <Ground o={0.1} />
    </Scene>
  );
};

// ================================================================== 13 — hungry workers holding their stomachs; big "?"
export const B13: React.FC<BoardProps> = ({t, ev}) => (
  <Scene bg="linear-gradient(180deg,#E9D2A8 0%,#C9A06A 100%)" html={<Txt x={540} y={400} size={190} color={YEL} s={popIn(t - ev[0]) * (1 + 0.04 * Math.sin(t * 4))} stroke={14}>؟</Txt>}>
    {[180, 400, 680, 900].map((x, i) => (
      <Worker key={i} x={x} y={FLOOR - 10 + Math.sin(t * 2 + i) * 3} s={0.95} pose="belly" expr="sad" t={t} seba={i === 1} band={i === 1 ? undefined : LOOK[i].band} skin={i === 1 ? SKIN : LOOK[i].skin} />
    ))}
    <Ground o={0.12} />
  </Scene>
);

// ================================================================== 15 — PAYOFF: tools down, the crowd marches with raised fists: "إحنا جعانين!"
const Tool: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <line x1={0} y1={-60} x2={0} y2={40} stroke="#7A4A20" strokeWidth={10} strokeLinecap="round" />
    <rect x={-28} y={-74} width={56} height={22} rx={4} fill="#9AA3AD" stroke={INK} strokeWidth={5} />
  </g>
);
export const B15: React.FC<BoardProps> = ({t, ev}) => {
  const [eDrop, eShout] = ev;
  const march = clamp((t - eDrop) / 0.4);
  const xs = [140, 290, 440, 590, 740, 890, 1020];
  return (
    <Scene bg="linear-gradient(180deg,#FF8A3D 0%,#FFC24B 55%,#FFE27A 100%)" html={<>
      <div style={{position: 'absolute', left: 540, top: 330, transform: `translate(-50%,-50%) rotate(-4deg) scale(${popIn(t - eShout)})`, ...AR, fontSize: 70, color: '#fff',
        background: RED, border: `8px solid ${INK}`, borderRadius: 40, padding: '0 40px 12px', whiteSpace: 'nowrap', lineHeight: 1.4, boxShadow: `0 10px 0 ${INK}`}}>إحنا جعانين!</div>
    </>}>
      <Rays x={540} y={CY} t={t * 2} color="#FFF3B0" o={0.45} />
      {Array.from({length: 30}, (_, i) => (
        <rect key={i} x={rand(i) * W} y={260 + ((rand(i + 5) * 600 + t * 160) % 600)} width={12} height={20} fill={['#FF5A4E', '#35C46B', '#2F9BFF', '#fff', '#B57BFF'][i % 5]} transform={`rotate(${t * 200 + i * 40} ${rand(i) * W} ${260 + ((rand(i + 5) * 600 + t * 160) % 600)})`} opacity={march} />
      ))}
      {xs.map((x, i) => {
        const fall = clamp((t - eDrop - i * 0.04) / 0.35);
        return <Tool key={`t${i}`} x={x + 40} y={FLOOR - 150 + 120 * easeIn(fall)} rot={fall * (70 + i * 10)} />;
      })}
      {xs.map((x, i) => (
        <Worker key={i} x={x} y={FLOOR - 10 - (march ? Math.abs(Math.sin(t * 7 + i)) * 10 : 0)} s={0.88} pose={march > 0 ? 'fist' : 'stand'}
          expr={march > 0 ? 'shout' : 'sad'} t={t} seba={i === 3} band={i === 3 ? undefined : LOOK[i].band} skin={i === 3 ? SKIN : LOOK[i].skin} flip={i % 2 === 1} />
      ))}
    </Scene>
  );
};

// ================================================================== 16 — sitting in a row in front of the temple, arms crossed
export const B16: React.FC<BoardProps> = ({t, ev}) => {
  const sit = t > ev[0];
  return (
    <Scene bg="linear-gradient(180deg,#9ED8FF 0%,#D6F0FF 70%)">
      <Temple x={540} y={FLOOR - 40} s={0.95} />
      <rect x={0} y={FLOOR - 40} width={W} height={60} fill="#E0B878" stroke={INK} strokeWidth={6} />
      {[170, 330, 490, 650, 810, 950].map((x, i) => (
        <Worker key={i} x={x} y={FLOOR + 10} s={0.78} pose={sit ? 'sit' : 'walk'} expr={sit ? 'stare' : 'smile'} t={t} seba={i === 2} band={i === 2 ? undefined : LOOK[i].band} skin={i === 2 ? SKIN : LOOK[i].skin} />
      ))}
    </Scene>
  );
};

// ================================================================== 17 — a tray of pastries slides in; they stare at it, then at each other
export const B17: React.FC<BoardProps> = ({t, ev}) => {
  const [eSend, eFit] = ev;
  const tx = 1300 - 760 * easeOut(seg(t, eSend - 0.2, eSend + 0.4));
  const look = t < eFit + 0.2 ? 0 : t < eFit + 0.9 ? 1 : -1;
  return (
    <Scene bg="linear-gradient(180deg,#9ED8FF 0%,#D6F0FF 70%)" html={<Txt x={540} y={320} size={64} color={YEL} s={popIn(t - eFit)}>فطاير!</Txt>}>
      <Temple x={540} y={FLOOR - 40} s={0.95} />
      <rect x={0} y={FLOOR - 40} width={W} height={60} fill="#E0B878" stroke={INK} strokeWidth={6} />
      {[150, 300, 780, 930].map((x, i) => (
        <Worker key={i} x={x} y={FLOOR + 10} s={0.78} pose="sit" expr="stare" t={t} seba={i === 1} look={look === 0 ? (x < 540 ? 1 : -1) : look * (i % 2 ? -1 : 1)}
          band={i === 1 ? undefined : LOOK[i].band} skin={i === 1 ? SKIN : LOOK[i].skin} />
      ))}
      <g transform={`translate(${tx} ${FLOOR - 70})`}>
        <ellipse cx={0} cy={0} rx={150} ry={34} fill="#C9C9C9" stroke={INK} strokeWidth={7} />
        {[-90, -30, 30, 90, -60, 0, 60].map((px, k) => <Pastry key={k} x={px} y={k > 3 ? -40 : -6} k={k} />)}
      </g>
    </Scene>
  );
};

// ================================================================== 18 — big gold badge "أول إضراب في التاريخ" + flag stamps on
export const B18: React.FC<BoardProps> = ({t, ev}) => {
  const p = t < ev[0] ? 0.45 * popIn(t, 0.3) * (1 + 0.03 * Math.sin(t * 5)) : 0.45 + 0.55 * popIn(t - ev[0], 0.32); // small from the start, stamps to full size on "إضراب"
  return (
    <Scene bg="radial-gradient(circle at 50% 45%,#7A5A00 0%,#2A1E00 80%)" html={
      p > 0 ? <div style={{position: 'absolute', left: 540, top: CY, transform: `translate(-50%,-50%) scale(${p})`, ...AR, textAlign: 'center', fontSize: 66, color: INK, lineHeight: 1.25}}>
        أول إضراب<br />في التاريخ
      </div> : null}>
      <Rays x={540} y={CY} t={t} color={YEL} o={0.3} />
      {p > 0 && (
        <g transform={`translate(540 ${CY}) scale(${p})`}>
          {Array.from({length: 20}, (_, i) => <circle key={i} cx={Math.cos((i / 20) * Math.PI * 2) * 250} cy={Math.sin((i / 20) * Math.PI * 2) * 250} r={34} fill="#F2B705" stroke={INK} strokeWidth={6} />)}
          <circle r={250} fill="#FFD23F" stroke={INK} strokeWidth={10} />
          <circle r={214} fill="none" stroke="#C98A00" strokeWidth={8} strokeDasharray="4 14" />
          <path d="M -120 220 L -170 330 L -110 310 L -80 360 L -40 240 Z M 120 220 L 170 330 L 110 310 L 80 360 L 40 240 Z" fill={RED} stroke={INK} strokeWidth={6} />
          <Flag x={0} y={-150} s={0.7} />
        </g>
      )}
      {t > ev[0] && Array.from({length: 14}, (_, i) => {
        const a = (i / 14) * Math.PI * 2, r = 300 + (t - ev[0]) * 300;
        return <circle key={i} cx={540 + Math.cos(a) * r} cy={CY + Math.sin(a) * r * 0.6} r={8} fill={YEL} opacity={clamp(1 - (t - ev[0]) / 1.2)} />;
      })}
    </Scene>
  );
};

// ================================================================== 19 — the hook slab again with an empty row + pen; comment arrows + send icon
export const B19: React.FC<BoardProps> = ({t, ev}) => {
  const [eWrite, eSend] = ev;
  return (
    <Scene bg={SAND}>
      <Rays x={540} y={CY} t={t} />
      <Slab x={360} y={CY} s={0.95} t={t} red={[1]} empty={3} rot={-3} />
      <Pen x={420 + Math.sin(t * 8) * 16} y={CY + 30} s={popIn(t - 0.1)} rot={30} />
      {t > eWrite && [0, 1, 2].map((i) => (
        <ArrowDown key={i} x={720 + i * 110} y={470 + ((t * 2 + i * 0.3) % 1) * 50} s={0.75 * popIn(t - eWrite - i * 0.12)} color={i === 1 ? RED : YEL} />
      ))}
      <SendIcon x={830 + (t > eSend ? Math.sin(t * 3) * 8 : 0)} y={700 - (t > eSend ? ((t - eSend) * 20) % 24 : 0)} s={popIn(t - eSend) * 0.9} rot={-10} />
    </Scene>
  );
};

// ================================================================== 20 — "الفهمان كسبان": gold sparkles, then the hook slab slides back in (loop to frame 0)
export const B20: React.FC<BoardProps> = ({t, d}) => {
  const out = easeIn(seg(t, d - 0.55, d)); // board 19's slab is pushed out to the left while the hook slab slides in (B1, t < 0)
  return (
    <>
      <B1 t={t - d} d={3} ev={[99]} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {out < 1 && <Slab x={360 - out * 900} y={CY} s={0.95} t={t} red={[1]} empty={3} rot={-3} />}
        {Array.from({length: 22}, (_, i) => (
          <circle key={i} cx={rand(i) * W} cy={260 + ((rand(i + 3) * 600 + t * 140) % 600)} r={4 + rand(i + 8) * 6} fill={YEL} opacity={0.7 * (1 - seg(t, d - 0.6, d - 0.1))} />
        ))}
      </svg>
    </>
  );
};

// board 14 ("استنى ده الغريب جاي!") keeps board 13's drawing (frozen, dimmed by the episode) — see the episode file.
export const BOARDS = [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13, B13, B15, B16, B17, B18, B19, B20];
