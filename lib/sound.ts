const SHAKE_SOUND_URL = "/sounds/sticker-shake.mp3";
const SHAKE_VOLUME = 0.55;

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  if ("AudioContext" in window) return window.AudioContext;
  const legacy = (
    window as Window & { webkitAudioContext?: AudioContextConstructor }
  ).webkitAudioContext;
  return legacy ?? null;
}

let audioCtx: AudioContext | null = null;
let shakeBuffer: AudioBuffer | null = null;
let loadPromise: Promise<AudioBuffer | null> | null = null;
let activeSource: AudioBufferSourceNode | null = null;
let playbackSeq = 0;

function ensureAudioContext(): AudioContext | null {
  if (audioCtx) return audioCtx;
  const Ctor = getAudioContextConstructor();
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
    return audioCtx;
  } catch {
    return null;
  }
}

function loadShakeBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (shakeBuffer) return Promise.resolve(shakeBuffer);
  if (loadPromise) return loadPromise;

  loadPromise = fetch(SHAKE_SOUND_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${SHAKE_SOUND_URL}`);
      return res.arrayBuffer();
    })
    .then((data) => ctx.decodeAudioData(data))
    .then((decoded) => {
      shakeBuffer = decoded;
      return decoded;
    })
    .catch(() => {
      loadPromise = null;
      return null;
    });

  return loadPromise;
}

function scheduleBuffer(
  ctx: AudioContext,
  buffer: AudioBuffer,
  delaySec: number,
) {
  if (activeSource) {
    try {
      activeSource.stop();
    } catch {
      // Ignore if already stopped
    }
    activeSource = null;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  // Subtle organic pitch variation so repeated locates never feel robotic
  source.playbackRate.value = 0.97 + Math.random() * 0.06;

  const gain = ctx.createGain();
  gain.gain.value = SHAKE_VOLUME;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.onended = () => {
    if (activeSource === source) {
      activeSource = null;
    }
  };

  activeSource = source;
  source.start(ctx.currentTime + Math.max(0, delaySec));
}

/**
 * Play the crisp paper-shake sound effect when locating a sticker on the canvas.
 * Call synchronously inside the user gesture (click / keydown) so Safari/iOS
 * unlocks the AudioContext before the scheduled delay fires.
 */
export function playLocateShakeSound(delayMs = 180): void {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const seq = ++playbackSeq;
  const startedAt = performance.now();

  // Resume synchronously inside the user gesture to satisfy autoplay policy
  const ready =
    ctx.state === "suspended" ? ctx.resume().catch(() => undefined) : Promise.resolve();

  if (shakeBuffer) {
    void ready.then(() => {
      if (seq !== playbackSeq) return;
      const elapsedSec = (performance.now() - startedAt) / 1000;
      const remainingSec = Math.max(0, delayMs / 1000 - elapsedSec);
      scheduleBuffer(ctx, shakeBuffer!, remainingSec);
    });
    return;
  }

  void Promise.all([ready, loadShakeBuffer(ctx)]).then(([, buffer]) => {
    if (!buffer || seq !== playbackSeq) return;
    const elapsedSec = (performance.now() - startedAt) / 1000;
    const remainingSec = Math.max(0, delayMs / 1000 - elapsedSec);
    scheduleBuffer(ctx, buffer, remainingSec);
  });
}
