import React from 'react';
import {Img, staticFile} from 'remotion';
import {Cam, Layer} from './camera';

// The reusable study set (public/elfahman/lib/set_bg.jpg + set_fg.png, 1152x2048), on the z = 1300 plane.
export const SET_Z = 1300;
const SW = 1480, SH = (SW * 2048) / 1152, SX = 540 - SW / 2, SY = 960 - SH / 2;
export const DESK_Y = SY + 1530 * (SH / 2048); // desk edge, set-plane world y
// screen y of the desk edge when the camera rests (used to place the character)
export const DESK_SCREEN_Y = 960 + (DESK_Y - 960) * (1000 / SET_Z);

const SetImg: React.FC<{src: string}> = ({src}) => (
  <Img src={staticFile(`elfahman/lib/${src}`)} style={{position: 'absolute', left: SX, top: SY, width: SW, height: SH}} />
);

export const SetBack: React.FC<{cam: Cam; dim?: number}> = ({cam, dim = 0}) => (
  <Layer cam={cam} z={SET_Z}>
    <SetImg src="set_bg.jpg" />
    {dim > 0 && <div style={{position: 'absolute', left: SX, top: SY, width: SW, height: SH, background: `rgba(10,8,20,${dim})`}} />}
  </Layer>
);
export const SetFront: React.FC<{cam: Cam; dim?: number}> = ({cam, dim = 0}) => (
  <Layer cam={cam} z={SET_Z}>
    <SetImg src="set_fg.png" />
    {dim > 0 && <div style={{position: 'absolute', left: SX, top: DESK_Y - 60, width: SW, height: SH, background: `rgba(10,8,20,${dim})`,
      WebkitMaskImage: 'linear-gradient(transparent 0, black 60px)'}} />}
  </Layer>
);
