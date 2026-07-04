/**
 * Melody PWA - Equalizer Service
 * Web Audio API equalizer with presets
 * @version 1.0.0
 */

const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bass: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
  treble: [0, 0, 0, 0, 0, 2, 4, 6, 8, 10],
  pop: [2, 4, 5, 3, 0, 0, 2, 4, 5, 3],
  rock: [5, 4, 3, 1, 0, 0, 2, 4, 5, 6],
  jazz: [3, 4, 2, 3, 0, 0, 2, 3, 4, 5],
  electronic: [6, 5, 3, 1, 0, 0, 2, 5, 7, 8],
  classical: [4, 3, 2, 2, 0, 0, 2, 3, 4, 5]
};

const FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

class EqualizerService {
  constructor() {
    this.audioContext = null;
    this.filters = [];
    this.masterGain = null;
    this.enabled = false;
  }

  init(audioContext, sourceNode) {
    if (!audioContext || !sourceNode) return false;
    this.audioContext = audioContext;
    this.masterGain = audioContext.createGain();
    let previousNode = sourceNode;
    for (let i = 0; i < 10; i++) {
      const filter = audioContext.createBiquadFilter();
      filter.type = i === 0 ? 'lowshelf' : i === 9 ? 'highshelf' : 'peaking';
      filter.frequency.value = FREQUENCIES[i];
      filter.Q.value = 1;
      filter.gain.value = 0;
      previousNode.connect(filter);
      previousNode = filter;
      this.filters.push(filter);
    }
    previousNode.connect(this.masterGain);
    this.masterGain.connect(audioContext.destination);
    this.enabled = true;
    state.set('eqEnabled', true);
    return true;
  }

  setPreset(presetName) {
    const preset = EQ_PRESETS[presetName];
    if (!preset) return;
    state.set('eqPreset', presetName);
    state.set('eqBands', preset.slice());
    preset.forEach((gain, index) => {
      if (this.filters[index]) this.filters[index].gain.value = gain;
    });
  }

  setBand(index, gain) {
    if (this.filters[index]) {
      this.filters[index].gain.value = gain;
      const bands = state.get('eqBands') ? state.get('eqBands').slice() : [0,0,0,0,0,0,0,0,0,0];
      bands[index] = gain;
      state.set('eqBands', bands);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    state.set('eqEnabled', this.enabled);
    if (this.masterGain) this.masterGain.gain.value = this.enabled ? 1 : 0;
  }
}

const equalizerService = new EqualizerService();
