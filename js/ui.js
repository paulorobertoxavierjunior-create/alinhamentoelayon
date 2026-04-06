(function () {
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function falarTexto(texto) {
    if (!texto || !("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = "pt-BR";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function getPageModeKey() {
    const page = document.body.dataset.page || "";
    if (window.ELAYON_CONFIG?.modes?.[page]) return page;
    return "fala-livre";
  }

  function isCockpitPage() {
    return document.body.dataset.page === "fala-livre";
  }

  async function getAuthUser() {
    if (
      !window.supabase ||
      !window.ELAYON_CONFIG?.supabase?.url ||
      !window.ELAYON_CONFIG?.supabase?.anonKey
    ) {
      return null;
    }

    const client = window.supabase.createClient(
      window.ELAYON_CONFIG.supabase.url,
      window.ELAYON_CONFIG.supabase.anonKey
    );

    const { data } = await client.auth.getSession();
    return data?.session?.user || null;
  }

  async function hydrateUser() {
    const authUser = await getAuthUser();

    const progress = window.ELAYON_ENGINE
      ? window.ELAYON_ENGINE.getProgress()
      : { fase: "Inato", sessoes: 0, ultimoScore: 0, direcao: "" };

    if (authUser?.email) {
      const nome = authUser.user_metadata?.nome || "Operador";
      setText("painelLogin", `${nome} • ${authUser.email}`);
      setText("perfilNome", nome);
      setText("perfilEmail", authUser.email);
    }

    setText("faseAtualPainel", progress.fase || "Inato");
    setText("totalSessoesPainel", String(progress.sessoes || 0));
    setText("ultimoScorePainel", String(progress.ultimoScore || 0));
    setText(
      "direcaoPainel",
      progress.direcao || "Continue praticando com calma e constância."
    );
  }

  function saveLoopMemory(entry) {
    const key = "elayon_loop_memory";
    let items = [];

    try {
      items = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {}

    items.push({
      at: new Date().toISOString(),
      ...entry
    });

    items = items.slice(-3);
    localStorage.setItem(key, JSON.stringify(items));
    return items;
  }

  function readLoopMemory() {
    try {
      return JSON.parse(localStorage.getItem("elayon_loop_memory") || "[]");
    } catch {
      return [];
    }
  }

  function updateLoopMemoryUI() {
    const items = readLoopMemory();
    const atual = items[items.length - 1] || null;
    const anterior = items[items.length - 2] || null;

    setText("memoriaAtual", atual?.label || "—");
    setText("memoriaAnterior", anterior?.label || "—");

    if (!atual || !anterior) {
      setText("memoriaTendencia", "inicial");
      setText(
        "memoriaResumo",
        "Ainda não há histórico curto suficiente para comparação."
      );
      setText("crsTrend", "inicial");
      return;
    }

    let tendencia = "mantendo";
    if ((atual.score || 0) > (anterior.score || 0)) tendencia = "melhorando";
    if ((atual.score || 0) < (anterior.score || 0)) tendencia = "oscilando";

    setText("memoriaTendencia", tendencia);
    setText("crsTrend", tendencia);
    setText(
      "memoriaResumo",
      `Leitura atual: ${atual.label}. Comparada à anterior, a tendência está ${tendencia}.`
    );
  }

  function classifyLoopLabel(score, fase) {
    if (fase === "Apto" || score >= 75) return "foco alto";
    if (fase === "Treinamento" || score >= 50) return "em ajuste";
    return "instável";
  }

  function fillCockpitReading(localResult, cloudResult) {
    if (!isCockpitPage()) return;

    const localScore = localResult?.result?.score || 0;
    const localFase = localResult?.result?.fase || "Inato";
    const label = classifyLoopLabel(localScore, localFase);

    setText("memoriaAtual", label);

    const summary =
      cloudResult?.user_report?.summary ||
      localResult?.result?.leituraBase ||
      "Leitura concluída.";

    setText("respostaIA", summary);
    setText("resumoOperacional", summary);

    saveLoopMemory({
      score: localScore,
      fase: localFase,
      label,
      summary
    });

    updateLoopMemoryUI();
  }

  async function bindCRSControls() {
    const btnStart = document.getElementById("btnStartCRS");
    const btnPause = document.getElementById("btnPauseCRS");
    const btnRestart = document.getElementById("btnRestartCRS");
    const btnStop = document.getElementById("btnStopCRS");
    const btnConectarPC = document.getElementById("btnConectarPC");
    const btnOuvirResposta = document.getElementById("btnOuvirResposta");
    const btnContinuarLoop = document.getElementById("btnContinuarLoop");

    if (btnStart) {
      btnStart.addEventListener("click", async () => {
        if (!window.ELAYON_CRS) return;

        await window.ELAYON_CRS.start();
        setText("crsStatus", "captando");
        setText(
          "painelMensagem",
          "Captação iniciada. Fale com naturalidade e observe a média da sua presença."
        );
      });
    }

    if (btnPause) {
      btnPause.addEventListener("click", async () => {
        if (!window.ELAYON_CRS) return;

        await window.ELAYON_CRS.stop();
        setText("crsStatus", "pausado");
        setText(
          "painelMensagem",
          "Pausa feita. Respire, reorganize a ideia e continue quando quiser."
        );
      });
    }

    if (btnRestart) {
      btnRestart.addEventListener("click", async () => {
        if (!window.ELAYON_CRS) return;

        await window.ELAYON_CRS.stop();
        window.ELAYON_CRS.reset();
        window.ELAYON_CRS.render();

        setText("crsStatus", "reiniciado");
        setText(
          "painelMensagem",
          "Sessão reiniciada. Recomece com mais presença e direção."
        );
        setText("respostaIA", "A resposta da ferramenta aparecerá aqui depois da próxima leitura.");
      });
    }

    if (btnStop) {
      btnStop.addEventListener("click", async () => {
        if (!window.ELAYON_CRS || !window.ELAYON_ENGINE) return;

        await window.ELAYON_CRS.stop();

        const snapshot = window.ELAYON_CRS.snapshot();
        const modeKey = getPageModeKey();
        const result = await window.ELAYON_ENGINE.commitSession(snapshot, modeKey);

        setText("faseAtualPainel", result.fase || "Inato");

        const progress = window.ELAYON_ENGINE.getProgress();
        setText("totalSessoesPainel", String(progress.sessoes || 0));
        setText("ultimoScorePainel", String(progress.ultimoScore || 0));
        setText(
          "direcaoPainel",
          progress.direcao || "Continue praticando com calma e constância."
        );
        setText("painelMensagem", result.leituraBase || "Sessão registrada.");
        setText("crsStatus", "analisando");

        if (btnConectarPC && result.fase === "Apto") {
          btnConectarPC.classList.remove("btn-secondary");
          btnConectarPC.classList.add("btn-primary");
        }

        const tema = document.getElementById("falaTema")?.value?.trim() || "fala livre";
        const objetivo = document.getElementById("falaObjetivo")?.value?.trim() || "";

        const cloudResponse = await window.ELAYON_CRS.sendToCloud({
          context: tema,
          transcript_raw: "",
          source_text: objetivo
        });

        if (cloudResponse?.ok && cloudResponse?.data) {
          localStorage.setItem(
            "elayon_last_cloud_result",
            JSON.stringify(cloudResponse.data)
          );

          const summary =
            cloudResponse.data?.user_report?.summary ||
            "Leitura em nuvem concluída com sucesso.";

          setText("painelMensagem", summary);
          setText("respostaIA", summary);
          setText("resumoOperacional", summary);
          setText("crsStatus", "leitura pronta");

          fillCockpitReading(
            JSON.parse(localStorage.getItem("elayon_last_result") || "null"),
            cloudResponse.data
          );

          falarTexto(summary);
          return;
        }

        if (cloudResponse?.skipped) {
          console.warn("Nuvem ignorada:", cloudResponse.reason);
          setText("crsStatus", "nuvem ignorada");
        } else {
          console.warn("Falha na resposta da nuvem:", cloudResponse);
          setText("crsStatus", "falha na nuvem");
        }

        const localResult = JSON.parse(localStorage.getItem("elayon_last_result") || "null");
        fillCockpitReading(localResult, null);
      });
    }

    if (btnOuvirResposta) {
      btnOuvirResposta.addEventListener("click", () => {
        const texto = document.getElementById("respostaIA")?.textContent || "";
        falarTexto(texto);
      });
    }

    if (btnContinuarLoop) {
      btnContinuarLoop.addEventListener("click", async () => {
        if (!window.ELAYON_CRS) return;

        await window.ELAYON_CRS.start();
        setText("crsStatus", "captando");
        setText(
          "painelMensagem",
          "Novo ciclo iniciado. Continue falando e ajuste seu foco com base na leitura anterior."
        );
      });
    }

    if (btnConectarPC) {
      btnConectarPC.addEventListener("click", () => {
        const progress = window.ELAYON_ENGINE?.getProgress?.();

        if (!progress || progress.fase !== "Apto") {
          alert(
            "Continue praticando. A conexão com o Elayon PC será liberada quando você atingir a fase Apto."
          );
          return;
        }

        alert("Conexão simbólica com Elayon PC liberada.");
      });
    }
  }

  function fillResultado() {
    if (!window.ELAYON_READER) return;

    let localResult = null;
    let cloudResult = null;

    try {
      localResult = JSON.parse(localStorage.getItem("elayon_last_result") || "null");
    } catch {}

    try {
      cloudResult = JSON.parse(
        localStorage.getItem("elayon_last_cloud_result") || "null"
      );
    } catch {}

    const reading = window.ELAYON_READER.buildReading(localResult);

    setText("resultadoMomentos", reading.momentos);
    setText("resultadoFortes", reading.fortes);
    setText("resultadoMelhorias", reading.melhorias);
    setText("resultadoEmocional", reading.emocional);
    setText("resultadoNivel", reading.nivel);
    setText("resultadoScore", String(reading.score));
    setText("resultadoFase", reading.fase);
    setText("resultadoProximo", reading.proximo);

    if (cloudResult?.user_report?.summary) {
      setText("resultadoEmocional", cloudResult.user_report.summary);
    }
  }

  function bindCheckout() {
    const btn = document.getElementById("btnCheckoutFinal");
    if (!btn) return;

    btn.addEventListener("click", () => {
      alert(
        "Adesão simbólica confirmada. Próxima etapa: expandir a conexão entre presença, trabalho e automação ética."
      );
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await hydrateUser();
    await bindCRSControls();
    updateLoopMemoryUI();
    fillResultado();
    bindCheckout();
  });
})();

Considerei essa parte atual e o print. 

Observa a fala, não tem pra onde ir. Esse ui aí tá apontando pro página errada. Precisamos corrigir limpo pq a estrutura ta linda. 

Percebe ? 
Ficou bonito mas tá usando a página de resultado. Acho que tá apontando pra ela. 
E da uma olhada na interação viva e nas páginas e ideias em volta.  need answer fix no redirect maybe old cached or page includes result page above? The screenshot first shows result page likely user navigated there manually. Need point out ui.js no redirect maybe old version still had redirect. Need likely result.html still linked by buttons. Need inspect new ui.js no redirect; ensure fala-livre.html doesn't include result.html? Could mention app.js route protection not issue. Need perhaps clear browser cache / hard reload on github pages. Also screenshot shows top of result page then cockpit below maybe maybe merged pages? Wait images show result page screenshot then cockpit screenshot likely separate. Need answer concise with clean fix and note likely old cached ui.js or still using old HTML with links. Maybe bindStop on current ui still no redirect? In provided ui.js, indeed no redirect. So issue maybe button labeled "Ler agora" but going result because HTML id mismatched? Actually if clicking "Ler agora" maybe form submit? Buttons type="button" yes. Could be reading cloud response then browser auto navigating because btnStop in old cached js. So tell to version bump/cachbuster. Also maybe result page still auto open due to anchor elsewhere? Let's answer with likely cause and exact checks: ensure fala-livre.html has no href resultado, remove old script caching by js/ui.js?v=3 and crs.js?v=3. Provide updated script tags. Mention old page top screenshot was result page separate not embedded. Need maybe update config routes not used. Let's craft.