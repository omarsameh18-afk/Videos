// Channel + render config. Everything brand-specific lives here.
export const CHANNEL = {
  name: 'BrainPump',
  handle: '@brainpump_us',
  catchphrase: 'Pump your brain.',
};

export const CHARACTER = {
  name: 'Max',
  // Max never calls himself (or shows text saying) doctor / scientist / coach / PT,
  // and never gives medical advice. The script validator rejects these words.
  bannedWords: ['doctor', 'dr.', 'scientist', 'coach', 'personal trainer', 'physio', 'diagnos', 'prescri'],
};

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  maxSeconds: 60,
};

// YouTube Shorts UI overlays (title, channel row, like/comment/share column).
// Keep captions and key content inside SAFE.
export const SAFE_ZONE = {
  top: 140, // status bar / search
  bottom: 384, // ~20% of 1920: title + channel + music row
  right: 140, // action buttons column
  left: 48,
};
export const SAFE = {
  x: SAFE_ZONE.left,
  y: SAFE_ZONE.top,
  width: VIDEO.width - SAFE_ZONE.left - SAFE_ZONE.right,
  height: VIDEO.height - SAFE_ZONE.top - SAFE_ZONE.bottom,
  bottomY: VIDEO.height - SAFE_ZONE.bottom,
  centerX: SAFE_ZONE.left + (VIDEO.width - SAFE_ZONE.left - SAFE_ZONE.right) / 2,
};
