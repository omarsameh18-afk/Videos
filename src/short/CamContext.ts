import React from 'react';
import { CaptionPage } from './types';
/** Caption phrase timings, so scenes can cut-zoom the camera on every new phrase. */
export const CamContext = React.createContext<CaptionPage[]>([]);
