import React from 'react';
import {Composition} from 'remotion';
import {Woodpecker, DURATION_S} from './woodpecker/Woodpecker';
import {FPS} from './woodpecker/lib';

export const RemotionRoot: React.FC = () => (
  <Composition id="Woodpecker" component={Woodpecker} durationInFrames={Math.round(DURATION_S * FPS)}
    fps={FPS} width={1080} height={1920} />
);
