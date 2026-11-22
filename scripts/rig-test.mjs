// Renders review/rig-test.mp4: lip-sync on public/rigtest/test.mp3 + blink + brow/pose springs.
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { computeAmplitude } from './lib/amplitude.mjs';

const { amplitude } = computeAmplitude('public/rigtest/test.mp3', 30);
const props = join(tmpdir(), 'rigtest-props.json');
writeFileSync(props, JSON.stringify({ amplitude }));
mkdirSync('review', { recursive: true });
execFileSync('npx', ['remotion', 'render', 'src/index.ts', 'RigTest', 'review/rig-test.mp4', `--props=${props}`], { stdio: 'inherit' });
