const SHAKE_SOUND_URL = "/sounds/sticker-shake.mp3";
const SHAKE_VOLUME = 0.55;

const COPY_SOUND_URL = "/sounds/copy-confirm.mp3";
const COPY_VOLUME = 0.34;

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

/**
 * Synchronously create and resume the shared AudioContext inside a user gesture
 * (e.g. before an async clipboard write) so Safari/iOS allows subsequent playback.
 */
export function unlockAudioContext(): void {
  const ctx = ensureAudioContext();
  if (!ctx || ctx.state !== "suspended") return;
  void ctx.resume().catch(() => undefined);
}

interface SoundChannelConfig {
  url: string;
  volume: number;
  pitchMin: number;
  pitchSpan: number;
}

function createSoundChannel(config: SoundChannelConfig) {
  let rawBytes: ArrayBuffer | null = null;
  let fetchPromise: Promise<ArrayBuffer | null> | null = null;
  let decodedBuffer: AudioBuffer | null = null;
  let decodePromise: Promise<AudioBuffer | null> | null = null;
  let activeSource: AudioBufferSourceNode | null = null;
  let playbackSeq = 0;

  function fetchRawBytes(): Promise<ArrayBuffer | null> {
    if (rawBytes) return Promise.resolve(rawBytes);
    if (fetchPromise) return fetchPromise;

    fetchPromise = fetch(config.url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${config.url}`);
        return res.arrayBuffer();
      })
      .then((data) => {
        rawBytes = data;
        return data;
      })
      .catch(() => {
        fetchPromise = null;
        return null;
      });

    return fetchPromise;
  }

  function loadBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
    if (decodedBuffer) return Promise.resolve(decodedBuffer);
    if (decodePromise) return decodePromise;

    decodePromise = fetchRawBytes()
      .then((bytes) => {
        if (!bytes) return null;
        // Clone so decodeAudioData never detaches the cached raw buffer
        return ctx.decodeAudioData(bytes.slice(0));
      })
      .then((decoded) => {
        if (decoded) {
          decodedBuffer = decoded;
          rawBytes = null;
        } else {
          decodePromise = null;
        }
        return decoded;
      })
      .catch(() => {
        decodePromise = null;
        return null;
      });

    return decodePromise;
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
    source.playbackRate.value = config.pitchMin + Math.random() * config.pitchSpan;

    const gain = ctx.createGain();
    gain.gain.value = config.volume;

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

  function preload(): void {
    if (typeof window === "undefined" || decodedBuffer || rawBytes || fetchPromise) {
      return;
    }
    void fetchRawBytes();
  }

  function play(delayMs = 0): void {
    const ctx = ensureAudioContext();
    if (!ctx) return;

    const seq = ++playbackSeq;
    const startedAt = performance.now();

    // Resume synchronously inside the user gesture to satisfy autoplay policy
    const ready =
      ctx.state === "suspended"
        ? ctx.resume().catch(() => undefined)
        : Promise.resolve();

    if (decodedBuffer) {
      const buffer = decodedBuffer;
      void ready.then(() => {
        if (seq !== playbackSeq) return;
        const elapsedSec = (performance.now() - startedAt) / 1000;
        const remainingSec = Math.max(0, delayMs / 1000 - elapsedSec);
        scheduleBuffer(ctx, buffer, remainingSec);
      });
      return;
    }

    void Promise.all([ready, loadBuffer(ctx)]).then(([, buffer]) => {
      if (!buffer || seq !== playbackSeq) return;
      const elapsedSec = (performance.now() - startedAt) / 1000;
      const remainingSec = Math.max(0, delayMs / 1000 - elapsedSec);
      scheduleBuffer(ctx, buffer, remainingSec);
    });
  }

  return { preload, play };
}

const shakeChannel = createSoundChannel({
  url: SHAKE_SOUND_URL,
  volume: SHAKE_VOLUME,
  // Subtle organic pitch variation so repeated locates never feel robotic
  pitchMin: 0.97,
  pitchSpan: 0.06,
});

const copyChannel = createSoundChannel({
  url: COPY_SOUND_URL,
  volume: COPY_VOLUME,
  // Gentle pitch nuance so repeated copies stay warm and organic
  pitchMin: 0.985,
  pitchSpan: 0.03,
});

/**
 * Play the crisp paper-shake sound effect when locating a sticker on the canvas.
 * Call synchronously inside the user gesture (click / keydown) so Safari/iOS
 * unlocks the AudioContext before the scheduled delay fires.
 */
export function playLocateShakeSound(delayMs = 180): void {
  shakeChannel.play(delayMs);
}

/**
 * Prefetch the copy confirmation sound bytes without touching AudioContext,
 * so the very first copy click plays with zero network latency.
 */
export function preloadCopySound(): void {
  copyChannel.preload();
}

/**
 * Play the gentle two-note confirmation chime when copying code or install commands.
 */
export function playCopySound(): void {
  copyChannel.play(0);
}

let noiseBufferCache: AudioBuffer | null = null;

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noiseBufferCache && noiseBufferCache.sampleRate === ctx.sampleRate) {
    return noiseBufferCache;
  }
  const length = Math.floor(ctx.sampleRate * 0.08);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBufferCache = buffer;
  return buffer;
}

function withReadyAudioContext(fn: (ctx: AudioContext) => void): void {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx
      .resume()
      .then(() => {
        if (ctx.state === "running") {
          fn(ctx);
        }
      })
      .catch(() => undefined);
    return;
  }

  if (ctx.state === "running") {
    fn(ctx);
  }
}

/**
 * Soft matte paper-peel sound when lifting a sticker off the canvas.
 */
export function playStickerPeelSound(): void {
  withReadyAudioContext((ctx) => {
    const now = ctx.currentTime;
    const jitter = 0.96 + Math.random() * 0.08;

    // Tiny filtered noise whisper for the paper peel texture
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1600 * jitter, now);
    filter.frequency.exponentialRampToValueAtTime(3200 * jitter, now + 0.055);
    filter.Q.value = 1.4;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.045, now + 0.012);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.065);

    // Subtle rising soft pluck
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(280 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(430 * jitter, now + 0.05);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(0.05, now + 0.008);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  });
}

/**
 * Warm matte tap sound when pressing a dragged sticker back down onto the paper.
 */
export function playStickerPlaceSound(): void {
  withReadyAudioContext((ctx) => {
    const now = ctx.currentTime;
    const jitter = 0.95 + Math.random() * 0.1;

    // Soft low matte thump
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(290 * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(145 * jitter, now + 0.065);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(0.085, now + 0.006);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);

    // Brief soft paper-touch brush
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400 * jitter, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.032, now + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.04);
  });
}

/**
 * Soft two-note sweep when tidying moved stickers back to their original spots.
 */
export function playStickerResetSound(): void {
  withReadyAudioContext((ctx) => {
    const now = ctx.currentTime;
    const notes = [440, 554.37];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.055;
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.03, start + 0.09);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.048, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.12);
    });
  });
}
