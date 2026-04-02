window.ELAYON_CONFIG = {
  appName: "Elayon",

  app: {
    environment: "production",
    useSupabaseAuth: true,
    useCloudCRS: true,
    saveLocalProgress: true,
    maxLocalSessions: 10
  },

  routes: {
    entryPage: "index.html",
    signupPage: "cadastro.html",
    recoveryPage: "recuperar.html",
    connectionPage: "conexao.html",
    panelPage: "painel.html",
    audioPage: "audio.html",
    resultPage: "resultado.html",
    presentationPage: "apresentacao.html",
    checkoutPage: "checkout.html",
    nextPageAfterConnection: "painel.html"
  },

  supabase: {
    url: "https://eudcjihffrfmhzmfwtlg.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1ZGNqaWhmZnJmbWh6bWZ3dGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NDE3MjUsImV4cCI6MjA5MDMxNzcyNX0.2tod6vvl_4SAXzSmW1wU8Mk9pLn8fvhF2xrAZOysUu0"
  },

  crs: {
    baseUrl: "COLE_AQUI_URL_DO_CRS_CLOUD",
    endpoints: {
      health: "/health",
      analyze: "/analyze",
      config: "/config"
    }
  },

  phases: {
    inato: {
      label: "Inato",
      minScore: 0,
      description: "Primeiro contato, observação e percepção de si."
    },
    treinamento: {
      label: "Treinamento",
      minScore: 55,
      description: "Repetição consciente com leitura mais firme."
    },
    apto: {
      label: "Apto",
      minScore: 72,
      description: "Prontidão para avançar à conexão operacional."
    }
  },

  thresholds: {
    scoreTraining: 55,
    scoreApto: 72,
    highSilenceFrames: 120,
    veryHighSilenceFrames: 220,
    lowClarity: 45,
    lowStability: 45,
    lowContinuity: 45,
    lowFirmness: 45,
    goodPresence: 65,
    goodFirmness: 65,
    goodRhythm: 60,
    excellentRange: 82
  },

  modes: {
    "fala-livre": {
      label: "Fala livre",
      emphasis: "presença"
    },
    "apresentacao": {
      label: "Treino de apresentação",
      emphasis: "clareza"
    },
    "aula": {
      label: "Simulação de aula",
      emphasis: "didática"
    },
    "dialogo": {
      label: "Simulação de diálogo",
      emphasis: "resposta"
    },
    "audio": {
      label: "Análise de áudio",
      emphasis: "revisão"
    }
  },

  storageKeys: {
    auth: "elayon_auth",
    progress: "elayon_progress",
    lastResult: "elayon_last_result",
    lastCRSResponse: "elayon_last_crs_response",
    lastCRSPayload: "elayon_last_crs_payload"
  }
};