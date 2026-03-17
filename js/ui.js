(function () {
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function getLastResult() {
    try {
      return JSON.parse(localStorage.getItem("elayon_last_result")) || null;
    } catch {
      return null;
    }
  }

  function hydrateUser() {
    const auth = JSON.parse(localStorage.getItem("elayon_auth") || "null");
    const progress = window.ELAYON_ENGINE ? window.ELAYON_ENGINE.getProgress() : { fase: "Inato", sessoes: 0, ultimoScore: 0 };

    if (auth?.login) setText("painelLogin", `Operador: ${auth.login}`);
    setText("faseAtualPainel", progress.fase || "Inato");
    setText("totalSessoesPainel", String(progress.sessoes || 0));
    setText("ultimoScorePainel", String(progress.ultimoScore || 0));

    if (progress.fase === "Inato") {
      setText("direcaoPainel", "Continue praticando para consolidar presença e constância.");
    } else if (progress.fase === "Treinamento") {
      setText("direcaoPainel", "Você já pode aprofundar firmeza, clareza e direção.");
    } else {
      setText("direcaoPainel", "Você atingiu prontidão para avançar à conexão operacional.");
    }
  }

  function bindCRSControls() {
    const btnStart = document.getElementById("btnStartCRS");
    const btnPause = document.getElementById("btnPauseCRS");
    const btnRestart = document.getElementById("btnRestartCRS");
    const btnStop = document.getElementById("btnStopCRS");
    const btnConectarPC = document.getElementById("btnConectarPC");

    if (btnStart) {
      btnStart.addEventListener("click", async () => {
        await window.ELAYON_CRS.start();
        setText("crsStatus", "captando");
        setText("painelMensagem", "Captação iniciada. Fale com naturalidade e observe a média da sua presença.");
      });
    }

    if (btnPause) {
      btnPause.addEventListener("click", () => {
        window.ELAYON_CRS.stop();
        setText("crsStatus", "pausado");
        setText("painelMensagem", "Pausa feita. Respire, reorganize a ideia e continue quando quiser.");
      });
    }

    if (btnRestart) {
      btnRestart.addEventListener("click", () => {
        window.ELAYON_CRS.stop();
        window.ELAYON_CRS.reset();
        window.ELAYON_CRS.render();
        setText("crsStatus", "reiniciado");
        setText("painelMensagem", "Sessão reiniciada. Recomece com mais presença e direção.");
      });
    }

    if (btnStop) {
      btnStop.addEventListener("click", () => {
        window.ELAYON_CRS.stop();

        const snapshot = window.ELAYON_CRS.snapshot();
        const result = window.ELAYON_ENGINE.commitSession(snapshot);

        setText("faseAtualPainel", result.fase);

        const progress = window.ELAYON_ENGINE.getProgress();
        setText("totalSessoesPainel", String(progress.sessoes));
        setText("painelMensagem", result.leitura);
        setText("crsStatus", "finalizado");

        if (btnConectarPC && result.fase === "Apto") {
          btnConectarPC.classList.remove("btn-secondary");
          btnConectarPC.classList.add("btn-primary");
        }

        localStorage.setItem("elayon_last_result", JSON.stringify({
          snapshot,
          result
        }));

        if (document.body.dataset.page === "fala-livre") {
          window.location.href = "resultado.html";
        }
      });
    }

    if (btnConectarPC) {
      btnConectarPC.addEventListener("click", () => {
        const progress = window.ELAYON_ENGINE.getProgress();
        if (progress.fase !== "Apto") {
          alert("Continue praticando. A conexão com o Elayon PC será liberada quando você atingir a fase Apto.");
          return;
        }
        alert("Conexão simbólica com Elayon PC liberada.");
      });
    }
  }

  function fillResultado() {
    const last = getLastResult();
    if (!last) return;

    const { snapshot, result } = last;
    const avg = snapshot.average;
    const strongest = Object.entries(avg).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
    const weakest = Object.entries(avg).sort((a, b) => a[1] - b[1]).slice(0, 2).map(([k]) => k);

    setText("resultadoMomentos", `Sua sessão mostrou média consistente em ${strongest.join(" e ")}, com espaço de crescimento em ${weakest.join(" e ")}.`);
    setText("resultadoFortes", `Os pontos mais fortes desta interação foram ${strongest.join(" e ")}.`);
    setText("resultadoMelhorias", `Vale observar melhor ${weakest.join(" e ")} nas próximas sessões.`);
    setText("resultadoEmocional", result.leitura);
    setText("resultadoNivel", result.fase);
    setText("resultadoScore", String(result.score));
    setText("resultadoFase", result.fase);

    if (result.fase === "Inato") {
      setText("resultadoProximo", "Repita a sessão com mais constância. O objetivo agora é fortalecer presença.");
    } else if (result.fase === "Treinamento") {
      setText("resultadoProximo", "Você já entrou em treinamento. Continue praticando para ganhar firmeza e clareza.");
    } else {
      setText("resultadoProximo", "Você atingiu prontidão para avançar. O próximo passo é a adesão simbólica ao ecossistema.");
    }
  }

  function bindCheckout() {
    const btn = document.getElementById("btnCheckoutFinal");
    if (!btn) return;

    btn.addEventListener("click", () => {
      alert("Adesão simbólica confirmada. Próxima etapa: expandir a conexão entre presença, trabalho e automação ética.");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    hydrateUser();
    bindCRSControls();
    fillResultado();
    bindCheckout();
  });
})();