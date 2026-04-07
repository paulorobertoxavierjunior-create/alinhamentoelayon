(function () {
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function speak(text) {
    if (!text || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.rate = 1;
    utter.pitch = 1;
    utter.volume = 1;

    window.speechSynthesis.speak(utter);
  }

  function getCockpitFields() {
    return {
      tema: (document.getElementById("falaTema")?.value || "").trim(),
      objetivo: (document.getElementById("falaObjetivo")?.value || "").trim()
    };
  }

  function buildLocalReading(snapshot) {
    if (!snapshot || !snapshot.average) {
      return {
        resumo: "Ainda não houve leitura suficiente para análise.",
        tendencia: "inicial"
      };
    }

    const avg = snapshot.average;

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

    let tendencia = "inicial";
    if (score >= 75) tendencia = "alta";
    else if (score >= 50) tendencia = "em ajuste";
    else tendencia = "instável";

    let resumo = "Sua fala mostrou sinais iniciais de presença.";
    if (score >= 75) {
      resumo = "Boa leitura. Você apresentou presença, continuidade e direção mais consistentes.";
    } else if (score >= 50) {
      resumo = "Leitura moderada. Há base real, mas ainda vale organizar mais a fala e sustentar melhor o fluxo.";
    } else {
      resumo = "Leitura inicial. Vale reduzir pausas longas e buscar mais firmeza na continuidade da fala.";
    }

    return { resumo, tendencia, score };
  }

  async function bindCockpit() {
    const btnMic = document.getElementById("btnMic");
    const btnStart = document.getElementById("btnStartCRS");
    const btnPause = document.getElementById("btnPauseCRS");
    const btnRestart = document.getElementById("btnRestartCRS");
    const btnStop = document.getElementById("btnStopCRS");
    const btnOuvir = document.getElementById("btnOuvirResposta");
    const btnContinuar = document.getElementById("btnContinuarLoop");

    if (!window.ELAYON_CRS) {
      console.error("ELAYON_CRS não encontrado.");
      return;
    }

    if (btnMic) {
      btnMic.addEventListener("click", async () => {
        try {
          await window.ELAYON_CRS.start();
          await window.ELAYON_CRS.stop();

          setText("crsStatus", "microfone pronto");
          setText("kpiState", "microfone autorizado");
          setText("painelMensagem", "Microfone autorizado. Agora você pode ativar a presença.");
        } catch (err) {
          console.error(err);
          setText("crsStatus", "falha no microfone");
          setText("kpiState", "erro");
          setText("painelMensagem", "Não foi possível acessar o microfone.");
        }
      });
    }

    if (btnStart) {
      btnStart.addEventListener("click", async () => {
        try {
          const fields = getCockpitFields();

          await window.ELAYON_CRS.start();

          setText("crsStatus", "captando");
          setText("kpiState", "captando");
          setText("kpiSess", fields.tema || "fala livre");
          setText("kpiRec", "ao vivo");
          setText(
            "painelMensagem",
            `Captação iniciada${fields.tema ? ` para o tema "${fields.tema}"` : ""}. Fale com naturalidade.`
          );
        } catch (err) {
          console.error(err);
          setText("crsStatus", "erro ao iniciar");
          setText("kpiState", "erro");
        }
      });
    }

    if (btnPause) {
      btnPause.addEventListener("click", async () => {
        try {
          await window.ELAYON_CRS.stop();
          setText("crsStatus", "pausado");
          setText("kpiState", "pausado");
          setText("painelMensagem", "Sessão pausada. Respire, reorganize a ideia e continue quando quiser.");
        } catch (err) {
          console.error(err);
        }
      });
    }

    if (btnRestart) {
      btnRestart.addEventListener("click", async () => {
        try {
          await window.ELAYON_CRS.stop();

          if (window.ELAYON_CRS.historyVolume) window.ELAYON_CRS.historyVolume = [];
          if (window.ELAYON_CRS.historySilence) window.ELAYON_CRS.historySilence = [];
          if (window.ELAYON_CRS.current) {
            window.ELAYON_CRS.current = {
              presenca: 12,
              clareza: 12,
              ritmo: 12,
              firmeza: 12,
              continuidade: 12,
              estabilidade: 12
            };
          }

          if (window.ELAYON_CRS.renderBars) {
            window.ELAYON_CRS.renderBars();
          }

          setText("crsStatus", "reiniciado");
          setText("kpiState", "reiniciado");
          setText("kpiRec", "00:00");
          setText("painelMensagem", "Sessão reiniciada. Pronto para novo ciclo.");
          setText("respostaIA", "A resposta da ferramenta aparecerá aqui depois da leitura.");
          setText("resumoOperacional", "Use esta área para observar foco, continuidade e prontidão ao longo da interação.");
        } catch (err) {
          console.error(err);
        }
      });
    }

    if (btnStop) {
      btnStop.addEventListener("click", async () => {
        try {
          await window.ELAYON_CRS.stop();

          const snapshot = window.ELAYON_CRS.snapshot
            ? window.ELAYON_CRS.snapshot()
            : { average: window.ELAYON_CRS.current || {} };

          const reading = buildLocalReading(snapshot);

          setText("crsStatus", "leitura pronta");
          setText("kpiState", "finalizado");
          setText("crsTrend", reading.tendencia);
          setText("memoriaAtual", reading.tendencia);
          setText("memoriaTendencia", reading.tendencia);
          setText("memoriaResumo", reading.resumo);
          setText("respostaIA", reading.resumo);
          setText("resumoOperacional", reading.resumo);
          setText("painelMensagem", "Leitura concluída. Você pode ouvir a resposta ou continuar falando.");

          localStorage.setItem(
            "elayon_last_result",
            JSON.stringify({
              snapshot,
              result: {
                score: reading.score || 0,
                fase:
                  (reading.score || 0) >= 75
                    ? "Apto"
                    : (reading.score || 0) >= 50
                    ? "Treinamento"
                    : "Inato",
                leituraBase: reading.resumo,
                direction: reading.resumo,
                averages: snapshot.average || {}
              },
              savedAt: new Date().toISOString()
            })
          );

          speak(reading.resumo);
        } catch (err) {
          console.error(err);
          setText("crsStatus", "falha na leitura");
          setText("kpiState", "erro");
        }
      });
    }

    if (btnOuvir) {
      btnOuvir.addEventListener("click", () => {
        const text = document.getElementById("respostaIA")?.textContent || "";
        speak(text);
      });
    }

    if (btnContinuar) {
      btnContinuar.addEventListener("click", async () => {
        try {
          await window.ELAYON_CRS.start();
          setText("crsStatus", "captando");
          setText("kpiState", "novo ciclo");
          setText(
            "painelMensagem",
            "Novo ciclo iniciado. Continue falando com base na leitura anterior."
          );
        } catch (err) {
          console.error(err);
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await bindCockpit();
  });
})();