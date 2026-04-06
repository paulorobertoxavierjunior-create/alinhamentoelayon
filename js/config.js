window.ELAYON_CONFIG = {
  appName: "Elayon",

  routes: {
    home: "index.html",
    login: "index.html",
    signup: "cadastro.html",
    recovery: "recuperar.html",
    resetPassword: "redefinir-senha.html",
    confirmacao: "confirmacao.html",
    painel: "painel.html",
    perfil: "perfil.html",
    deleteAccount: "excluir-conta.html",
    apresentacao: "apresentacao.html",
    alinhamento: "alinhamento.html",
    resultPage: "resultado.html",
    progressPage: "progresso.html",
    afterLogin: "painel.html"
  },

  supabase: {
    url: "https://eudcjihffrfmhzmfwtlg.supabase.co",
    publishableKey: "sb_publishable_eFXj7d8dOSREvEJbZ0xQJg_NgPCI8Nz",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZGNqaWhmZnJmbWh6bWZ3dGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDE3MjUsImV4cCI6MjA5MDMxNzcyNX0.2tod6vvl_4SAXzSmW1wU8Mk9pLn8fvhF2xrAZOysUu0"
  },

  cloud: {
    enabled: true,
    crsEndpoint: "https://nucleo-crs-elayon.onrender.com/api/crs/analisar",
    timeoutMs: 15000
  },

  support: {
    email: "contato.elayon@gmail.com",
    deleteAccountSubject: "Solicitação de exclusão de conta"
  },

  projectLinks: {
    wordpressHome: "https://elayon.space/",
    wordpressProjeto: "https://elayon.space/projeto/",
    githubApp: "https://paulorobertoxavierjunior-create.github.io/alinhamentoelayon/index.html"
  },

  publicPages: [
    "index",
    "cadastro",
    "recuperar",
    "apresentacao",
    "alinhamento",
    "confirmacao",
    "redefinir-senha"
  ],

  protectedPages: [
    "painel",
    "perfil",
    "excluir-conta",
    "fala-livre",
    "dialogo",
    "aula",
    "audio",
    "resultado",
    "progresso"
  ],

  storageKeys: {
    currentSessionId: "elayon_current_session_id",
    currentMode: "elayon_current_mode",
    progress: "elayon_progress",
    lastResult: "elayon_last_result"
  },

  thresholds: {
    scoreApto: 75,
    scoreTraining: 50,
    highSilenceFrames: 40,
    veryHighSilenceFrames: 80,
    lowClarity: 40,
    lowStability: 40,
    lowContinuity: 40,
    lowFirmness: 40,
    goodPresence: 60,
    goodFirmness: 60,
    goodRhythm: 60,
    excellentRange: 85
  },

  modes: {
    "fala-livre": { label: "Fala Livre" },
    "apresentacao": { label: "Apresentação" },
    "aula": { label: "Aula" },
    "dialogo": { label: "Diálogo" },
    "audio": { label: "Áudio" }
  }
};

// compatibilidade direta com o app.js atual
const SUPABASE_URL = window.ELAYON_CONFIG.supabase.url;
const SUPABASE_ANON_KEY = window.ELAYON_CONFIG.supabase.anonKey;