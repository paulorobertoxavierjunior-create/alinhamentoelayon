const PRESENCA_KEYS = {
  user: "presenca_user",
  progress: "presenca_progress",
  draft: "presenca_session_draft"
};

function safeRead(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
 
function getUser() {
  return safeRead(PRESENCA_KEYS.user, null);
}

function setUser(user) {
  safeWrite(PRESENCA_KEYS.user, user);
}

function getDefaultProgress() {
  return {
    sessoes: 0,
    fase: "Expressão livre",
    ultimoModo: "Nenhum",
    alinhamento: "Pendente",
    leituraAtual: "Você ainda está iniciando sua jornada no Presença.",
    direcao: "Comece pela fala livre e observe como sua expressão se organiza."
  };
}

function getProgress() {
  return safeRead(PRESENCA_KEYS.progress, getDefaultProgress());
}

function setProgress(progress) {
  safeWrite(PRESENCA_KEYS.progress, progress);
}

function resetAllProgress() {
  localStorage.removeItem(PRESENCA_KEYS.user);
  localStorage.removeItem(PRESENCA_KEYS.progress);
  localStorage.removeItem(PRESENCA_KEYS.draft);
}

function nextDirection(lastMode, fase) {
  if (lastMode === "Fala livre") {
    return "Continue no treino de apresentação para fortalecer encadeamento e firmeza.";
  }
  if (lastMode === "Treino de apresentação") {
    return "Siga para simulação de aula e experimente explicar com mais didática.";
  }
  if (lastMode === "Simulação de aula") {
    return "Avance para diálogo e observe sua capacidade de resposta em tempo real.";
  }
  if (lastMode === "Simulação de diálogo") {
    return "Experimente a análise de áudio para se escutar com mais distância.";
  }
  if (lastMode === "Análise de áudio") {
    return `Sua fase atual é ${fase}. Retorne ao painel e escolha a trilha que mais desafia sua clareza.`;
  }
  return "Comece pela fala livre e observe como sua expressão se organiza.";
}

function updateProgressAfterSession(modeName) {
  const progress = getProgress();

  progress.sessoes = Number(progress.sessoes || 0) + 1;
  progress.ultimoModo = modeName;

  if (progress.sessoes >= 1) progress.fase = "Organização";
  if (progress.sessoes >= 3) progress.fase = "Clareza";
  if (progress.sessoes >= 5) progress.fase = "Firmeza";
  if (progress.sessoes >= 8) progress.fase = "Expansão";

  progress.leituraAtual = `Você realizou ${progress.sessoes} sessão(ões). Seu processo mostra evolução gradual em presença e estrutura.`;
  progress.direcao = nextDirection(progress.ultimoModo, progress.fase);

  setProgress(progress);
}

function modeNameFromPage(page) {
  if (page === "fala-livre") return "Fala livre";
  if (page === "apresentacao") return "Treino de apresentação";
  if (page === "aula") return "Simulação de aula";
  if (page === "dialogo") return "Simulação de diálogo";
  if (page === "audio") return "Análise de áudio";
  return "Modo desconhecido";
}

function fillHomeUserName() {
  const user = getUser();
  const el = document.getElementById("homeUserName");
  if (el && user?.nome) {
    el.textContent = user.nome;
  }
}

function fillPanel() {
  const user = getUser();
  const progress = getProgress();

  const userNome = document.getElementById("userNome");
  const userLogin = document.getElementById("userLogin");
  const userAlinhamento = document.getElementById("userAlinhamento");
  const statusFase = document.getElementById("statusFase");
  const statusSessoes = document.getElementById("statusSessoes");
  const statusUltimoModo = document.getElementById("statusUltimoModo");
  const painelLeituraAtual = document.getElementById("painelLeituraAtual");
  const painelDirecao = document.getElementById("painelDirecao");

  if (userNome) userNome.textContent = user?.nome || "Operador";
  if (userLogin) userLogin.textContent = user?.login || "—";
  if (userAlinhamento) userAlinhamento.textContent = progress.alinhamento || "Pendente";
  if (statusFase) statusFase.textContent = progress.fase || "Expressão livre";
  if (statusSessoes) statusSessoes.textContent = Number(progress.sessoes || 0);
  if (statusUltimoModo) statusUltimoModo.textContent = progress.ultimoModo || "Nenhum";
  if (painelLeituraAtual) painelLeituraAtual.textContent = progress.leituraAtual;
  if (painelDirecao) painelDirecao.textContent = progress.direcao;
}

function fillProgressPage() {
  const progress = getProgress();

  const faseAtual = document.getElementById("faseAtual");
  const totalSessoes = document.getElementById("totalSessoes");
  const ultimoModo = document.getElementById("ultimoModo");

  if (faseAtual) faseAtual.textContent = progress.fase || "Expressão livre";
  if (totalSessoes) totalSessoes.textContent = Number(progress.sessoes || 0);
  if (ultimoModo) ultimoModo.textContent = progress.ultimoModo || "Nenhum";
}

function bindCadastro() {
  const form = document.getElementById("cadastroForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome")?.value?.trim() || "";
    const email = document.getElementById("email")?.value?.trim() || "";
    const login = document.getElementById("login")?.value?.trim() || "";
    const senha = document.getElementById("senha")?.value?.trim() || "";

    setUser({ nome, email, login, senha });

    const progress = getProgress();
    progress.alinhamento = "Pendente";
    setProgress(progress);

    window.location.href = "alinhamento.html";
  });
}

function bindAlinhamento() {
  const btn = document.getElementById("btnEntrarPainel");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const progress = getProgress();
    progress.alinhamento = "Apto";
    progress.leituraAtual = "Seu alinhamento atual é consistente para seguir no processo.";
    progress.direcao = "Entre no painel e comece pela fala livre.";
    setProgress(progress);

    window.location.href = "painel.html";
  });
}

function bindModeStartAndFinish() {
  const page = document.body.dataset.page || "";
  const modeName = modeNameFromPage(page);

  const startBtn = document.getElementById("btnStartCRS");
  const finishBtn = document.getElementById("btnRegistrarSessao");

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (window.ELAYON_CRS && typeof window.ELAYON_CRS.start === "function") {
        window.ELAYON_CRS.start();
      }

      const status = document.getElementById("crsStatus");
      if (status) status.textContent = "captação em andamento";

      startBtn.disabled = true;
      startBtn.textContent = "Captação ativa";
    });
  }

  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      if (window.ELAYON_CRS && typeof window.ELAYON_CRS.stop === "function") {
        window.ELAYON_CRS.stop();
      }

      const snapshot =
        window.ELAYON_CRS && typeof window.ELAYON_CRS.snapshot === "function"
          ? window.ELAYON_CRS.snapshot()
          : null;

      safeWrite(PRESENCA_KEYS.draft, {
        modo: modeName,
        ts: new Date().toISOString(),
        crs: snapshot
      });

      updateProgressAfterSession(modeName);
      window.location.href = "resultado.html";
    });
  }
}

function bindReset() {
  const btn = document.getElementById("btnResetLocal");
  if (!btn) return;

  btn.addEventListener("click", () => {
    resetAllProgress();
    window.location.href = "index.html";
  });
}

function fillResultPage() {
  const draft = safeRead(PRESENCA_KEYS.draft, null);
  if (!draft || !draft.crs) return;

  const { crs, modo } = draft;
  const values = Object.values(crs);
  const media = values.length
    ? Math.round(values.reduce((acc, n) => acc + n, 0) / values.length)
    : 0;

  const strongest = Object.entries(crs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  const weakest = Object.entries(crs)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([k]) => k);

  const momentos = document.getElementById("resultadoMomentos");
  const fortes = document.getElementById("resultadoFortes");
  const melhorias = document.getElementById("resultadoMelhorias");
  const emocional = document.getElementById("resultadoEmocional");
  const nivel = document.getElementById("resultadoNivel");
  const proximo = document.getElementById("resultadoProximo");

  if (momentos) {
    momentos.textContent = `Na sessão de ${modo}, sua interação mostrou presença média de ${media}%, com variações naturais entre ritmo, clareza e estabilidade.`;
  }

  if (fortes) {
    fortes.textContent = `Seus pontos mais fortes nesta sessão foram ${strongest.join(", ")}.`;
  }

  if (melhorias) {
    melhorias.textContent = `Vale observar com mais atenção ${weakest.join(" e ")}, pois essas áreas ainda podem ganhar mais firmeza.`;
  }

  if (emocional) {
    if (crs.estabilidade >= 70 && crs.clareza >= 70) {
      emocional.textContent = "Momento de boa organização interna, com sinais de estabilidade e clareza crescente.";
    } else if (crs.ritmo >= 70 && crs.firmeza < 55) {
      emocional.textContent = "Momento de energia alta, com espaço para transformar impulso em mais firmeza.";
    } else if (crs.presenca >= 65) {
      emocional.textContent = "Momento de presença consistente, com boa base para aprofundar a expressão.";
    } else {
      emocional.textContent = "Momento de observação inicial, com sinais importantes de construção da própria presença.";
    }
  }

  if (nivel) {
    if (media >= 75) nivel.textContent = "Apto para avançar com segurança.";
    else if (media >= 60) nivel.textContent = "Consistente e em crescimento.";
    else if (media >= 45) nivel.textContent = "Em construção, com boa base de evolução.";
    else nivel.textContent = "Início de processo, com espaço real para fortalecimento.";
  }

  if (proximo) {
    proximo.textContent = nextDirection(modo, getProgress().fase || "Organização");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fillHomeUserName();
  fillPanel();
  fillProgressPage();
  fillResultPage();

  bindCadastro();
  bindAlinhamento();
  bindModeStartAndFinish();
  bindReset();
});