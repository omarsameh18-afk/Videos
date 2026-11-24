import React from 'react';
import { AbsoluteFill, Audio, CalculateMetadataFunction, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { pulseAt } from './camera';
import { Background } from './Background';
import { Captions } from './Captions';
import { MaxLayer } from './MaxLayer';
import { SourceFooter } from './SourceFooter';
import { waitForFonts } from './fonts';
import { ShortProps } from './types';
import { Hook } from './scenes/Hook';
import { WrongVsRight } from './scenes/WrongVsRight';
import { StatCard } from './scenes/StatCard';
import { Outro } from './scenes/Outro';
import { MuscleHighlight } from './scenes/MuscleHighlight';
import { SceneProps } from './scenes/types';
import { AnimatedChart, Gauge, MuscleZoom, SplitVersus, BigNumber } from './scenes/Visuals';
import type { BackgroundName } from '../config';
import { SubjectsLayer } from './experiment/SubjectsLayer';
import { DayCounter, GymSet, Reveal, SplitClone } from './experiment/Overlays';
import { ClipSceneView } from './clips/ClipScene';
import { CamContext } from './CamContext';

const SCENES: Record<string, React.FC<SceneProps>> = { Hook, WrongVsRight, StatCard, Outro, MuscleHighlight, AnimatedChart, Gauge, MuscleZoom, SplitVersus, BigNumber, SplitClone, GymSet, DayCounter, Reveal, ClipScene: ClipSceneView };

export const Short: React.FC<ShortProps> = (props) => {
  waitForFonts();
  const { script, scenes, pages, words, audioSrc, shakes, emphasisWords, zoomKeys } = props;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = pulseAt(zoomKeys, frame, fps);
  // camera shake on key words: decaying jitter over 8 frames
  const sh = [...shakes].reverse().find((s) => s <= frame && frame - s < 8);
  const k = sh === undefined ? 0 : (8 - (frame - sh)) / 8;
  const shake = `translate(${Math.sin(frame * 3.1) * 14 * k}px, ${Math.cos(frame * 2.3) * 10 * k}px)`;
  return (
    <CamContext.Provider value={pages}>
    <AbsoluteFill style={{ transform: shake }}>
      {scenes.map((t, i) => (
        <Sequence key={`bg${i}`} from={t.from} durationInFrames={t.durationInFrames}>
          <Background zoomKeys={zoomKeys.map((z) => ({ ...z, at: z.at - t.from }))} variant={t.background as BackgroundName} />
        </Sequence>
      ))}
      <MaxLayer {...props} />
      <SubjectsLayer {...props} />
      {/* scene text + cards sit above Max so his zooms never cover them */}
      {scenes.map((t, i) => {
        const sc = script.scenes[i];
        const Comp = SCENES[sc.type];
        return (
          <Sequence key={i} from={t.from} durationInFrames={t.durationInFrames} name={`${i} ${sc.type}`}>
            <Comp scene={sc} timing={t} script={script} pulse={pulse} />
          </Sequence>
        );
      })}
      <Captions pages={pages} words={words} emphasis={emphasisWords} sceneType={script.scenes[Math.max(0, scenes.findLastIndex((t) => t.from <= frame))].type} fill={(script.scenes[Math.max(0, scenes.findLastIndex((t) => t.from <= frame))].props as { layout?: string }).layout === 'fill'} />
      {scenes.map((t, i) => {
        const si = script.scenes[i].sourceIndex;
        return si === undefined ? null : (
          <Sequence key={`src${i}`} from={t.from} durationInFrames={t.durationInFrames}>
            <SourceFooter label={script.meta.sources[si].label} sceneType={script.scenes[i].type} fill={(script.scenes[i].props as { layout?: string }).layout === 'fill'} />
          </Sequence>
        );
      })}
      {audioSrc && <Audio src={staticFile(audioSrc)} />}
    </AbsoluteFill>
    </CamContext.Provider>
  );
};

export const calculateShortMetadata: CalculateMetadataFunction<ShortProps> = ({ props }) => ({
  durationInFrames: Math.max(1, props.durationInFrames),
});
