import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Fonts} from '../lib/fonts';
import {FPS, clamp, easeIn, easeInOut, easeOut, lerp, popIn, popOut, rand, seg, wobble} from '../lib/anim';
import {Cam, CamKey, Layer, camAt, shakeAt} from '../lib/camera';
import {SetBack, SetFront, DESK_SCREEN_Y} from '../lib/Set';
import {CANVAS, Character, HEAD, Pose, PoseKey, blinkTimes, mouthStates, poseAt, squashAt} from '../lib/Character';
import {Captions, RED, YELLOW, Word, groupWords, norm} from '../lib/Captions';
import {INK, Sparkle, Star, SweatDrop, bezierPath, showScale} from '../lib/fx';
import WORDS from './rabies.words.json';
import ENV from './rabies.env.json';

// ============================================================ timing
// voice (ElevenLabs eleven_v4, voice "Fodoly", 1 take) placed at VO seconds; word times from ElevenLabs Scribe
const VO = 0.15;
const words = WORDS as Word[];
const at = (w: string, nth = 0) => {
  const hits = words.filter((x) => norm(x.w) === norm(w));
  if (!hits[nth]) throw new Error(`word not found: ${w} #${nth}`);
  return hits[nth].s + VO;
};
const VOICE_END = words[words.length - 1].e + VO;
export const RABIES_DURATION_S = Math.round((VOICE_END + 0.8) * FPS) / FPS;

const T = {
  scared: at('تترعب'), mayya1: at('مية'), kollena: at('كلنا'), virus: at('فيروس', 1), so3ar: at('السُّعار'), kalb: at('الكلب'),
  nerve: at('الفيروس'), walk1: at('للمخ'), a3sab: at('الأعصاب'), wlamma: at('ولما'), ay: at('أي'), tebla3: at('تبلع'),
  ta2alosat: at('تقلصات'), gamda: at('جامدة'), zoor: at('الزور'), yekhaf: at('يخاف'), elmayya: at('المية'),
  estanna: at('استنى'), law: at('لو'), a3rad: at('الأعراض'), qatel: at('قاتل'), ashan: at('عشان'),
  kalb2: at('كلب'), otta: at('قطة'), addak: at('عضّك'), kharbeshak: at('خَرْبِشَك'), eghsel: at('اغسل'), saboon: at('وصابون'),
  rooh: at('وروح'), mostashfa: at('مستشفى'), fawran: at('فورًا'), tat3eem1: at('التطعيم'), tat3eem2: at('التطعيم', 1),
  bey7meek: at('بيحميك'), mayya100: at('مية', 2), elmeyya: at('المية', 1), share: at('شيّر'), yenqez: at('ينقذ'),
  bet7ebbo: at('بتحبه'), fahman: at('الفهمان'), kasban: at('كسبان'),
};
// signature moments pinned to the measured audio onsets (voice level envelope), not just the transcript
T.estanna = 17.38 + VO; T.fahman = 37.9 + VO; T.kasban = 38.72 + VO;
const END = RABIES_DURATION_S;

// ============================================================ character
const TALKABLE: Pose[] = ['hero', 'explain', 'point_up', 'thinking', 'temple', 'thumbs_up', 'worried'];
const POSES: PoseKey[] = [
  [0, 'temple'],            // first frames match the last frame (loop)
  [VO, 'hero'],
  [T.kollena, 'thinking'],
  [T.so3ar, 'point_up'],
  [T.nerve, 'explain'],
  [T.ay, 'hero'],
  [T.ta2alosat, 'worried'],
  [T.estanna, 'shocked'],   // signature line: shocked stare exactly on "استنى"
  [T.law, 'worried'],
  [T.ashan, 'explain'],
  [T.eghsel, 'point_up'],
  [T.rooh, 'explain'],
  [T.tat3eem2, 'hero'],
  [T.mayya100, 'thumbs_up'],
  [T.share, 'explain'],
  [T.fahman, 'temple'],     // ending: hand on temple exactly on "الفهمان"
];
const MOUTH = mouthStates((ENV as {level: number[]}).level);
const BLINKS = blinkTimes(END);
const winkOn = (t: number) => t < VO - 0.02 || t >= T.kasban; // wink exactly on "كسبان" (and the looped first frames)

const CS = 0.6; // character canvas px -> world px
const CHAR_X = 540 - (CANVAS[0] * CS) / 2;
const CHAR_Y = DESK_SCREEN_Y - 1450 * CS; // pocket line sits on the desk edge
const FACE = {x: CHAR_X + HEAD[0] * CS, y: CHAR_Y + HEAD[1] * CS};

// ============================================================ camera
const CAM0: Cam = {x: 520, y: 860, z: 180};
const CAM_KEYS: CamKey[] = [
  [VO, 2.6, {x: 540, y: 940, z: 30}],
  [T.nerve - 0.15, T.nerve + 0.45, {x: 540, y: 760, z: 170}],
  [T.ay - 0.1, T.ay + 0.4, {x: 540, y: 860, z: 90}],
  [T.estanna - 0.04, T.estanna + 0.1, {x: 540, y: FACE.y + 20, z: 380}], // punch-in exactly on "استنى"
  [T.law - 0.1, T.law + 0.4, {x: 540, y: 900, z: 60}],
  [T.qatel - 0.05, T.qatel + 0.3, {x: 540, y: 860, z: 140}],
  [T.ashan - 0.1, T.ashan + 0.4, {x: 540, y: 880, z: 60}],
  [T.fahman - 0.1, T.fahman + 0.5, CAM0], // ends on the opening framing -> seamless loop
];
const SHAKES: [number, number, number][] = [[T.estanna, 16, 6], [T.walk1, 5, 9], [T.qatel, 7, 7], [T.ta2alosat, 4, 9]];

// ============================================================ board (chalkboard inset above his head)
const BX = 80, BY = 84, BW = 860, BH = 480;
type Scene = 'virus' | 'nerve' | 'throat' | 'glass' | 'warning' | 'wound' | 'hospital' | 'shield' | 'share';
const SCENES: [number, Scene | null][] = [
  [0, null], [T.virus - 0.12, 'virus'], [T.nerve - 0.1, 'nerve'], [T.ay - 0.05, 'throat'], [T.yekhaf - 0.08, 'glass'],
  [T.estanna - 0.12, null], [T.a3rad - 0.1, 'warning'], [T.ashan, 'wound'], [T.mostashfa - 0.08, 'hospital'],
  [T.tat3eem2 - 0.05, 'shield'], [T.share - 0.08, 'share'], [T.fahman - 0.15, null],
];
const sceneAt = (t: number) => {
  let cur: [number, Scene | null] = SCENES[0], prev: [number, Scene | null] | null = null;
  for (const s of SCENES) if (t >= s[0]) { prev = cur; cur = s; }
  return {scene: cur[1], since: t - cur[0], start: cur[0], prev: prev?.[1] ?? null};
};
const P = (n: string) => staticFile(`elfahman/rabies/${n}`);
const IMG = {glass: [610, 859], virus: [861, 590], brain: [930, 792]};

const NERVE = bezierPath([
  [[70, 400], [210, 430], [250, 250], [380, 270]],
  [[380, 270], [520, 290], [520, 130], [640, 150]],
]);

const NerveScene: React.FC<{t: number}> = ({t}) => {
  const u = easeInOut(seg(t, T.nerve + 0.05, T.walk1)) * 0.98;
  const p = NERVE.at(u);
  const walking = t > T.nerve && t < T.walk1;
  const bob = walking ? Math.abs(Math.sin((t - T.nerve) * Math.PI * 4.4)) * 12 : 0;
  const arrived = t >= T.walk1;
  const brainShake = arrived ? wobble(t - T.walk1, 7, 5) * 8 : 0;
  const brainS = popIn(t - T.a3sab, 0.3);
  const bw = 200, bh = (bw * IMG.brain[1]) / IMG.brain[0];
  const vw = 150, vh = (vw * IMG.virus[1]) / IMG.virus[0];
  const vx = arrived ? 690 + Math.sin((t - T.walk1) * 6) * 4 : p.x, vy = arrived ? 160 : p.y;
  const pulses = [0, 0.33, 0.66].map((o) => NERVE.at(((t * 0.55 + o) % 1)));
  const red = arrived ? 0.5 + 0.5 * Math.sin((t - T.walk1) * 9) : 0;
  return (
    <g>
      {/* nerve "road": cream band with dark outline, small branches */}
      <path d={NERVE.d} fill="none" stroke={INK} strokeWidth={44} strokeLinecap="round" />
      <path d={NERVE.d} fill="none" stroke="#ffe7a8" strokeWidth={30} strokeLinecap="round" />
      <path d={NERVE.d} fill="none" stroke="#e8c070" strokeWidth={6} strokeDasharray="20 22" strokeLinecap="round" />
      {[[150, 420, 120, 470], [300, 262, 280, 200], [470, 250, 520, 300], [560, 170, 540, 110]].map(([x1, y1, x2, y2], i) => (
        <g key={i}><path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={INK} strokeWidth={18} strokeLinecap="round" />
          <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#ffe7a8" strokeWidth={8} strokeLinecap="round" /></g>
      ))}
      {pulses.map((q, i) => <circle key={i} cx={q.x} cy={q.y} r={7} fill="#fffbe6" opacity={0.9} />)}
      {/* brain at the end of the road */}
      <g transform={`translate(${745 + brainShake} 150) scale(${brainS})`}>
        {red > 0 && <ellipse rx={bw * 0.62} ry={bh * 0.62} fill="#ff5a4e" opacity={0.25 + 0.25 * red} />}
        <image href={P('brain.png')} x={-bw / 2} y={-bh / 2} width={bw} height={bh} />
      </g>
      {/* the virus walking up the nerve */}
      <g transform={`translate(${vx} ${vy - bob - vh * 0.35}) rotate(${walking ? p.ang * 0.35 + Math.sin((t - T.nerve) * 14) * 4 : -8})`}>
        <image href={P('virus.png')} x={-vw / 2} y={-vh / 2} width={vw} height={vh} />
      </g>
      {arrived && t - T.walk1 < 0.5 && <Star x={700} y={110} r={60 * popIn(t - T.walk1, 0.15) * (1 - seg(t, T.walk1 + 0.3, T.walk1 + 0.5))} fill="#ff8a3d" />}
    </g>
  );
};

const ThroatScene: React.FC<{t: number}> = ({t}) => {
  // a throat tube seen from the side; a water drop goes down, the throat spasms and throws it back up
  const cx = 430, top = 30, bot = 450;
  const sq1 = t >= T.ta2alosat ? Math.max(0, 1 - (t - T.ta2alosat) / 0.9) * (0.75 + 0.25 * Math.sin((t - T.ta2alosat) * 40)) : 0;
  const sq2 = t >= T.zoor ? Math.max(0, 1 - (t - T.zoor) / 0.7) * (0.75 + 0.25 * Math.sin((t - T.zoor) * 40)) : 0;
  const sq = Math.max(sq1, sq2);
  const half = (y: number) => 62 - sq * 46 * Math.exp(-(((y - 250) / 90) ** 2));
  const left: string[] = [], right: string[] = [];
  for (let y = top; y <= bot; y += 10) { left.push(`${cx - half(y)},${y}`); right.unshift(`${cx + half(y)},${y}`); }
  // drop: falls from tebla3 until the spasm, then is pushed back up
  let dy = top - 20, ds = 0;
  if (t >= T.tebla3) { ds = popIn(t - T.tebla3, 0.2); dy = lerp(top + 10, 200, easeIn(seg(t, T.tebla3 + 0.1, T.ta2alosat))); }
  if (t >= T.ta2alosat) dy = lerp(200, top - 10, easeOut(seg(t, T.ta2alosat, T.ta2alosat + 0.35))) + wobble(t - T.ta2alosat - 0.35, 3, 5) * 12;
  const squishX = t >= T.ta2alosat && t < T.ta2alosat + 0.35 ? 1 - 0.3 * Math.sin(seg(t, T.ta2alosat, T.ta2alosat + 0.35) * Math.PI) : 1;
  return (
    <g>
      <polygon points={[...left, ...right].join(' ')} fill="#f29a8f" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <polygon points={[...left, ...right].join(' ')} fill="none" stroke="#c9645c" strokeWidth={4} transform={`translate(${cx} 0) scale(0.6 1) translate(${-cx} 0)`} opacity={0.6} />
      {sq > 0.05 && [-1, 1].map((s) => (
        <path key={s} d={`M ${cx + s * 110} 190 l ${s * 30} 20 l ${-s * 30} 20 l ${s * 30} 20 l ${-s * 30} 20`} fill="none" stroke={RED} strokeWidth={9} strokeLinejoin="round" opacity={sq} />
      ))}
      <g transform={`translate(${cx} ${dy}) scale(${ds * squishX} ${ds / squishX})`}>
        <path d="M 0 -48 C 20 -16 34 4 34 22 C 34 43 18 56 0 56 C -18 56 -34 43 -34 22 C -34 4 -20 -16 0 -48 Z" fill="#6cc6ff" stroke={INK} strokeWidth={7} />
        <ellipse cx={-11} cy={24} rx={7} ry={12} fill="#fff" />
      </g>
    </g>
  );
};

const GlassOnBoard: React.FC<{t: number; since: number}> = ({t, since}) => {
  const gh = 380, gw = (gh * IMG.glass[0]) / IMG.glass[1];
  const sh = Math.sin(t * 2 * Math.PI * 17) * 6, rot = Math.sin(t * 2 * Math.PI * 9) * 4;
  const back = t >= T.elmayya ? 1 - 0.12 * easeOut(seg(t, T.elmayya, T.elmayya + 0.2)) : 1;
  return (
    <g transform={`translate(${430 + sh} 250) rotate(${rot}) scale(${back})`}>
      <image href={P('glass.png')} x={-gw / 2} y={-gh / 2} width={gw} height={gh} />
      {[0, 0.45].map((o, i) => <SweatDrop key={i} x={i ? 150 : -150} y={-150} dt={since - 0.25 - o} s={0.7} />)}
    </g>
  );
};

const Warning: React.FC<{t: number}> = ({t}) => {
  const red = t >= T.qatel;
  const pulse = red ? 1 + 0.08 * Math.max(0, Math.sin((t - T.qatel) * 11)) * Math.exp(-(t - T.qatel) * 0.8) : 1;
  const s = popIn(t - T.a3rad, 0.3) * pulse;
  return (
    <g transform={`translate(430 255) scale(${s})`}>
      <path d="M 0 -190 L 200 160 L -200 160 Z" fill={red ? RED : YELLOW} stroke={INK} strokeWidth={22} strokeLinejoin="round" />
      <rect x={-20} y={-90} width={40} height={150} rx={18} fill={INK} />
      <circle cx={0} cy={110} r={24} fill={INK} />
    </g>
  );
};

const Paw: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={22} rx={34} ry={28} fill="#6b4a3a" stroke={INK} strokeWidth={6} />
    {[[-34, -16], [-12, -34], [14, -34], [36, -16]].map(([px, py], i) => <ellipse key={i} cx={px} cy={py} rx={13} ry={16} fill="#6b4a3a" stroke={INK} strokeWidth={6} />)}
  </g>
);

const Wound: React.FC<{t: number}> = ({t}) => {
  // forearm across the board, bite + scratch, then washed with water and soap
  const armS = popIn(t - T.ashan - 0.05, 0.3);
  const bite = showScale(t, T.addak, 1e9, 0.18);
  const scr = clamp((t - T.kharbeshak) / 0.22);
  const wash = t >= T.eghsel;
  const soap = t >= T.saboon;
  const clean = clamp((t - (T.saboon + 0.5)) / 0.8);
  const bub = soap ? Array.from({length: 18}, (_, i) => {
    const r = rand(i * 3.1), r2 = rand(i * 7.7 + 2), dt = t - T.saboon - r * 0.6;
    return dt > 0 ? <circle key={i} cx={250 + r2 * 360} cy={250 + (r - 0.5) * 70 - dt * 25 * r2} r={(12 + r * 22) * popIn(dt, 0.25)} fill="#ffffff" fillOpacity={0.75} stroke="#9fd8ff" strokeWidth={4} /> : null;
  }) : null;
  return (
    <g>
      <g transform={`translate(430 255) scale(${armS}) translate(-430 -255)`}>
        <path d="M 40 200 C 200 185 520 185 640 200 L 640 310 C 520 325 200 325 40 310 Z" fill="#c9773f" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <path d="M 630 190 C 700 170 780 190 800 230 C 815 265 790 300 740 310 L 630 315 Z" fill="#c9773f" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <path d="M 90 228 C 250 216 450 216 600 226" stroke="#e39a63" strokeWidth={10} fill="none" strokeLinecap="round" />
        {/* bite marks */}
        <g opacity={1 - clean} transform={`translate(260 255) scale(${bite})`}>
          {[-48, -24, 0, 24, 48].map((x, i) => <g key={i}><ellipse cx={x} cy={-26 + Math.abs(x) * 0.18} rx={7} ry={9} fill="#8e2a22" /><ellipse cx={x} cy={26 - Math.abs(x) * 0.18} rx={7} ry={9} fill="#8e2a22" /></g>)}
        </g>
        {/* scratches */}
        <g opacity={1 - clean}>
          {[0, 1, 2].map((i) => {
            const x0 = 420 + i * 50, len = 120 * clamp(scr * 3 - i);
            return len > 1 ? <path key={i} d={`M ${x0} ${205} L ${x0 + len * 0.45} ${205 + len * 0.9}`} stroke="#c0392b" strokeWidth={10} strokeLinecap="round" /> : null;
          })}
        </g>
      </g>
      {[[T.kalb2, 120, 80], [T.otta, 760, 80]].map(([tt, x, y], i) => t >= tt && t < T.eghsel + 0.2 ? <Paw key={i} x={x} y={y} s={0.9 * showScale(t, tt, T.eghsel)} /> : null)}
      {wash && (
        <g>
          {/* faucet + falling water */}
          <g transform={`translate(430 0) scale(${popIn(t - T.eghsel, 0.25)})`}>
            <rect x={-70} y={-10} width={140} height={56} rx={14} fill="#b9c4cf" stroke={INK} strokeWidth={8} />
            <rect x={-22} y={40} width={44} height={30} rx={6} fill="#b9c4cf" stroke={INK} strokeWidth={8} />
          </g>
          {(() => {
            const h = 130 * easeOut(seg(t, T.eghsel + 0.1, T.eghsel + 0.35));
            return h > 1 ? <g>
              <rect x={410} y={70} width={40} height={h} fill="#7fd0ff" stroke={INK} strokeWidth={6} />
              {[0, 1, 2, 3].map((k) => <rect key={k} x={418} y={70 + ((t * 300 + k * 33) % Math.max(1, h - 20))} width={8} height={18} rx={4} fill="#ffffff" opacity={0.8} />)}
            </g> : null;
          })()}
          {[0, 1, 2, 3, 4, 5].map((k) => {
            const dt = ((t - T.eghsel) * 1.8 + k / 6) % 1, sx = k % 2 ? 1 : -1;
            return t > T.eghsel + 0.3 ? <circle key={k} cx={430 + sx * (20 + dt * 120)} cy={200 - Math.sin(dt * Math.PI) * 50 + dt * 30} r={9 * (1 - dt)} fill="#7fd0ff" stroke={INK} strokeWidth={3} /> : null;
          })}
        </g>
      )}
      {soap && (
        <g transform={`translate(${lerp(980, 640, easeOut(seg(t, T.saboon, T.saboon + 0.3)))} 120) rotate(${-12 + wobble(t - T.saboon - 0.3, 2.5, 5) * 10})`}>
          <rect x={-80} y={-42} width={160} height={84} rx={30} fill="#ffd1e6" stroke={INK} strokeWidth={9} />
          <ellipse cx={-25} cy={-16} rx={30} ry={10} fill="#fff" opacity={0.8} />
        </g>
      )}
      {bub}
    </g>
  );
};

const Hospital: React.FC<{t: number}> = ({t}) => {
  const s = popIn(t - T.mostashfa, 0.3);
  const sy = popIn(t - T.tat3eem1, 0.28);
  return (
    <g>
      <g transform={`translate(330 450) scale(${s})`}>
        <rect x={-190} y={-300} width={380} height={300} fill="#f4f7fb" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        <rect x={-210} y={-320} width={420} height={36} rx={8} fill="#38b2a6" stroke={INK} strokeWidth={9} />
        {[-120, -40, 40, 120].map((x) => [-240, -160].map((y) => <rect key={`${x}${y}`} x={x - 26} y={y} width={52} height={50} rx={6} fill="#9fd8ff" stroke={INK} strokeWidth={6} />))}
        <rect x={-42} y={-90} width={84} height={90} fill="#38b2a6" stroke={INK} strokeWidth={8} />
        <circle cx={0} cy={-370} r={58} fill="#fff" stroke={INK} strokeWidth={9} />
        <path d="M -14 -404 h 28 v 20 h 20 v 28 h -20 v 20 h -28 v -20 h -20 v -28 h 20 Z" fill="#38b2a6" stroke={INK} strokeWidth={5} />
      </g>
      <g transform={`translate(700 250) rotate(-35) scale(${sy})`}><Syringe /></g>
      <Sparkle x={760} y={150} dt={t - T.tat3eem1 - 0.1} r={34} />
      <Sparkle x={620} y={340} dt={t - T.tat3eem1 - 0.25} r={26} />
    </g>
  );
};

const Syringe: React.FC = () => (
  <g>
    <rect x={-150} y={-8} width={44} height={16} rx={4} fill="#b9c4cf" stroke={INK} strokeWidth={6} />
    <rect x={-170} y={-36} width={22} height={72} rx={6} fill="#b9c4cf" stroke={INK} strokeWidth={6} />
    <rect x={-110} y={-34} width={190} height={68} rx={12} fill="#e9f6ff" stroke={INK} strokeWidth={8} />
    <rect x={-30} y={-26} width={104} height={52} rx={6} fill="#7fe0a0" />
    {[-60, -30, 0, 30].map((x) => <path key={x} d={`M ${x} -34 v 18`} stroke={INK} strokeWidth={5} />)}
    <path d="M 80 -14 L 110 -6 L 110 6 L 80 14 Z" fill="#b9c4cf" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 110 0 L 190 0" stroke={INK} strokeWidth={7} strokeLinecap="round" />
  </g>
);

const Shield: React.FC<{t: number}> = ({t}) => {
  const s = popIn(t - T.tat3eem2, 0.32);
  const glow = t >= T.bey7meek ? 0.5 + 0.5 * Math.sin((t - T.bey7meek) * 6) : 0;
  const n = Math.round(100 * easeOut(seg(t, T.mayya100, T.elmeyya + 0.35)));
  const ns = t >= T.mayya100 ? popIn(t - T.mayya100, 0.25) : 0;
  return (
    <g>
      <g transform={`translate(270 250) scale(${s})`}>
        {glow > 0 && <circle r={190} fill="#7fe0a0" opacity={0.18 + 0.15 * glow} />}
        <path d="M 0 -180 C 70 -140 120 -130 160 -130 C 160 20 110 120 0 180 C -110 120 -160 20 -160 -130 C -120 -130 -70 -140 0 -180 Z" fill="#38b2a6" stroke={INK} strokeWidth={14} strokeLinejoin="round" />
        <path d="M 0 -140 C 55 -110 95 -100 125 -100 C 122 10 85 92 0 140 Z" fill="#5fd0c3" opacity={0.7} />
        <g transform="rotate(-45) scale(0.62)"><Syringe /></g>
      </g>
      <Sparkle x={130} y={90} dt={t - T.bey7meek} r={36} />
      <Sparkle x={420} y={360} dt={t - T.bey7meek - 0.2} r={28} />
      {ns > 0 && (
        <text x={640} y={300} textAnchor="middle" fontFamily="Cairo" fontWeight={900} fontSize={150 * ns} fill="#7fe0a0" stroke={INK} strokeWidth={16} paintOrder="stroke" direction="ltr">{n}%</text>
      )}
    </g>
  );
};

const Share: React.FC<{t: number}> = ({t}) => {
  const s = popIn(t - T.share, 0.3);
  const press = t >= T.share + 0.35 && t < T.share + 0.55 ? 0.9 : 1;
  const hb = t >= T.yenqez ? popIn(t - T.yenqez, 0.3) * (1 + (t >= T.bet7ebbo ? 0.12 * Math.max(0, Math.sin((t - T.bet7ebbo) * 14)) * Math.exp(-(t - T.bet7ebbo) * 2) : 0)) : 0;
  const nodes: [number, number][] = [[-70, 0], [70, -70], [70, 70]];
  return (
    <g>
      <g transform={`translate(300 250) scale(${s * press})`}>
        <circle r={170} fill="#ffd23f" stroke={INK} strokeWidth={14} />
        {nodes.slice(1).map(([x, y], i) => <path key={i} d={`M -70 0 L ${x} ${y}`} stroke={INK} strokeWidth={18} />)}
        {nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={34} fill="#fff" stroke={INK} strokeWidth={12} />)}
      </g>
      {hb > 0 && (
        <g transform={`translate(640 250) scale(${hb})`}>
          <path d="M 0 60 C -140 -30 -90 -150 0 -80 C 90 -150 140 -30 0 60 Z" transform="scale(1.4)" fill={RED} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
          <ellipse cx={-55} cy={-75} rx={22} ry={14} fill="#fff" opacity={0.7} transform="rotate(-30 -55 -75)" />
        </g>
      )}
    </g>
  );
};

const VirusIntro: React.FC<{t: number}> = ({t}) => {
  const vw = 360, vh = (vw * IMG.virus[1]) / IMG.virus[0];
  const s = popIn(t - T.virus, 0.32);
  const jig = Math.sin(t * 2 * Math.PI * 1.6) * 5;
  const k = t >= T.kalb ? 1 + 0.1 * wobble(t - T.kalb, 3, 4) : 1;
  return (
    <g transform={`translate(430 ${250 + jig}) scale(${s * k}) rotate(${Math.sin(t * 3) * 4})`}>
      <image href={P('virus.png')} x={-vw / 2} y={-vh / 2} width={vw} height={vh} />
    </g>
  );
};

const Board: React.FC<{t: number}> = ({t}) => {
  const {scene, since, prev} = sceneAt(t);
  // the board itself: pops in when a scene starts from nothing, pops out when the scene list goes to null
  const shown = scene !== null;
  const lastOn = SCENES.filter((s) => s[1] === null && s[0] <= t).pop()?.[0] ?? 0;
  const firstOn = SCENES.find((s) => s[1] !== null && s[0] > lastOn)?.[0] ?? 1e9;
  let bs = 0;
  if (shown) bs = prev === null ? popIn(since, 0.32) : 1;
  else if (prev !== null && since < 0.2) bs = popOut(since, 0.18);
  void firstOn;
  if (bs <= 0.001) return null;
  const content = shown ? scene : prev;
  // content swaps never cut: the old drawing pops out during the 0.12 s before the next one pops in
  const next = SCENES.find((s) => s[0] > t);
  const leaving = shown && next && next[1] !== null && next[0] - t < 0.12 ? popOut(0.12 - (next[0] - t), 0.12) : 1;
  const cs = (shown && prev !== null && since < 0.3 ? popIn(since, 0.26) : 1) * leaving;
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(${BX + BW / 2} ${BY + BH}) scale(${bs}) translate(${-BW / 2} ${-BH})`}>
        <rect x={-16} y={-16} width={BW + 32} height={BH + 32} rx={26} fill="#8a5a33" stroke={INK} strokeWidth={10} />
        <rect x={0} y={0} width={BW} height={BH} rx={14} fill="#21302b" stroke={INK} strokeWidth={6} />
        <rect x={10} y={10} width={BW - 20} height={BH - 20} rx={10} fill="none" stroke="#ffffff" strokeOpacity={0.05} strokeWidth={8} />
        <g transform={`translate(${BW / 2} ${BH / 2}) scale(${cs}) translate(${-BW / 2 + 0} ${-BH / 2})`}>
          {content === 'virus' && <VirusIntro t={t} />}
          {content === 'nerve' && <NerveScene t={t} />}
          {content === 'throat' && <ThroatScene t={t} />}
          {content === 'glass' && <GlassOnBoard t={t} since={since} />}
          {content === 'warning' && <Warning t={t} />}
          {content === 'wound' && <Wound t={t} />}
          {content === 'hospital' && <Hospital t={t} />}
          {content === 'shield' && <Shield t={t} />}
          {content === 'share' && <Share t={t} />}
        </g>
      </g>
    </svg>
  );
};

// ============================================================ hook prop: the scared glass on the desk (moving from frame 1)
const HookGlass: React.FC<{t: number}> = ({t}) => {
  const out = T.kollena - 0.15;
  if (t > out + 0.2) return null;
  const s = t < out ? 1 : popOut(t - out, 0.18);
  const fear = t >= T.scared ? 2.2 : 1;
  const jump = t >= T.mayya1 ? wobble(t - T.mayya1, 4, 6) : 0;
  const gh = 400, gw = (gh * IMG.glass[0]) / IMG.glass[1];
  const x = 215 + Math.sin(t * 2 * Math.PI * 16) * 3 * fear, y = DESK_SCREEN_Y + 45;
  const rot = Math.sin(t * 2 * Math.PI * 8.5) * 2.2 * fear;
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <ellipse cx={215} cy={y - 4} rx={gw * 0.42 * s} ry={14 * s} fill="#000" opacity={0.25} />
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * (1 - 0.08 * jump)} ${s * (1 + 0.1 * jump)})`}>
        <image href={P('glass.png')} x={-gw / 2} y={-gh} width={gw} height={gh} />
        <SweatDrop x={-gw * 0.55} y={-gh * 0.9} dt={t - T.mayya1} s={0.6} />
        <SweatDrop x={gw * 0.55} y={-gh * 0.85} dt={t - T.mayya1 - 0.15} s={0.5} />
      </g>
    </svg>
  );
};

// ============================================================ sound
type Cue = [number, string, number];
const SFX: Cue[] = [
  [0, 'tremble', 0.32], [T.scared, 'tremble', 0.4], [T.mayya1, 'gulp', 0.35], [T.kollena - 0.15, 'swish', 0.3],
  [T.virus - 0.12, 'whoosh', 0.3], [T.virus, 'boing', 0.3], [T.kalb, 'pop', 0.3],
  [T.nerve - 0.1, 'swish', 0.3], [T.a3sab, 'pop', 0.3], [T.walk1, 'thud', 0.45],
  [T.ay - 0.05, 'swish', 0.3], [T.tebla3, 'gulp', 0.35], [T.ta2alosat, 'squish', 0.5], [T.zoor, 'squish', 0.4], [T.gamda, 'pop', 0.2],
  [T.yekhaf - 0.08, 'whoosh', 0.28], [T.yekhaf, 'tremble', 0.4],
  [T.estanna - 0.02, 'stinger', 0.55],
  [T.a3rad - 0.1, 'whoosh', 0.3], [T.a3rad, 'pop', 0.3], [T.qatel, 'alarm', 0.22],
  [T.ashan, 'swish', 0.3], [T.kalb2, 'pop', 0.25], [T.otta, 'pop', 0.25], [T.kharbeshak, 'swish', 0.4],
  [T.eghsel, 'bubbles', 0.32], [T.saboon, 'bubbles', 0.35], [T.saboon + 0.05, 'boing', 0.18],
  [T.mostashfa - 0.08, 'swish', 0.3], [T.mostashfa, 'ding', 0.3], [T.tat3eem1, 'sparkle', 0.3],
  [T.tat3eem2 - 0.05, 'whoosh', 0.28], [T.bey7meek, 'sparkle', 0.3], [T.mayya100, 'ding', 0.3],
  [T.share - 0.08, 'swish', 0.28], [T.share + 0.35, 'click', 0.45], [T.yenqez, 'pop', 0.3],
  [T.fahman - 0.15, 'swish', 0.3], [T.fahman, 'pop', 0.25], [T.kasban, 'twinkle', 0.4],
];
const POSE_SWAP_SFX: Cue[] = POSES.slice(2).map(([t]) => [t - 0.06, 'swish', 0.1]);

// ============================================================ composition
export const Rabies: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam0 = camAt(t, CAM0, CAM_KEYS);
  const sh = shakeAt(t, SHAKES);
  const cam: Cam = {x: cam0.x - sh.x, y: cam0.y - sh.y, z: cam0.z};
  const pose = poseAt(t, POSES);
  const squash = squashAt(t, POSES);
  const vf = Math.round((t - VO) * FPS);
  const talking = TALKABLE.includes(pose) && vf >= 0 && vf < MOUTH.length;
  const mouth = talking ? MOUTH[vf] : 0;
  const blink = BLINKS.some((b) => t >= b && t < b + 0.1) && pose !== 'shocked';
  const wink = winkOn(t) && pose === 'temple';
  // signature: dim the room while he stares
  const dim = t >= T.estanna - 0.02 && t < T.law ? 0.38 * easeOut(seg(t, T.estanna - 0.02, T.estanna + 0.12)) * (1 - seg(t, T.law - 0.3, T.law)) : 0;
  const redPulse = t >= T.qatel && t < T.qatel + 1.6 ? 0.22 * Math.max(0, Math.sin((t - T.qatel) * 7)) * (1 - (t - T.qatel) / 1.6) : 0;
  const groups = groupWords(words, VO, {gold: ['الفهمان', 'كسبان'], big: ['استنى...']});
  const COLORS: Record<string, string> = {};
  for (const w of ['فيروس', 'كوباية', 'مية', 'السعار', 'الكلب', 'الفيروس', 'الأعصاب', 'للمخ', 'تبلع', 'تقلصات', 'الزور', 'المية', 'اغسل', 'بمية', 'وصابون', 'مستشفى', 'فورا', 'التطعيم', 'بدري', 'بيحميك', 'شير'])
    COLORS[norm(w)] = YELLOW;
  for (const w of ['تترعب', 'استنى', 'الغريب', 'قاتل', 'عضك', 'خربشك', 'يخاف']) COLORS[norm(w)] = RED;
  return (
    <AbsoluteFill style={{backgroundColor: '#1d1410'}}>
      <Fonts />
      <SetBack cam={cam} dim={dim} />
      <Layer cam={cam} z={1000}>
        <Board t={t} />
        <Character pose={pose} mouth={mouth} blink={blink} wink={wink} x={CHAR_X} y={CHAR_Y} scale={CS} squash={squash} t={t}>
          {/* sweat drop on "جامدة" */}
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <SweatDrop x={HEAD[0] + 250} y={HEAD[1] - 140} dt={t - T.gamda} s={1.3} />
            <SweatDrop x={HEAD[0] - 260} y={HEAD[1] - 120} dt={t - T.qatel - 0.1} s={1.1} />
            {wink && t >= VO && <Sparkle x={HEAD[0] + 210} y={HEAD[1] - 40} dt={t - T.kasban} r={48} />}
          </svg>
        </Character>
      </Layer>
      <SetFront cam={cam} dim={dim} />
      <Layer cam={cam} z={1000}><HookGlass t={t} /></Layer>
      {/* vignette, deeper during the signature line, red pulse on "قاتل" */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${0.28 + dim}) 100%)`}} />
      {redPulse > 0 && <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 45%, rgba(255,60,40,0) 45%, rgba(255,60,40,${redPulse}) 100%)`}} />}
      {/* captions at ~65% of the frame height: clear of the Shorts/TikTok channel name, title and buttons */}
      <Captions t={t} groups={groups} colors={COLORS} y={1250} x={460} />
      <Sequence from={Math.round(VO * FPS)}><Audio src={staticFile('elfahman/rabies/vo/take1.mp3')} volume={1} /></Sequence>
      {[...SFX, ...POSE_SWAP_SFX].map(([tt, n, v], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(tt * FPS))} durationInFrames={Math.round(1.6 * FPS)}>
          <Audio src={staticFile(`elfahman/sfx/${n}.wav`)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
