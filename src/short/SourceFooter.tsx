import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { FONT_BODY } from './fonts';
import { CONTENT, FOOTER_Y } from './layout';
import { maxMode, SIDE_CAPTION, SIDE_FOOTER_Y, EXP_FOOTER_Y, VERSUS } from './geometry';

// Small source line at the bottom of any scene that makes a claim.
export const SourceFooter: React.FC<{ label: string; sceneType: string; fill?: boolean }> = ({ label, sceneType, fill }) => {
  const f = useCurrentFrame();
  const side = maxMode(sceneType) === 'reactor';
  return (
    <div
      style={{
        position: 'absolute',
        left: fill ? 28 : side ? SIDE_CAPTION.x : CONTENT.x,
        top: fill ? 206 : side ? SIDE_FOOTER_Y : maxMode(sceneType) === 'none' ? (sceneType === 'ClipScene' ? VERSUS.footerY : EXP_FOOTER_Y) : FOOTER_Y,
        maxWidth: side ? SIDE_CAPTION.w : CONTENT.width,
        opacity: interpolate(f, [4, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        fontFamily: FONT_BODY,
        fontWeight: 700,
        fontSize: side || sceneType === 'ClipScene' ? 26 : 30,
        color: '#E8ECFF',
        background: 'rgba(8,9,24,0.72)',
        border: '2px solid rgba(184,255,46,0.55)',
        borderRadius: 14,
        padding: '6px 16px',
      }}
    >
      Source: {label}
    </div>
  );
};
