(function () {
  const CRS = {
    active: false,
    stream: null,
    audioContext: null,
    analyser: null,
    dataArray: null,
    raf: null,

    startedAt: null,
    lastVolume: 0,

    historyVolume: [],
    historySilence: [],

    current: {
      presenca: 12,
      clareza: 12,
      ritmo: 12,
      firmeza: 12,
      continuidade: 12,
      estabilidade: 12
    },

    initCanvas() {
      this.cvFft = document.getElementById("cvFft");
      this.cvSil = document.getElementById("cvSil");

      this.ctxFft = this.cvFft?.getContext("2d");
      this.ctxSil = this.cvSil?.getContext("2d");
    },

    async start() {
      if (this.active) return;

      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const source = this.audioContext.createMediaStreamSource(this.stream);

        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;

        source.connect(this.analyser);

        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        this.startedAt = Date.now();
        this.active = true;

        this.initCanvas();
        this.loop();

      } catch (e) {
        console.error("Erro microfone:", e);
      }
    },

    async stop() {
      this.active = false;

      if (this.raf) cancelAnimationFrame(this.raf);

      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
      }

      if (this.audioContext) {
        await this.audioContext.close();
      }
    },

    loop() {
      if (!this.active) return;

      this.analyser.getByteFrequencyData(this.dataArray);

      const volume = this.getVolume(this.dataArray);
      const speaking = volume > 8;
      const delta = Math.abs(volume - this.lastVolume);
      this.lastVolume = volume;

      this.updateMetrics(volume, delta, speaking);

      this.historyVolume.push(volume);
      this.historySilence.push(speaking ? 1 : 0);

      if (this.historyVolume.length > 120) {
        this.historyVolume.shift();
        this.historySilence.shift();
      }

      this.drawFFT();
      this.drawSilence();

      this.raf = requestAnimationFrame(() => this.loop());
    },

    getVolume(arr) {
      let sum = 0;
      for (let i = 0; i < arr.length; i++) sum += arr[i];
      return Math.round(sum / arr.length);
    },

    updateMetrics(volume, delta, speaking) {
      const map = (v, a, b, c, d) => {
        if (v <= a) return c;
        if (v >= b) return d;
        return c + ((v - a) / (b - a)) * (d - c);
      };

      this.current.presenca = map(volume, 8, 60, 10, 100);
      this.current.clareza = map(volume, 8, 50, 10, 90);
      this.current.ritmo = speaking ? 70 - delta : 30;
      this.current.firmeza = speaking ? 80 - delta : 20;
      this.current.continuidade = speaking ? 80 : 30;
      this.current.estabilidade = 100 - delta * 2;

      this.renderBars();
    },

    renderBars() {
      for (const k in this.current) {
        const el = document.querySelector(`[data-crs="${k}"]`);
        const label = document.querySelector(`[data-crs-label="${k}"]`);

        if (el) el.style.width = `${this.current[k]}%`;
        if (label) label.textContent = `${Math.round(this.current[k])}%`;
      }
    },

    drawFFT() {
      if (!this.ctxFft) return;

      const w = this.cvFft.width = this.cvFft.clientWidth;
      const h = this.cvFft.height = this.cvFft.clientHeight;

      this.ctxFft.clearRect(0, 0, w, h);

      const barWidth = w / this.dataArray.length;

      for (let i = 0; i < this.dataArray.length; i++) {
        const v = this.dataArray[i];
        const barHeight = (v / 255) * h;

        this.ctxFft.fillRect(i * barWidth, h - barHeight, barWidth, barHeight);
      }
    },

    drawSilence() {
      if (!this.ctxSil) return;

      const w = this.cvSil.width = this.cvSil.clientWidth;
      const h = this.cvSil.height = this.cvSil.clientHeight;

      this.ctxSil.clearRect(0, 0, w, h);

      const step = w / this.historySilence.length;

      this.historySilence.forEach((v, i) => {
        const y = v ? h * 0.3 : h * 0.8;

        this.ctxSil.beginPath();
        this.ctxSil.arc(i * step, y, 2, 0, Math.PI * 2);
        this.ctxSil.fill();
      });
    }
  };

  window.ELAYON_CRS = CRS;
})();