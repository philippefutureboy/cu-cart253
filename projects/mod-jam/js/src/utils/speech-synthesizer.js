/**
 * NASASpeechSynthesizer
 *
 * Exposes a processed voice that gives a retro/NASA-ground-control feeling.
 * Uses the browser's text to speech API to play some text utterance to the user.
 *
 * This code and the conceptualisation was authored by ChatGPT-5 (OpenAI), and then integrated
 * by Philippe Hebert.
 * Full conversation available at ./docs/ATTRIBUTION/chatgpt-log-speech-2025-10-14.html
 *
 */
export default class NASASpeechSynthesizer {
  constructor() {
    this._initializeVoiceProcessing();
    this.defaultVoice = this.pickRetroVoice();
  }

  _initializeVoiceProcessing() {
    const ctx = new AudioContext();

    // Speech output destination via Web Audio
    const dest = ctx.createMediaStreamDestination();
    const audio = new Audio();
    audio.srcObject = dest.stream;
    audio.play();

    // Simple "radio" EQ
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200; // NASA-radio mid tone
    filter.Q.value = 0.7;
    filter.connect(ctx.destination);

    // Connect stream to filter
    const source = ctx.createMediaStreamSource(dest.stream);
    source.connect(filter);
  }

  pickRetroVoice() {
    const voices = this.getVoices();

    // Try macOS “Fred”
    let voice = voices.find((v) => /Fred/i.test(v.name));

    // Otherwise pick the most robotic or male Google/Microsoft voice
    if (!voice)
      voice = voices.find((v) =>
        /Google UK English Male|Microsoft David/i.test(v.name)
      );

    // Fallback to default
    return voice || voices.find((v) => v.default) || voices[0];
  }

  getVoices() {
    return window.speechSynthesis.getVoices();
  }

  speak(text, { pitch = 0.9, rate = 0.9, volume = 1, voice = null } = {}) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice ?? this.defaultVoice;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;
    window.speechSynthesis.speak(utterance);
  }
}
