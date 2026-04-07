(function () {
  const CRS = {
    active: false,
    stream: null,
    audioContext: null,
    analyser: null,
    dataArray: null,
    raf: null,

    startedAt: null,
    endedAt: null,

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

    average: {
      presenca: 12,
      clareza: 12,
      ritmo: 12,
      firmeza: 12,
      continuidade: 12,
      estabilidade: 12
    },

    visual: {
      cv: null,
      ctx: null,

      init() {
        this.cv = document.getElementById("cvAudio");
        if (!this.cv) return;
        this.ctx = this.cv.getContext("2d");
      },

      draw(volume) {
        if (!this.ctx) return;

        const w = this.cv.width = this.cv.offsetWidth;
        const h = this.cv.height = 180;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, w, h);

        const bars = 48;
        const bw = w / bars;

        for (let i = 0; i < bars; i++) {
          const v = Math.random() * volume * 1.8;
          const bh = v * h * 0.6;

          ctx.fillStyle = `rgba(14,165,233,${0.2 + v * 0.5})`;
          ctx.fillRect(i * bw, h - bh, bw * 0.7, bh);
        }
      }
    },

    async start() {
      if (this.active) return;

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioContext.state === "suspended") {
          await this.audioContext.resume();
        }

        const source = this.audioContext.createMediaStreamSource(this.stream);

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.8;

        source.connect(this.analyser);

        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        this.active = true;
        this.startedAt = new Date().toISOString();

        this.visual.init();

        this.loop();
      } catch (e) {
        console.error("Erro mic:", e);
      }
    },

    async stop() {
      this.active = false;

      if (this.raf) cancelAnimationFrame(this.raf);

      this.stream?.getTracks().forEach(t => t.stop());

      if (this.audioContext) {
        await this.audioContext.close();
      }
    },

    loop() {
      if (!this.active) return;

      this.analyser.getByteFrequencyData(this.dataArray);

      const volume = this.getVolume(this.dataArray);

      const speaking = volume > 8;

      if (speaking) this.speechFrames++;
      else this.silenceFrames++;

      this.updateMetrics(volume, speaking);

      this.visual.draw(volume);

      this.render();

      this.raf = requestAnimationFrame(() => this.loop());
    },

    getVolume(arr) {
      let sum = 0;
      for (let i = 0; i < arr.length; i++) sum += arr[i];
      return sum / arr.length;
    },

    updateMetrics(volume, speaking) {
      const target = Math.min(100, volume * 1.5);

      this.current.presenca = target;
      this.current.clareza = target * 0.9;
      this.current.ritmo = speaking ? 70 : 20;
      this.current.firmeza = target * 0.8;
      this.current.continuidade = speaking ? 80 : 30;
      this.current.estabilidade = 100 - Math.abs(volume - this.lastVolume);

      this.lastVolume = volume;

      this.samples++;

      for (const k in this.current) {
        this.average[k] =
          (this.average[k] * (this.samples - 1) + this.current[k]) / this.samples;
      }
    },

    render() {
      for (const key in this.average) {
        const el = document.querySelector(`[data-crs="${key}"]`);
        const label = document.querySelector(`[data-crs-label="${key}"]`);

        if (el) el.style.width = `${this.average[key]}%`;
        if (label) label.textContent = `${Math.round(this.average[key])}%`;
      }
    },

    snapshot() {
      return {
        average: this.average,
        samples: this.samples
      };
    }
  };

  window.ELAYON_CRS = CRS;
})();

// === EXTENSÃO VISUAL CRS (COCKPIT) ===

CRS.visual = {
  enabled: false,
  raf: null,
  cvFft: null,
  ctxFft: null,

  init() {
    this.cvFft = document.getElementById("cvFft");
    if (!this.cvFft) return;

    this.ctxFft = this.cvFft.getContext("2d");
    this.enabled = true;
  },

  draw(volume) {
    if (!this.enabled || !this.ctxFft) return;

    const ctx = this.ctxFft;
    const w = this.cvFft.width = this.cvFft.offsetWidth;
    const h = this.cvFft.height = 200;

    ctx.clearRect(0, 0, w, h);

    const bars = 40;
    const bw = w / bars;

    for (let i = 0; i < bars; i++) {
      const v = Math.random() * volume * 2;
      const bh = v * h * 0.6;

      ctx.fillStyle = "rgba(14,165,233,0.6)";
      ctx.fillRect(i * bw, h - bh, bw * 0.8, bh);
    }
  }
};