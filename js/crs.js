(function () {
  const CRS = {
    active: false,
    stream: null,
    audioContext: null,
    analyser: null,
    dataArray: null,
    raf: null,
    samples: 0,
    speechFrames: 0,
    silenceFrames: 0,
    lastVolume: 0,

    current: {
      presenca: 12,
      clareza: 12,
      ritmo: 12,
      firmeza: 12,
      continuidade: 12,
      estabilidade: 12
    },

    peak: {
      presenca: 12,
      clareza: 12,
      ritmo: 12,
      firmeza: 12,
      continuidade: 12,
      estabilidade: 12
    },

    average: {
      presenca: 12,
      clareza: 12,
      ritmo: 12,
      firmeza: 12,
      continuidade: 12,
      estabilidade: 12
    },

    reset() {
      this.samples = 0;
      this.speechFrames = 0;
      this.silenceFrames = 0;
      this.lastVolume = 0;

      for (const k in this.current) {
        this.current[k] = 12;
        this.peak[k] = 12;
        this.average[k] = 12;
      }
    },

    async start() {
      if (this.active) return;

      try {
        this.reset();

        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioContext.createMediaStreamSource(this.stream);

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.8;

        source.connect(this.analyser);

        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);

        this.active = true;
        this.loop();
      } catch (e) {
        const status = document.getElementById("crsStatus");
        if (status) status.textContent = "microfone não autorizado";
        console.error(e);
      }
    },

    stop() {
      this.active = false;

      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;

      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      if (this.audioContext) {
        this.audioContext.close();
      }

      this.stream = null;
      this.audioContext = null;
      this.analyser = null;
      this.dataArray = null;
    },

    loop() {
      if (!this.active || !this.analyser) return;

      this.analyser.getByteFrequencyData(this.dataArray);

      const volume = this.getAverageVolume(this.dataArray);
      const speaking = volume > 8;
      const delta = Math.abs(volume - this.lastVolume);
      this.lastVolume = volume;

      if (speaking) this.speechFrames++;
      else this.silenceFrames++;

      const targetPresenca = this.mapRange(volume, 8, 55, 10, 100);
      const targetClareza = this.mapRange(volume, 8, 48, 10, 92);
      const targetRitmo = this.computeRitmo(volume, delta, speaking);
      const targetFirmeza = this.computeFirmeza(volume, delta, speaking);
      const targetContinuidade = this.computeContinuidade(speaking);
      const targetEstabilidade = this.computeEstabilidade(delta, speaking);

      this.current.presenca = this.approach(this.current.presenca, targetPresenca, speaking);
      this.current.clareza = this.approach(this.current.clareza, targetClareza, speaking);
      this.current.ritmo = this.approach(this.current.ritmo, targetRitmo, speaking);
      this.current.firmeza = this.approach(this.current.firmeza, targetFirmeza, speaking);
      this.current.continuidade = this.approach(this.current.continuidade, targetContinuidade, speaking);
      this.current.estabilidade = this.approach(this.current.estabilidade, targetEstabilidade, speaking);

      this.updatePeaks();
      this.updateAverages();
      this.render();

      const status = document.getElementById("crsStatus");
      if (status) status.textContent = speaking ? "falando / captando" : "silêncio / mantendo";

      this.raf = requestAnimationFrame(() => this.loop());
    },

    getAverageVolume(arr) {
      let sum = 0;
      for (let i = 0; i < arr.length; i++) sum += arr[i];
      return Math.max(0, Math.min(100, Math.round(sum / arr.length)));
    },

    computeRitmo(volume, delta, speaking) {
      if (!speaking) return Math.max(this.current.ritmo - 1.2, 10);
      const stabilityBonus = Math.max(0, 18 - delta);
      return Math.max(10, Math.min(100, Math.round(volume * 0.9 + stabilityBonus)));
    },

    computeFirmeza(volume, delta, speaking) {
      if (!speaking) return Math.max(this.current.firmeza - 1.4, 10);
      const tremorPenalty = Math.min(20, delta);
      return Math.max(10, Math.min(100, Math.round(volume + 18 - tremorPenalty)));
    },

    computeContinuidade(speaking) {
      const speechWeight = Math.min(100, 12 + this.speechFrames * 0.9);
      if (speaking) return speechWeight;
      return Math.max(10, this.current.continuidade - 0.8);
    },

    computeEstabilidade(delta, speaking) {
      if (!speaking) return Math.max(this.current.estabilidade - 0.7, 10);
      return Math.max(10, Math.min(100, Math.round(100 - Math.min(55, delta * 2.2))));
    },

    approach(current, target, speaking) {
      const rise = 0.18;
      const fall = 0.025;
      const rate = target > current ? rise : (speaking ? 0.06 : fall);
      return Math.max(10, Math.min(100, Math.round(current + (target - current) * rate)));
    },

    updatePeaks() {
      for (const k in this.current) {
        if (this.current[k] > this.peak[k]) this.peak[k] = this.current[k];
      }
    },

    updateAverages() {
      this.samples++;
      for (const k in this.current) {
        this.average[k] = Math.round(((this.average[k] * (this.samples - 1)) + this.current[k]) / this.samples);
      }
    },

    mapRange(value, inMin, inMax, outMin, outMax) {
      if (value <= inMin) return outMin;
      if (value >= inMax) return outMax;
      const ratio = (value - inMin) / (inMax - inMin);
      return Math.round(outMin + ratio * (outMax - outMin));
    },

    render() {
      for (const key in this.current) {
        const fill = document.querySelector(`[data-crs="${key}"]`);
        const label = document.querySelector(`[data-crs-label="${key}"]`);
        const peakLabel = document.querySelector(`[data-crs-peak="${key}"]`);

        if (fill) fill.style.width = `${this.average[key]}%`;
        if (label) label.textContent = `${this.average[key]}%`;
        if (peakLabel) peakLabel.textContent = `pico ${this.peak[key]}%`;
      }
    },

    snapshot() {
      return {
        current: { ...this.current },
        peak: { ...this.peak },
        average: { ...this.average },
        speechFrames: this.speechFrames,
        silenceFrames: this.silenceFrames,
        samples: this.samples
      };
    }
  };

  window.ELAYON_CRS = CRS;
})();