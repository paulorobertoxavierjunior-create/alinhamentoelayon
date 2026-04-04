(function () {
  const STORAGE_KEY =
    window.ELAYON_CONFIG?.storageKeys?.progress || "elayon_progress";

  const LAST_RESULT_KEY =
    window.ELAYON_CONFIG?.storageKeys?.lastResult || "elayon_last_result";

  const Engine = {
    getDefaultProgress() {
      return {
        sessoes: 0,
        fase: "Inato",
        ultimoScore: 0,
        ultimaLeitura: "",
        direcao: "Continue praticando com calma e constância."
      };
    },

    getProgress() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || this.getDefaultProgress();
      } catch {
        return this.getDefaultProgress();
      }
    },

    saveProgress(progress) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    },

    getThresholds() {
      return window.ELAYON_CONFIG?.thresholds || {
        scoreApto: 75,
        scoreTraining: 50,
        highSilenceFrames: 40,
        veryHighSilenceFrames: 80,
        lowClarity: 40,
        lowStability: 40,
        lowContinuity: 40,
        lowFirmness: 40,
        goodPresence: 60,
        goodFirmness: 60,
        goodRhythm: 60,
        excellentRange: 85
      };
    },

    getModeLabel(modeKey = "fala-livre") {
      return window.ELAYON_CONFIG?.modes?.[modeKey]?.label || "Sessão";
    },

    getPhaseByScore(score) {
      const t = this.getThresholds();

      if (score >= t.scoreApto) return "Apto";
      if (score >= t.scoreTraining) return "Treinamento";
      return "Inato";
    },

    buildFlags(snapshot) {
      const avg = snapshot?.average || {};
      const t = this.getThresholds();

      return {
        highSilence: (snapshot?.silenceFrames || 0) > t.highSilenceFrames,
        lowClarity: (avg.clareza || 0) < t.lowClarity,
        lowStability: (avg.estabilidade || 0) < t.lowStability,
        lowContinuity: (avg.continuidade || 0) < t.lowContinuity,
        lowFirmness: (avg.firmeza || 0) < t.lowFirmness,
        goodPresence: (avg.presenca || 0) >= t.goodPresence,
        goodFirmness: (avg.firmeza || 0) >= t.goodFirmness,
        goodRhythm: (avg.ritmo || 0) >= t.goodRhythm
      };
    },

    buildDirection(fase, flags, modeLabel) {
      if (fase === "Apto") {
        return `Você atingiu prontidão consistente em ${modeLabel}. O próximo passo é avançar com responsabilidade para a conexão operacional.`;
      }

      if (fase === "Treinamento") {
        if (flags.lowStability) {
          return "Você já entrou em treinamento. Agora vale buscar mais estabilidade e calma na sustentação da fala.";
        }

        if (flags.lowClarity) {
          return "Você já entrou em treinamento. O próximo passo é organizar melhor a ideia central.";
        }

        if (flags.lowContinuity) {
          return "Você já entrou em treinamento. Vale sustentar mais a continuidade entre as ideias.";
        }

        return "Você já entrou em treinamento. Continue repetindo para consolidar firmeza e direção.";
      }

      if (flags.highSilence) {
        return "Repita a sessão com menos pausas longas e mais constância na fala.";
      }

      return "Continue praticando. O objetivo agora é construir presença suficiente para ganhar constância.";
    },

    evaluate(snapshot, modeKey = "fala-livre") {
      const avg = snapshot?.average || {
        presenca: 0,
        clareza: 0,
        ritmo: 0,
        firmeza: 0,
        continuidade: 0,
        estabilidade: 0
      };

      const score = Math.round(
        (
          (avg.presenca || 0) +
          (avg.clareza || 0) +
          (avg.ritmo || 0) +
          (avg.firmeza || 0) +
          (avg.continuidade || 0) +
          (avg.estabilidade || 0)
        ) / 6
      );

      const fase = this.getPhaseByScore(score);
      const flags = this.buildFlags(snapshot);
      const modeLabel = this.getModeLabel(modeKey);
      const direction = this.buildDirection(fase, flags, modeLabel);

      let leituraBase = "Boa tentativa inicial. Continue repetindo para consolidar presença.";

      if (fase === "Treinamento") {
        leituraBase = "Você já mostrou base para entrar em treinamento consciente.";
      }

      if (fase === "Apto") {
        leituraBase = "Você atingiu um nível consistente de prontidão para avançar.";
      }

      return {
        score,
        fase,
        leituraBase,
        direction,
        flags,
        averages: { ...avg },
        peaks: { ...(snapshot?.peak || {}) },
        snapshot: { ...(snapshot || {}) },
        mode: modeLabel,
        modeKey
      };
    },

    async commitSession(snapshot, modeKey = "fala-livre") {
      const progress = this.getProgress();
      const result = this.evaluate(snapshot, modeKey);

      progress.sessoes += 1;
      progress.fase = result.fase;
      progress.ultimoScore = result.score;
      progress.ultimaLeitura = result.leituraBase;
      progress.direcao = result.direction;

      this.saveProgress(progress);

      localStorage.setItem(
        LAST_RESULT_KEY,
        JSON.stringify({
          snapshot,
          result,
          modeKey,
          savedAt: new Date().toISOString()
        })
      );

      return result;
    },

    clearProgress() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_RESULT_KEY);
    }
  };

  window.ELAYON_ENGINE = Engine;
})();