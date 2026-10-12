class SoundEngine {
  private getSettings() {
    const saved = localStorage.getItem('eveo_settings');
    return saved ? JSON.parse(saved) : { soundEnabled: true, uiVolume: 0.5 };
  }

  private play(src: string, baseVolume = 0.5) {
    const settings = this.getSettings();
    if (!settings.soundEnabled) return;

    try {
      const audio = new Audio(src);
      audio.volume = baseVolume * settings.uiVolume; // Scales relative to user's master volume
      audio.play().catch(e => console.warn('Audio blocked:', e));
    } catch (error) {
      console.error('Sound Engine Error:', error);
    }
  }

  success() { this.play('/sounds/success.mp3', 0.4); }
  notification() { this.play('/sounds/notification.mp3', 0.6); }
  alert() { this.play('/sounds/alert.mp3', 0.8); }
  click() { this.play('/sounds/click.mp3', 0.2); }
}

export const soundEngine = new SoundEngine();