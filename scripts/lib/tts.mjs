// ElevenLabs text-to-speech *with character timestamps*, cached by a hash of (voice, model, text).
// Key: ELEVENLABS_API_KEY in .env (never committed).
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';

// Respect HTTPS_PROXY (Node's fetch ignores it by default).
if (process.env.HTTPS_PROXY || process.env.https_proxy) setGlobalDispatcher(new EnvHttpProxyAgent());

export const CACHE_DIR = '.cache/tts';

export function loadEnv(file = '.env') {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export const ttsHash = ({ voiceId, modelId, text }) =>
  createHash('sha256').update(JSON.stringify([voiceId, modelId, text])).digest('hex').slice(0, 16);

/** Returns { mp3, timestamps } file paths. Calls the API only on a cache miss. */
export async function synthesize({ voiceId, modelId, text }) {
  const hash = ttsHash({ voiceId, modelId, text });
  mkdirSync(CACHE_DIR, { recursive: true });
  const mp3 = join(CACHE_DIR, `${hash}.mp3`);
  const timestamps = join(CACHE_DIR, `${hash}.timestamps.json`);
  if (existsSync(mp3) && existsSync(timestamps)) return { mp3, timestamps, cached: true };

  loadEnv();
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY is not set (put it in .env), or pass an MP3 + timestamps JSON to render.');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ text, model_id: modelId }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  writeFileSync(mp3, Buffer.from(j.audio_base64, 'base64'));
  writeFileSync(
    timestamps,
    JSON.stringify({ text, voiceId, modelId, alignment: j.alignment, normalized_alignment: j.normalized_alignment }, null, 1),
  );
  return { mp3, timestamps, cached: false };
}
