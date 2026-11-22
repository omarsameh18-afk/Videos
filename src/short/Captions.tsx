import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../max/theme';
import { FONT_BODY } from './fonts';
import { CAPTION_H, CAPTION_Y, CONTENT } from './layout';
import { CaptionPage, Word } from './types';

// Word-by-word captions: one short page at a time, the spoken word highlighted in lime.
export const Captions: React.FC<{ pages: CaptionPage[]; words: Word[]; emphasis: number[] }> = ({ pages, words, emphasis }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const page = pages.find((p) => t >= p.start - 0.05 && t < p.end);
  if (!page) return null;
  const pageIn = spring({ frame: frame - Math.round(page.start * fps), fps, config: { damping: 14, stiffness: 260 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: CONTENT.x,
        width: CONTENT.width,
        top: CAPTION_Y,
        height: CAPTION_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        gap: '0 26px',
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
              fontSize: 70,
              lineHeight: 1.12,
              textTransform: 'uppercase',
              // VISUAL RULE 4: lime only on the one key word
              color: emphasis.includes(wi) ? C.accent : '#FFFFFF',
              opacity: said ? 1 : 0.55,
              WebkitTextStroke: '14px #0B0C1C',
              paintOrder: 'stroke fill',
              textShadow: '0 6px 0 rgba(0,0,0,0.45)',
              display: 'inline-block',
              transform: `scale(${active ? interpolate(pop, [0, 1], [1.1, 1.04]) : 1})`,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
