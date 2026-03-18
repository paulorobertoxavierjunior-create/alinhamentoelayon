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

  function getModeKeyFromPage() {
    const page = document.body.dataset.page || "";
    if (ELAYON_CONFIG.modes[page]) return page;
    return "fala-livre";
  }

  function hydrateUser() {
    const auth = JSON.parse(localStorage.getItem("elayon_auth") || "null");
    const progress = window.ELAYON_ENGINE
      ? window.ELAYON_ENGINE.getProgress()
      : { fase: "Inato", sessoes: 0, ultimoScore: 0, direcao: "" };

    if (auth?.login) setText("painelLogin", `Operador: ${auth.login}`);

    setText("faseAtualPainel", progress.fase || "Inato");
    setText("totalSessoesPainel", String(progress.sessoes || 0));
    setText("ultimoScorePainel", String(progress.ultimoScore || 0));
    setText("direcaoPainel", progress.direcao || "Continue praticando com calma e constância.");
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
        const modeKey = getModeKeyFromPage();
        const result = window.ELAYON_ENGINE.commitSession(snapshot, modeKey);

        setText("faseAtualPainel", result.fase);

        const progress = window.ELAYON_ENGINE.getProgress();
        setText("totalSessoesPainel", String(progress.sessoes));
        setText("painelMensagem", result.leituraBase);
        setText("crsStatus", "finalizado");

        if (btnConectarPC && result.fase === "Apto") {
          btnConectarPC.classList.remove("btn-secondary");
          btnConectarPC.classList.add("btn-primary");
        }

        if (document.body.dataset.page !== "painel") {
          window.location.href = ELAYON_CONFIG.routes.resultPage;
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
    if (!window.ELAYON_READER) return;

    const reading = window.ELAYON_READER.buildReading(last);

    setText("resultadoMomentos", reading.momentos);
    setText("resultadoFortes", reading.fortes);
    setText("resultadoMelhorias", reading.melhorias);
    setText("resultadoEmocional", reading.emocional);
    setText("resultadoNivel", reading.nivel);
    setText("resultadoScore", String(reading.score));
    setText("resultadoFase", reading.fase);
    setText("resultadoProximo", reading.proximo);
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