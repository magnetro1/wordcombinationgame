/**
 * Text-to-speech pronunciation service using Web Speech API
 */
export class PronunciationService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isLoading: boolean = false;

  constructor() {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    this.synth = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices(): void {
    if (!this.synth) return;

    const updateVoices = () => {
      if (this.synth) {
        this.voices = this.synth.getVoices();
        this.isLoading = false;
      }
    };

    // Try to get voices immediately
    this.voices = this.synth.getVoices();

    // If voices aren't loaded yet, wait for the event
    if (this.voices.length === 0) {
      this.isLoading = true;
      this.synth.addEventListener('voiceschanged', updateVoices);

      // Fallback: Stop waiting after 3 seconds
      setTimeout(() => {
        if (this.isLoading && this.synth) {
          this.isLoading = false;
          this.voices = this.synth.getVoices();
        }
      }, 3000);
    }
  }

  /**
   * Pronounce the given text
   */
  public pronounce(text: string, language: string = 'en-US'): void {
    if (!this.isSupported() || !this.synth) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 0.8; // Slightly slower for learning
    utterance.volume = 0.8;
    utterance.pitch = 1.0;

    // Try to find a voice for the specified language
    const voice = this.findBestVoice(language);
    if (voice) {
      utterance.voice = voice;
    }

    // Add error handling
    utterance.onerror = (event) => {
      console.warn('Speech synthesis error:', event.error);
    };

    this.synth.speak(utterance);
  }

  /**
   * Find the best voice for the given language
   */
  private findBestVoice(language: string): SpeechSynthesisVoice | null {
    if (this.voices.length === 0) {
      return null;
    }

    // First, try to find an exact match
    let voice = this.voices.find(v => v.lang === language);
    if (voice) return voice;

    // If no exact match, try to find a voice that starts with the language code
    const languageCode = language.split('-')[0];
    voice = this.voices.find(v => v.lang.startsWith(languageCode));
    if (voice) return voice;

    // Fallback to default voice
    return this.voices.find(v => v.default) || this.voices[0] || null;
  }

  /**
   * Check if speech synthesis is supported
   */
  public isSupported(): boolean {
    return 'speechSynthesis' in window && !!this.synth;
  }

  /**
   * Get available languages
   */
  public getAvailableLanguages(): string[] {
    return [...new Set(this.voices.map(voice => voice.lang))];
  }

  /**
   * Stop any ongoing speech
   */
  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Check if speech is currently playing
   */
  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

// Create a singleton instance
export const pronunciationService = new PronunciationService();
