const PRESENCA_STORE = {
  user: "presenca_user",
  progress: "presenca_progress",
  sessionDraft: "presenca_session_draft"
};

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUser() {
  return readJSON(PRESENCA_STORE.user, null);
}

function setUser(user) {
  writeJSON(PRESENCA_STORE.user, user);
}

function getProgress() {
  return readJSON(PRESENCA_STORE.progress, {
    sessoes: 0,
    fase: "Expressão livre",
    ultimoModo: "Nenhum",
    alinhamento: "Apto",
    leituraAtual: "Você ainda está iniciando sua jornada no Presença.",
    direcao: "Comece pela fala livre e observe como sua expressão se organiza."
  });
}

function setProgress(progress) {
  writeJSON(PRESENCA_STORE.progress, progress);
}

function updateProgressFromMode(modeName) {
  const progress = getProgress();
  progress.sessoes += 1;
  progress.ultimoModo = modeName;

  if (progress.sessoes >= 1) progress.fase = "Organização";
  if (progress.sessoes >= 3) progress.fase = "Clareza";
  if (progress.sessoes >= 5) progress.fase = "Firmeza";
  if (progress.sessoes >= 8) progress.fase = "Expansão";

  progress.leituraAtual = `Você realizou ${progress.sessoes} sessão(ões). Seu processo mostra evolução gradual em presença e estrutura.`;
  progress.direcao = nextDirection(progress.ultimoModo, progress.fase);

  setProgress(progress);
}

function nextDirection(lastMode, fase) {
  if (lastMode === "Fala livre") return "Continue pelo modo de apresentação para fortalecer encadeamento e firmeza.";
  if (lastMode === "Treino de apresentação") return "Siga para simulação de aula e experimente explicar com mais didática.";
  if (lastMode === "Simulação de aula") return "Avance para diálogo e observe sua capacidade de resposta em tempo real.";
  if (lastMode === "Simulação de diálogo") return "Experimente a análise de áudio para se escutar com mais distância.";
  if (lastMode === "Análise de áudio") return `Sua fase atual é ${fase}. Retorne ao painel e escolha a trilha que mais desafia sua clareza.`;
  return "Comece pela fala livre e observe como sua expressão se organiza.";
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
  if (userAlinhamento) userAlinhamento.textContent = progress.alinhamento || "Apto";
  if (statusFase) statusFase.textContent = progress.fase;
  if (statusSessoes) statusSessoes.textContent = progress.sessoes;
  if (statusUltimoModo) statusUltimoModo.textContent = progress.ultimoModo;
  if (painelLeituraAtual) painelLeituraAtual.textContent = progress.leituraAtual;
  if (painelDirecao) painelDirecao.textContent = progress.direcao;
}

function fillProgressPage() {
  const progress = getProgress();

  const faseAtual = document.getElementById("faseAtual");
  const totalSessoes = document.getElementById("totalSessoes");
  const ultimoModo = document.getElementById("ultimoModo");

  if (faseAtual) faseAtual.textContent = progress.fase;
  if (totalSessoes) totalSessoes.textContent = progress.sessoes;
  if (ultimoModo) ultimoModo.textContent = progress.ultimoModo;
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
  const btnEntrar = document.getElementById("btnEntrarPainel");
  if (!btnEntrar) return;

  btnEntrar.addEventListener("click", () => {
    const progress = getProgress();
    progress.alinhamento = "Apto";
    progress.leituraAtual = "Seu alinhamento atual é consistente para seguir no processo.";
    progress.direcao = "Entre no painel e comece pela fala livre.";
    setProgress(progress);

    window.location.href = "painel.html";
  });
}

function bindModePage(modeName) {
  const btnAvaliar = document.getElementById("btnRegistrarSessao");
  if (!btnAvaliar) return;

  btnAvaliar.addEventListener("click", () => {
    updateProgressFromMode(modeName);
    window.location.href = "resultado.html";
  });
}

function bindReset() {
  const btn = document.getElementById("btnResetLocal");
  if (!btn) return;

  btn.addEventListener("click", () => {
    localStorage.removeItem(PRESENCA_STORE.user);
    localStorage.removeItem(PRESENCA_STORE.progress);
    localStorage.removeItem(PRESENCA_STORE.sessionDraft);
    window.location.href = "index.html";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindCadastro();
  bindAlinhamento();
  bindReset();

  fillPanel();
  fillProgressPage();

  const bodyPage = document.body.dataset.page;

  if (bodyPage === "fala-livre") bindModePage("Fala livre");
  if (bodyPage === "apresentacao") bindModePage("Treino de apresentação");
  if (bodyPage === "aula") bindModePage("Simulação de aula");
  if (bodyPage === "dialogo") bindModePage("Simulação de diálogo");
  if (bodyPage === "audio") bindModePage("Análise de áudio");
});