(function () {
  const CRS = {
    active: false,
    timer: null,
    values: {
      presenca: 18,
      clareza: 24,
      ritmo: 16,
      firmeza: 20,
      continuidade: 14,
      estabilidade: 22
    },

    start() {
      if (this.active) return;
      this.active = true;

      this.timer = setInterval(() => {
        this.values.presenca = this.next(this.values.presenca, 10, 96, 6);
        this.values.clareza = this.next(this.values.clareza, 12, 94, 5);
        this.values.ritmo = this.next(this.values.ritmo, 8, 90, 7);
        this.values.firmeza = this.next(this.values.firmeza, 10, 92, 5);
        this.values.continuidade = this.next(this.values.continuidade, 6, 88, 6);
        this.values.estabilidade = this.next(this.values.estabilidade, 9, 91, 4);

        this.render();
      }, 700);
    },

    stop() {
      this.active = false;
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
    },

    next(current, min, max, spread) {
      const variation = (Math.random() * spread * 2) - spread;
      let value = current + variation;

      if (value < min) value = min + Math.random() * 4;
      if (value > max) value = max - Math.random() * 4;

      return Math.round(value);
    },

    render() {
      Object.keys(this.values).forEach((key) => {
        const fill = document.querySelector(`[data-crs="${key}"]`);
        if (fill) {
          fill.style.width = `${this.values[key]}%`;
        }

        const label = document.querySelector(`[data-crs-label="${key}"]`);
        if (label) {
          label.textContent = `${this.values[key]}%`;
        }
      });

      const status = document.getElementById("crsStatus");
      if (status) {
        status.textContent = this.active ? "captação em andamento" : "aguardando";
      }
    },

    snapshot() {
      return { ...this.values };
    }
  };

  window.ELAYON_CRS = CRS;
})();