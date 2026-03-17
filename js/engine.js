(function () {
  const Engine = {
    getProgress() {
      try {
        return JSON.parse(localStorage.getItem("elayon_progress")) || {
          sessoes: 0,
          fase: "Inato",
          ultimoScore: 0,
          ultimaLeitura: "",
          direcao: "Continue praticando com calma e constância."
        };
      } catch {
        return {
          sessoes: 0,
          fase: "Inato",
          ultimoScore: 0,
          ultimaLeitura: "",
          direcao: "Continue praticando com calma e constância."
        };
      }
    },

    saveProgress(progress) {
      localStorage.setItem("elayon_progress", JSON.stringify(progress));
    },

    getPhaseByScore(score) {
      const t = ELAYON_CONFIG.thresholds;
      if (score >= t.scoreApto) return "Apto";
      if (score >= t.scoreTraining) return "Treinamento";
      return "Inato";
    },

    buildFlags(snapshot) {
      const avg = snapshot.average;
      const t = ELAYON_CONFIG.thresholds;

      return {
        highSilence: snapshot.silenceFrames > t.highSilenceFrames,
        lowClarity: avg.clareza < t.lowClarity,
        lowStability: avg.estabilidade < t.lowStability,
        lowContinuity: avg.continuidade < t.lowContinuity,
        goodPresence: avg.presenca >= t.goodPresence,
        goodFirmness: avg.firmeza >= t.goodFirmness,
        goodRhythm: avg.ritmo >= t.goodRhythm
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
        return "Você já entrou em treinamento. Continue repetindo para consolidar firmeza e direção.";
      }

      if (flags.highSilence) {
        return "Repita a sessão com menos pausas longas e mais constância na fala.";
      }

      return "Continue praticando. O objetivo agora é construir presença suficiente para ganhar constância.";
    },

    evaluate(snapshot, modeKey = "fala-livre") {
      const avg = snapshot.average;

      const score = Math.round(
        (avg.presenca +
          avg.clareza +
          avg.ritmo +
          avg.firmeza +
          avg.continuidade +
          avg.estabilidade) / 6
      );

      const fase = this.getPhaseByScore(score);
      const flags = this.buildFlags(snapshot);
      const modeLabel = ELAYON_CONFIG.modes[modeKey]?.label || "Sessão";
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
        peaks: { ...snapshot.peak },
        mode: modeLabel
      };
    },

    commitSession(snapshot, modeKey = "fala-livre") {
      const progress = this.getProgress();
      const result = this.evaluate(snapshot, modeKey);

      progress.sessoes += 1;
      progress.fase = result.fase;
      progress.ultimoScore = result.score;
      progress.ultimaLeitura = result.leituraBase;
      progress.direcao = result.direction;

      this.saveProgress(progress);

      localStorage.setItem("elayon_last_result", JSON.stringify({
        snapshot,
        result,
        modeKey
      }));

      return result;
    }
  };

  window.ELAYON_ENGINE = Engine;
})();