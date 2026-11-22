import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { FONT_BODY } from './fonts';
import { CONTENT, FOOTER_Y } from './layout';

// Small source line at the bottom of any scene that makes a claim.
export const SourceFooter: React.FC<{ label: string }> = ({ label }) => {
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: CONTENT.x,
        top: FOOTER_Y,
        maxWidth: CONTENT.width,
        opacity: interpolate(f, [4, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        fontFamily: FONT_BODY,
        fontWeight: 700,
        fontSize: 30,
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
