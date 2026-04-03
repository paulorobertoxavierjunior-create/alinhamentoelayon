window.ELAYON_CONFIG = {
  appName: "Elayon",

  app: {
    environment: "production",
    useSupabaseAuth: true
  },

  routes: {
    entryPage: "index.html",
    signupPage: "cadastro.html",
    recoveryPage: "recuperar.html",
    connectionPage: "conexao.html",
    panelPage: "painel.html",
    resultPage: "resultado.html",
    nextPageAfterConnection: "painel.html"
  },

  supabase: {
    url: "https://eudcjihffrfmhzmfwtlg.supabase.co",
    key: "sb_publishable_eFXj7d8dOSREvEJbZ0xQJg_NgPCI8Nz"
  },

  storageKeys: {
    auth: "elayon_auth",
    progress: "elayon_progress",
    lastResult: "elayon_last_result"
  }
};