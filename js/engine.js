(function () {
  const Engine = {
    getProgress() {
      try {
        return JSON.parse(localStorage.getItem("elayon_progress")) || {
          sessoes: 0,
          fase: "Inato",
          ultimoScore: 0
        };
      } catch {
        return { sessoes: 0, fase: "Inato", ultimoScore: 0 };
      }
    },

    saveProgress(progress) {
      localStorage.setItem("elayon_progress", JSON.stringify(progress));
    },

    evaluate(snapshot) {
      const avg = snapshot.average;

      const score = Math.round(
        (avg.presenca +
          avg.clareza +
          avg.ritmo +
          avg.firmeza +
          avg.continuidade +
          avg.estabilidade) / 6
      );

      let fase = "Inato";
      if (score >= 55) fase = "Treinamento";
      if (score >= 72) fase = "Apto";

      let leitura = "Boa tentativa inicial. Continue repetindo para consolidar presença.";
      if (score >= 55) leitura = "Você já mostrou base para entrar em treinamento consciente.";
      if (score >= 72) leitura = "Você atingiu um nível consistente de prontidão para avançar.";

      return { score, fase, leitura };
    },

    commitSession(snapshot) {
      const progress = this.getProgress();
      const result = this.evaluate(snapshot);

      progress.sessoes += 1;
      progress.fase = result.fase;
      progress.ultimoScore = result.score;

      this.saveProgress(progress);

      localStorage.setItem("elayon_last_result", JSON.stringify({
        snapshot,
        result
      }));

      return result;
    }
  };

  window.ELAYON_ENGINE = Engine;
})();