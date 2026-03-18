(function () {
  const Reader = {
    rankMetrics(averages) {
      return Object.entries(averages).sort((a, b) => b[1] - a[1]);
    },

    weakestMetrics(averages) {
      return Object.entries(averages).sort((a, b) => a[1] - b[1]);
    },

    metricLabel(key) {
      const labels = {
        presenca: "presença",
        clareza: "clareza",
        ritmo: "ritmo",
        firmeza: "firmeza",
        continuidade: "continuidade",
        estabilidade: "estabilidade"
      };
      return labels[key] || key;
    },

    listToText(items) {
      if (!items || items.length === 0) return "";
      if (items.length === 1) return items[0];
      if (items.length === 2) return `${items[0]} e ${items[1]}`;
      return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
    },

    buildMoments(modeLabel, result, snapshot) {
      const strong = this.rankMetrics(result.averages).slice(0, 2).map(([k]) => this.metricLabel(k));
      const weak = this.weakestMetrics(result.averages).slice(0, 2).map(([k]) => this.metricLabel(k));
      const silence = snapshot?.silenceFrames || 0;

      if (silence > ELAYON_CONFIG.thresholds.veryHighSilenceFrames) {
        return `Na sessão de ${modeLabel}, houve pausas longas durante a interação. Ainda assim, apareceram sinais importantes de ${this.listToText(strong)}.`;
      }

      if (result.score >= ELAYON_CONFIG.thresholds.excellentRange) {
        return `Na sessão de ${modeLabel}, sua interação mostrou consistência elevada, com destaque para ${this.listToText(strong)}.`;
      }

      return `Na sessão de ${modeLabel}, sua interação mostrou mais força em ${this.listToText(strong)}, com espaço de crescimento em ${this.listToText(weak)}.`;
    },

    buildStrengths(result) {
      const flags = result.flags;
      const strong = [];

      if (flags.goodPresence) strong.push("boa presença");
      if (flags.goodFirmness) strong.push("boa firmeza");
      if (flags.goodRhythm) strong.push("ritmo consistente");

      const ranked = this.rankMetrics(result.averages).slice(0, 3).map(([k]) => this.metricLabel(k));

      if (strong.length === 0) {
        return `Os pontos mais fortes desta sessão foram ${this.listToText(ranked)}.`;
      }

      return `Os pontos mais fortes desta sessão foram ${this.listToText(strong)}, com destaque também para ${this.listToText(ranked)}.`;
    },

    buildImprovements(result, snapshot) {
      const flags = result.flags;
      const notes = [];
      const silence = snapshot?.silenceFrames || 0;

      if (silence > ELAYON_CONFIG.thresholds.veryHighSilenceFrames) {
        notes.push("reduzir pausas longas");
      } else if (flags.highSilence) {
        notes.push("manter mais continuidade entre as ideias");
      }

      if (flags.lowClarity) notes.push("organizar melhor a ideia central");
      if (flags.lowStability) notes.push("ganhar mais estabilidade");
      if (flags.lowContinuity) notes.push("sustentar a fala por mais tempo");
      if (flags.lowFirmness) notes.push("aumentar a firmeza da conclusão");

      if (notes.length === 0) {
        const weak = this.weakestMetrics(result.averages).slice(0, 2).map(([k]) => this.metricLabel(k));
        return `Vale observar melhor ${this.listToText(weak)} nas próximas sessões.`;
      }

      return `Os principais pontos de melhoria agora são ${this.listToText(notes)}.`;
    },

    buildEmotional(result, snapshot) {
      const flags = result.flags;
      const silence = snapshot?.silenceFrames || 0;

      if (result.fase === "Apto") {
        return "Momento de boa consistência interna, com sinais de prontidão para avançar com mais segurança.";
      }

      if (silence > ELAYON_CONFIG.thresholds.veryHighSilenceFrames) {
        return "Momento de elaboração interna mais lenta, com pausas longas que sugerem busca de forma e organização.";
      }

      if (flags.goodPresence && flags.lowStability) {
        return "Momento de boa entrada de energia, mas ainda com oscilações na sustentação da fala.";
      }

      if (flags.goodPresence && flags.lowClarity) {
        return "Momento de presença viva, mas com a ideia ainda pedindo mais organização e definição.";
      }

      if (flags.highSilence) {
        return "Momento de busca e reorganização, com pausas perceptíveis no meio da construção.";
      }

      if (result.fase === "Treinamento") {
        return "Momento de construção consciente, com base real para desenvolvimento mais firme.";
      }

      return "Momento inicial de observação, com sinais importantes de presença em construção.";
    },

    buildLevel(result) {
      if (result.fase === "Apto") return "Apto";
      if (result.fase === "Treinamento") return "Treinamento";
      return "Em construção";
    },

    buildNextStep(result) {
      return result.direction;
    },

    buildReading(lastResult) {
      if (!lastResult || !lastResult.result) {
        return {
          momentos: "Ainda não há uma sessão registrada para leitura.",
          fortes: "Sem dados suficientes.",
          melhorias: "Sem dados suficientes.",
          emocional: "Sem leitura disponível.",
          nivel: "Inato",
          score: 0,
          fase: "Inato",
          proximo: "Realize uma sessão para iniciar a leitura."
        };
      }

      const { result, modeKey, snapshot } = lastResult;
      const modeLabel = ELAYON_CONFIG.modes[modeKey]?.label || result.mode || "Sessão";

      return {
        momentos: this.buildMoments(modeLabel, result, snapshot),
        fortes: this.buildStrengths(result),
        melhorias: this.buildImprovements(result, snapshot),
        emocional: this.buildEmotional(result, snapshot),
        nivel: this.buildLevel(result),
        score: result.score,
        fase: result.fase,
        proximo: this.buildNextStep(result)
      };
    }
  };

  window.ELAYON_READER = Reader;
})();