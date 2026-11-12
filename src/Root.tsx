import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './elfahman/lib/anim';
import {Rabies, RABIES_DURATION_S} from './elfahman/videos/Rabies';

// الفهمان series: one composition per episode (1080x1920, 60 fps)
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Elfahman01Rabies" component={Rabies} durationInFrames={Math.round(RABIES_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
  </>
);
