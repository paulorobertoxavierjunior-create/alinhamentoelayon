(function () {
  function getModeName() {
    const page = document.body.dataset.page || "";
    if (page === "fala-livre") return "Fala livre";
    if (page === "apresentacao") return "Treino de apresentação";
    if (page === "aula") return "Simulação de aula";
    if (page === "dialogo") return "Simulação de diálogo";
    if (page === "audio") return "Análise de áudio";
    return "Modo desconhecido";
  }

  function saveSession() {
    if (!window.ELAYON_CRS) return;

    const snapshot = window.ELAYON_CRS.snapshot();
    const draft = {
      modo: getModeName(),
      ts: new Date().toISOString(),
      crs: snapshot
    };

    localStorage.setItem("presenca_session_draft", JSON.stringify(draft));

    let progress = {};
    try {
      progress = JSON.parse(localStorage.getItem("presenca_progress") || "{}");
    } catch {
      progress = {};
    }

    progress.sessoes = Number(progress.sessoes || 0) + 1;
    progress.ultimoModo = draft.modo;

    if (progress.sessoes >= 1) progress.fase = "Organização";
    if (progress.sessoes >= 3) progress.fase = "Clareza";
    if (progress.sessoes >= 5) progress.fase = "Firmeza";
    if (progress.sessoes >= 8) progress.fase = "Expansão";
    if (!progress.fase) progress.fase = "Expressão livre";

    progress.leituraAtual = `Sessão registrada em ${draft.modo}. O processo mostra sinais de evolução gradual.`;
    progress.direcao = "Continue praticando com atenção e observe como sua expressão ganha forma.";

    localStorage.setItem("presenca_progress", JSON.stringify(progress));
  }

  function fillResultFromDraft() {
    let draft = null;
    try {
      draft = JSON.parse(localStorage.getItem("presenca_session_draft") || "null");
    } catch {
      draft = null;
    }

    if (!draft || !draft.crs) return;

    const media = Math.round(
      (
        draft.crs.presenca +
        draft.crs.clareza +
        draft.crs.ritmo +
        draft.crs.firmeza +
        draft.crs.continuidade +
        draft.crs.estabilidade
      ) / 6
    );

    const momentos = document.getElementById("resultadoMomentos");
    const fortes = document.getElementById("resultadoFortes");
    const melhorias = document.getElementById("resultadoMelhorias");
    const emocional = document.getElementById("resultadoEmocional");
    const nivel = document.getElementById("resultadoNivel");
    const proximo = document.getElementById("resultadoProximo");

    if (momentos) {
      momentos.textContent = `No modo ${draft.modo}, sua interação mostrou presença média de ${media}%, com variações naturais entre clareza, ritmo e estabilidade.`;
    }

    if (fortes) {
      fortes.textContent = strongestAreas(draft.crs);
    }

    if (melhorias) {
      melhorias.textContent = improvementAreas(draft.crs);
    }

    if (emocional) {
      emocional.textContent = emotionalReading(draft.crs);
    }

    if (nivel) {
      nivel.textContent = levelReading(media);
    }

    if (proximo) {
      proximo.textContent = nextStepReading(draft.modo, media);
    }
  }

  function strongestAreas(crs) {
    const sorted = Object.entries(crs).sort((a, b) => b[1] - a[1]);
    return `Seus pontos mais fortes nesta sessão foram ${sorted[0][0]}, ${sorted[1][0]} e ${sorted[2][0]}.`;
  }

  function improvementAreas(crs) {
    const sorted = Object.entries(crs).sort((a, b) => a[1] - b[1]);
    return `Vale observar com mais atenção ${sorted[0][0]} e ${sorted[1][0]}, pois essas áreas ainda podem ganhar mais firmeza.`;
  }

  function emotionalReading(crs) {
    if (crs.estabilidade >= 70 && crs.clareza >= 70) {
      return "Momento de boa organização interna, com sinais de estabilidade e clareza crescente.";
    }
    if (crs.ritmo >= 70 && crs.firmeza < 55) {
      return "Momento de energia alta, com espaço para transformar impulso em mais firmeza.";
    }
    if (crs.presenca >= 65) {
      return "Momento de presença consistente, com boa base para aprofundar a expressão.";
    }
    return "Momento de observação inicial, com sinais importantes de construção da própria presença.";
  }

  function levelReading(media) {
    if (media >= 75) return "Apto para avançar com segurança.";
    if (media >= 60) return "Consistente e em crescimento.";
    if (media >= 45) return "Em construção, com boa base de evolução.";
    return "Início de processo, com espaço real para fortalecimento.";
  }

  function nextStepReading(mode, media) {
    if (mode === "Fala livre") return "Continue no treino de apresentação para fortalecer encadeamento e direção.";
    if (mode === "Treino de apresentação") return "Avance para simulação de aula e experimente explicar com mais didática.";
    if (mode === "Simulação de aula") return "Experimente o diálogo para consolidar resposta e flexibilidade.";
    if (mode === "Simulação de diálogo") return "A análise de áudio pode ajudar você a se escutar com mais distância.";
    if (mode === "Análise de áudio") return media >= 60 ? "Você já pode retornar ao painel e escolher a trilha que mais desafia sua clareza." : "Vale repetir uma sessão para consolidar presença e estabilidade.";
    return "Retorne ao painel e continue o processo.";
  }

  function bindPracticePage() {
    const startBtn = document.getElementById("btnStartCRS");
    const stopBtn = document.getElementById("btnRegistrarSessao");

    if (startBtn && window.ELAYON_CRS) {
      startBtn.addEventListener("click", () => {
        window.ELAYON_CRS.start();
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener("click", () => {
        if (window.ELAYON_CRS) {
          window.ELAYON_CRS.stop();
        }
        saveSession();
        window.location.href = "resultado.html";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindPracticePage();
    fillResultFromDraft();
    if (window.ELAYON_CRS) {
      window.ELAYON_CRS.render();
    }
  });
})();