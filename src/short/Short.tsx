import React from 'react';
import { AbsoluteFill, Audio, CalculateMetadataFunction, Sequence, staticFile, useCurrentFrame } from 'remotion';
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

const SCENES: Record<string, React.FC<SceneProps>> = { Hook, WrongVsRight, StatCard, Outro, MuscleHighlight };

export const Short: React.FC<ShortProps> = (props) => {
  waitForFonts();
  const { script, scenes, pages, words, audioSrc, shakes, emphasisWords } = props;
  const frame = useCurrentFrame();
  // camera shake on key words: decaying jitter over 8 frames
  const sh = [...shakes].reverse().find((s) => s <= frame && frame - s < 8);
  const k = sh === undefined ? 0 : (8 - (frame - sh)) / 8;
  const shake = `translate(${Math.sin(frame * 3.1) * 14 * k}px, ${Math.cos(frame * 2.3) * 10 * k}px)`;
  return (
    <AbsoluteFill style={{ transform: shake }}>
      <Background />
      <MaxLayer {...props} />
      {/* scene text + cards sit above Max so his zooms never cover them */}
      {scenes.map((t, i) => {
        const sc = script.scenes[i];
        const Comp = SCENES[sc.type];
        return (
          <Sequence key={i} from={t.from} durationInFrames={t.durationInFrames} name={`${i} ${sc.type}`}>
            <Comp scene={sc} timing={t} script={script} />
          </Sequence>
        );
      })}
      <Captions pages={pages} words={words} emphasis={emphasisWords} />
      {scenes.map((t, i) => {
        const si = script.scenes[i].sourceIndex;
        return si === undefined ? null : (
          <Sequence key={`src${i}`} from={t.from} durationInFrames={t.durationInFrames}>
            <SourceFooter label={script.meta.sources[si].label} />
          </Sequence>
        );
      })}
      {audioSrc && <Audio src={staticFile(audioSrc)} />}
    </AbsoluteFill>
  );
};

export const calculateShortMetadata: CalculateMetadataFunction<ShortProps> = ({ props }) => ({
  durationInFrames: Math.max(1, props.durationInFrames),
});
