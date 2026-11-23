import React from 'react';
import {Composition} from 'remotion';
import {FPS} from './elfahman/lib/anim';
import {Rabies, RABIES_DURATION_S} from './elfahman/videos/Rabies';
import {Mummies, MUMMIES_DURATION_S} from './elfahman/videos/Mummies';
import {Doorway, DOORWAY_DURATION_S} from './elfahman/videos/Doorway';
import {Writing, WRITING_DURATION_S} from './elfahman/videos/Writing';
import {Liar, LIAR_DURATION_S} from './elfahman/videos/Liar';
import {Sommaroy, SOMMAROY_DURATION_S} from './elfahman/videos/Sommaroy';
import {Humans, HUMANS_DURATION_S} from './elfahman/videos/Humans';
import {Screens, SCREENS_DURATION_S} from './elfahman/videos/Screens';
import {Tears, TEARS_DURATION_S} from './elfahman/videos/Tears';
import {Doomsday, DOOMSDAY_DURATION_S} from './elfahman/videos/Doomsday';
import {DoomsdayV2, DOOMSDAY_V2_DURATION_S} from './elfahman/videos/DoomsdayV2';
import {Earth, EARTH_DURATION_S} from './elfahman/videos/Earth';
import {Sun, SUN_DURATION_S} from './elfahman/videos/Sun';

// الفهمان series: one composition per episode (1080x1920, 60 fps)
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Elfahman01Rabies" component={Rabies} durationInFrames={Math.round(RABIES_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman02Mummies" component={Mummies} durationInFrames={Math.round(MUMMIES_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman03Doorway" component={Doorway} durationInFrames={Math.round(DOORWAY_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman04Writing" component={Writing} durationInFrames={Math.round(WRITING_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman05Liar" component={Liar} durationInFrames={Math.round(LIAR_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman06Sommaroy" component={Sommaroy} durationInFrames={Math.round(SOMMAROY_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman07Humans" component={Humans} durationInFrames={Math.round(HUMANS_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman08Screens" component={Screens} durationInFrames={Math.round(SCREENS_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman09Tears" component={Tears} durationInFrames={Math.round(TEARS_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman10Doomsday" component={Doomsday} durationInFrames={Math.round(DOOMSDAY_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman10DoomsdayV2" component={DoomsdayV2} durationInFrames={Math.round(DOOMSDAY_V2_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman11Earth" component={Earth} durationInFrames={Math.round(EARTH_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
    <Composition id="Elfahman12SunV2" component={Sun} durationInFrames={Math.round(SUN_DURATION_S * FPS)}
      fps={FPS} width={1080} height={1920} />
  </>
);
