import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './elfahman/lib/anim';
import {Rabies, RABIES_DURATION_S} from './elfahman/videos/Rabies';
import {Mummies, MUMMIES_DURATION_S} from './elfahman/videos/Mummies';
import {Doorway, DOORWAY_DURATION_S} from './elfahman/videos/Doorway';

// الفهمان series: one composition per episode (1080x1920, 60 fps)
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Elfahman01Rabies" component={Rabies} durationInFrames={Math.round(RABIES_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman02Mummies" component={Mummies} durationInFrames={Math.round(MUMMIES_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman03Doorway" component={Doorway} durationInFrames={Math.round(DOORWAY_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
  </>
);
