(function () {
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function bindPainel() {
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

  function hydratePainel() {
    const auth = JSON.parse(localStorage.getItem("elayon_auth") || "null");
    const progress = window.ELAYON_ENGINE.getProgress();

    if (auth?.login) setText("painelLogin", `Operador: ${auth.login}`);
    setText("faseAtualPainel", progress.fase);
    setText("totalSessoesPainel", String(progress.sessoes));
  }

  document.addEventListener("DOMContentLoaded", () => {
    hydratePainel();
    bindPainel();
  });
})();