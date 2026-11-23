import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../max/theme';
import { FONT_BODY } from './fonts';
import { CAPTION_H, CAPTION_Y, CONTENT } from './layout';
import { maxMode, SIDE_CAPTION, captionYFor } from './geometry';
import { CaptionPage, Word } from './types';

// Word-by-word captions: one short page at a time, the spoken word highlighted in lime.
export const Captions: React.FC<{ pages: CaptionPage[]; words: Word[]; emphasis: number[]; sceneType: string; fill?: boolean }> = ({ pages, words, emphasis, sceneType, fill }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const page = pages.find((p) => t >= p.start - 0.05 && t < p.end);
  const mode = maxMode(sceneType);
  if (!page || mode === 'end') return null; // end card: the hero text is the caption
  const box = fill ? { x: 50, y: 1425, w: 880, h: 140 } : mode === 'reactor' ? SIDE_CAPTION : { x: CONTENT.x, y: mode === 'none' ? captionYFor(sceneType) : CAPTION_Y, w: CONTENT.width, h: sceneType === 'ClipScene' ? 145 : CAPTION_H };
  const pageIn = spring({ frame: frame - Math.round(page.start * fps), fps, config: { damping: 14, stiffness: 260 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        width: box.w,
        top: box.y,
        height: box.h,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        alignContent: 'center',
        gap: '0 30px',
        transform: `scale(${interpolate(pageIn, [0, 1], [0.85, 1])})`,
      }}
    >
      {page.words.map((wi) => {
        const w = words[wi];
        const active = t >= w.start - 0.03 && t < w.end + 0.05;
        const said = t >= w.start - 0.03;
        const pop = active ? spring({ frame: frame - Math.round(w.start * fps), fps, config: { damping: 10, stiffness: 300 } }) : 1;
        return (
          <span
            key={wi}
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 900,
              fontSize: fill ? 72 : mode === 'reactor' ? 66 : sceneType === 'ClipScene' ? 62 : 70,
              lineHeight: 1.12,
              textTransform: 'uppercase',
              // VISUAL RULE 4: lime only on the one key word
              color: emphasis.includes(wi) ? C.accent : '#FFFFFF',
              opacity: said ? 1 : 0.55,
              WebkitTextStroke: '14px #0B0C1C',
              paintOrder: 'stroke fill',
              textShadow: '0 6px 0 rgba(0,0,0,0.45)',
              display: 'inline-block',
              padding: '0 4px',
              transformOrigin: 'center bottom',
              transform: `scale(${active ? interpolate(pop, [0, 1], [1.06, 1]) : 1})`,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
