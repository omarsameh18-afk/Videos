import { Config } from '@remotion/cli/config';

// Upload-ready defaults: H.264, yuv420p (limited range, bt709), AAC.
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setColorSpace('bt709');
Config.setAudioCodec('aac');
Config.setOverwriteOutput(true);
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
