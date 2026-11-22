import type { SceneT, ScriptT } from '../../schema/script';
import type { SceneTiming } from '../types';
// pulse: 0..1 camera punch on this frame (cards scale a little instead of zooming)
export interface SceneProps { scene: SceneT; timing: SceneTiming; script: ScriptT; pulse: number }
