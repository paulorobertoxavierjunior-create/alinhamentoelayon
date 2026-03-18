window.ELAYON_CONFIG = {
  appName: "Elayon",

  routes: {
    nextPageAfterConnection: "painel.html",
    resultPage: "resultado.html"
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
  }
};