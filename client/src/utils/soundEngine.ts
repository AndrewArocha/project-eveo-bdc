// src/utils/soundEngine.ts

export interface AudioAndHapticSettings {
  soundEnabled: boolean;
  uiVolume: number;
  ambientEnabled: boolean;
  ambientVolume: number;
  vibrationEnabled: boolean;
}

const DEFAULT_SETTINGS: AudioAndHapticSettings = {
  soundEnabled: true,
  uiVolume: 0.5,
  ambientEnabled: true,
  ambientVolume: 0.05,
  vibrationEnabled: true,
};

export function getAudioPreferences(): AudioAndHapticSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem('eveo_settings');
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AudioAndHapticSettings>;
    return {
      soundEnabled: parsed.soundEnabled !== false,
      uiVolume: typeof parsed.uiVolume === 'number' ? parsed.uiVolume : 0.5,
      ambientEnabled: parsed.ambientEnabled !== false,
      ambientVolume: typeof parsed.ambientVolume === 'number' ? parsed.ambientVolume : 0.05,
      vibrationEnabled: parsed.vibrationEnabled !== false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function updateAudioPreferences(patch: Partial<AudioAndHapticSettings>): AudioAndHapticSettings {
  const current = getAudioPreferences();
  const next = { ...current, ...patch };
  if (typeof window !== 'undefined') {
    try {
      const existingRaw = localStorage.getItem('eveo_settings');
      const existingObj = existingRaw ? JSON.parse(existingRaw) : {};
      localStorage.setItem('eveo_settings', JSON.stringify({ ...existingObj, ...next }));
      window.dispatchEvent(new CustomEvent('eveo:audio-settings-updated', { detail: next }));
    } catch {
      // Ignore storage errors
    }
  }
  syncAmbientWithPreferences(next);
  return next;
}

const createAudio = (src: string | string[], baseVolume = 1, loop = false) => {
  if (typeof window !== 'undefined') {
    if (Array.isArray(src)) {
      return src.map((s) => {
        const audio = new Audio(s);
        audio.dataset.baseVolume = String(baseVolume);
        audio.volume = baseVolume;
        audio.loop = loop;
        return audio;
      });
    } else {
      const audio = new Audio(src);
      audio.dataset.baseVolume = String(baseVolume);
      audio.volume = baseVolume;
      audio.loop = loop;
      return audio;
    }
  }
  return null;
};

// --- 1. INITIALIZE AUDIO FILES ---
const startSounds = createAudio(['/audio/Start1.mp3', '/audio/Start2.mp3'], 0.6);
const modalOpenSounds = createAudio(['/audio/OpenModal1.mp3', '/audio/OpenModal2.mp3'], 0.5);
const typewriter = createAudio('/audio/Typewriter.mp3', 0.5, true);
const ambientHum = createAudio('/audio/AmbientHum.mp3', 0.12, true);
const galleryClick = createAudio('/audio/GalleryClick.mp3', 0.4);
const cardScroll = createAudio('/audio/CardScroll.mp3', 0.3);
const onHover = createAudio('/audio/OnHover.mp3', 0.15);
const leaveSound = createAudio('/audio/LeaveButton.mp3', 0.5);
const downloadSound = createAudio('/audio/DownloadButton.mp3', 0.5);
const backSound = createAudio('/audio/Back.mp3', 0.4);

// Notification Audio Files (Place in /public/audio/woodBlock.mp3 & /public/audio/socialMediaChime.mp3)
const woodBlockAudio = createAudio('/audio/woodBlock.mp3', 0.85);
const socialChimeAudio = createAudio('/audio/socialMediaChime.mp3', 0.7);

// --- 2. UNIVERSAL PLAYBACK ENGINE ---
const playSound = (audioRef: HTMLAudioElement | HTMLAudioElement[] | null, fallbackTone?: () => void) => {
  if (!audioRef) return;
  const { soundEnabled, uiVolume } = getAudioPreferences();
  if (!soundEnabled || uiVolume <= 0) return;

  const targetAudio = Array.isArray(audioRef)
    ? audioRef[Math.floor(Math.random() * audioRef.length)]
    : audioRef;

  const baseVol = Number(targetAudio.dataset.baseVolume ?? 0.5);
  targetAudio.volume = Math.min(1, Math.max(0, baseVol * (uiVolume * 1.6)));
  targetAudio.currentTime = 0;
  targetAudio.play().catch(() => {
    if (fallbackTone) fallbackTone();
  });
};

// Mobile Haptic Vibration Helper
export const triggerMobileVibration = (pattern: number | number[] = [120, 60, 160]) => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  const { vibrationEnabled } = getAudioPreferences();
  if (!vibrationEnabled) return;
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore on unsupported browsers
    }
  }
};

// Web Audio fallback for WoodBlock (if mp3 path isn't loaded yet)
function synthWoodBlockFallback(volumeMultiplier: number) {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [0, 0.11].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(idx === 0 ? 780 : 1040, now + offset);
      osc.frequency.exponentialRampToValueAtTime(320, now + offset + 0.085);
      gain.gain.setValueAtTime(0.45 * volumeMultiplier, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.095);
    });
  } catch {
    // Ignore
  }
}

// Web Audio fallback for SocialMediaChime
function synthSocialChimeFallback(volumeMultiplier: number) {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [587.33, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.28 * volumeMultiplier, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.36);
    });
  } catch {
    // Ignore
  }
}

// --- 3. EXPORTED TRIGGERS ---
export const playStart = () => playSound(startSounds);
export const playModalOpen = () => playSound(modalOpenSounds);
export const playGalleryClick = () => playSound(galleryClick);
export const playCardScroll = () => playSound(cardScroll);
export const playHover = () => playSound(onHover);
export const playLeave = () => playSound(leaveSound);
export const playDownload = () => playSound(downloadSound);
export const playBack = () => playSound(backSound);

/**
 * High-Alert WoodBlock Knock + Mobile Haptic Vibration!
 * Used for High SLAs (>4m wait), Unconfirmed Appointments, and Booking a SOLD/DELIVERED Vehicle.
 */
export const playWoodBlockAlert = () => {
  triggerMobileVibration([130, 55, 170]);
  const { uiVolume } = getAudioPreferences();
  playSound(woodBlockAudio, () => synthWoodBlockFallback(uiVolume));
};

/**
 * Airy Social Media Chime!
 * Used for Standard Notifications (New Leads, Confirmed Appts, Inventory Sync Complete).
 */
export const playSocialMediaChime = () => {
  triggerMobileVibration(45);
  const { uiVolume } = getAudioPreferences();
  playSound(socialChimeAudio, () => synthSocialChimeFallback(uiVolume));
};

export function syncAmbientWithPreferences(prefs = getAudioPreferences()) {
  if (Array.isArray(ambientHum) || !ambientHum) return;
  if (!prefs.soundEnabled || !prefs.ambientEnabled || prefs.ambientVolume <= 0) {
    ambientHum.pause();
    return;
  }
  ambientHum.volume = Math.min(1, Math.max(0, prefs.ambientVolume * 0.35));
  if (ambientHum.paused) {
    ambientHum.play().catch(() => {});
  }
}

export const startAmbient = () => {
  syncAmbientWithPreferences(getAudioPreferences());
};

export const stopAmbient = () => {
  if (!Array.isArray(ambientHum) && ambientHum) {
    ambientHum.pause();
    ambientHum.currentTime = 0;
  }
};

export const startTypewriter = () => {
  const { soundEnabled } = getAudioPreferences();
  if (!soundEnabled) return;
  if (!Array.isArray(typewriter)) typewriter?.play().catch(() => {});
};

export const stopTypewriter = () => {
  if (!Array.isArray(typewriter) && typewriter) {
    typewriter.pause();
    typewriter.currentTime = 0;
  }
};

export const soundEngine = {
  click: playGalleryClick,
  hover: playHover,
  open: playModalOpen,
  back: playBack,
  scroll: playCardScroll,
  download: playDownload,
  woodBlock: playWoodBlockAlert,
  chime: playSocialMediaChime,
};