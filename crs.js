(function () {
  const CRS = {
    active: false,
    stream: null,
    audioContext: null,
    analyser: null,
    dataArray: null,
    raf: null,

    startedAt: null,
    samples: 0,

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

    lastVolume: 0,
    speechFrames: 0,
    silenceFrames: 0,

    async start() {
      if (this.active) return;

      try {
        this.resetSession();

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
        this.startedAt = performance.now();

        this.loop();
      } catch (err) {
        const status = document.getElementById("crsStatus");
        if (status) status.textContent = "microfone não autorizado";
        console.error(err);
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

      const status = document.getElementById("crsStatus");
      if (status) status.textContent = "captação finalizada";
    },

    resetSession() {
      this.samples = 0;
      this.lastVolume = 0;
      this.speechFrames = 0;
      this.silenceFrames = 0;

      const base = 12;

      Object.keys(this.current).forEach((k) => {
        this.current[k] = base;
        this.peak[k] = base;
        this.average[k] = base;
      });
    },

    loop() {
      if (!this.active || !this.analyser) return;

      this.analyser.getByteFrequencyData(this.dataArray);

      const volume = this.getAverageVolume(this.dataArray); // 0..100 approx
      const speaking = volume > 8;

      if (speaking) {
        this.speechFrames++;
      } else {
        this.silenceFrames++;
      }

      const delta = Math.abs(volume - this.lastVolume);
      this.lastVolume = volume;

      // -----------------------------
      // MÉTRICAS DE ENTRADA
      // -----------------------------
      // A ideia aqui é:
      // - falar nutre as barras
      // - pausar não destrói de imediato
      // - a sessão toda vai construindo uma média estável

      const targetPresenca = this.mapRange(volume, 8, 55, 10, 100);
      const targetClareza = this.mapRange(volume, 8, 48, 10, 92);
      const targetRitmo = this.computeRitmo(volume, delta, speaking);
      const targetFirmeza = this.computeFirmeza(volume, delta, speaking);
      const targetContinuidade = this.computeContinuidade(speaking);
      const targetEstabilidade = this.computeEstabilidade(delta, speaking);

      // sobe rápido quando fala, desce devagar quando silencia
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
      if (status) {
        status.textContent = speaking ? "falando / captando" : "silêncio / mantendo sessão";
      }

      this.raf = requestAnimationFrame(() => this.loop());
    },

    getAverageVolume(dataArray) {
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      return Math.max(0, Math.min(100, Math.round(avg)));
    },

    computeRitmo(volume, delta, speaking) {
      if (!speaking) return Math.max(this.current.ritmo - 1.2, 10);

      // quanto menos oscilação brusca, melhor o ritmo
      const stabilityBonus = Math.max(0, 18 - delta);
      const raw = volume * 0.9 + stabilityBonus;
      return Math.max(10, Math.min(100, Math.round(raw)));
    },

    computeFirmeza(volume, delta, speaking) {
      if (!speaking) return Math.max(this.current.firmeza - 1.4, 10);

      // firmeza cresce com energia sustentada e pouca tremulação
      const tremorPenalty = Math.min(20, delta);
      const raw = volume + 18 - tremorPenalty;
      return Math.max(10, Math.min(100, Math.round(raw)));
    },

    computeContinuidade(speaking) {
      // continuidade é nutrida pelo tempo de fala acumulado
      const speechWeight = Math.min(100, 12 + this.speechFrames * 0.9);
      if (speaking) return speechWeight;

      // no silêncio ela cai devagar, porque a sessão já foi construída
      return Math.max(10, this.current.continuidade - 0.8);
    },

    computeEstabilidade(delta, speaking) {
      if (!speaking) return Math.max(this.current.estabilidade - 0.7, 10);

      const raw = 100 - Math.min(55, delta * 2.2);
      return Math.max(10, Math.min(100, Math.round(raw)));
    },

    approach(current, target, speaking) {
      // sobe rápido e desce devagar
      const rise = 0.18;
      const fall = 0.025;
      const rate = target > current ? rise : (speaking ? 0.06 : fall);
      const next = current + (target - current) * rate;
      return Math.max(10, Math.min(100, Math.round(next)));
    },

    updatePeaks() {
      Object.keys(this.current).forEach((k) => {
        if (this.current[k] > this.peak[k]) {
          this.peak[k] = this.current[k];
        }
      });
    },

    updateAverages() {
      this.samples++;

      Object.keys(this.current).forEach((k) => {
        const prevAvg = this.average[k];
        const curr = this.current[k];
        this.average[k] = Math.round(((prevAvg * (this.samples - 1)) + curr) / this.samples);
      });
    },

    mapRange(value, inMin, inMax, outMin, outMax) {
      if (value <= inMin) return outMin;
      if (value >= inMax) return outMax;
      const ratio = (value - inMin) / (inMax - inMin);
      return Math.round(outMin + ratio * (outMax - outMin));
    },

    render() {
      Object.keys(this.current).forEach((key) => {
        // barra principal = média da sessão
        const fill = document.querySelector(`[data-crs="${key}"]`);
        if (fill) {
          fill.style.width = `${this.average[key]}%`;
        }

        // label principal mostra média
        const label = document.querySelector(`[data-crs-label="${key}"]`);
        if (label) {
          label.textContent = `${this.average[key]}%`;
        }

        // opcional: pico
        const peakLabel = document.querySelector(`[data-crs-peak="${key}"]`);
        if (peakLabel) {
          peakLabel.textContent = `pico ${this.peak[key]}%`;
        }
      });
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