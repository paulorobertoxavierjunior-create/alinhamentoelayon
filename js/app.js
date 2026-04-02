(function () {
  const CONFIG = window.ELAYON_CONFIG || {};

  function getConfig(path, fallback = null) {
    try {
      return path.split(".").reduce((acc, key) => acc[key], CONFIG) ?? fallback;
    } catch {
      return fallback;
    }
  }

  const STORE_KEYS = {
    auth: getConfig("storageKeys.auth", "elayon_auth")
  };

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function read(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  function setMessage(targetId, message, type = "default") {
    const box = document.getElementById(targetId);
    if (!box) return;

    box.textContent = message || "";
    box.className = "form-message";

    if (type === "error") box.classList.add("error");
    if (type === "success") box.classList.add("success");
  }

  function setButtonLoading(buttonId, isLoading, defaultText, loadingText) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    button.disabled = isLoading;
    button.textContent = isLoading ? loadingText : defaultText;
  }

  function normalize(value) {
    return String(value || "").trim();
  }

  function isSupabaseEnabled() {
    return !!getConfig("app.useSupabaseAuth", false);
  }

  function hasSupabaseCredentials() {
    const url = getConfig("supabase.url", "");
    const anonKey = getConfig("supabase.anonKey", "");
    return !!url && !url.includes("COLE_AQUI") && !!anonKey && !anonKey.includes("COLE_AQUI");
  }

  function getSupabaseClient() {
    if (!window.supabase || !window.supabase.createClient) return null;

    const url = getConfig("supabase.url", "");
    const anonKey = getConfig("supabase.anonKey", "");

    if (!url || !anonKey || url.includes("COLE_AQUI") || anonKey.includes("COLE_AQUI")) {
      return null;
    }

    return window.supabase.createClient(url, anonKey);
  }

  async function trySupabaseLogin(login, senha) {
    if (!isSupabaseEnabled()) {
      return { ok: false, reason: "supabase_disabled" };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { ok: false, reason: "supabase_not_ready" };
    }

    try {
      const payload = login.includes("@")
        ? { email: login, password: senha }
        : { email: login, password: senha };

      const { data, error } = await client.auth.signInWithPassword(payload);

      if (error) {
        return { ok: false, reason: "auth_error", error };
      }

      return { ok: true, data };
    } catch (error) {
      return { ok: false, reason: "auth_exception", error };
    }
  }

  async function trySupabaseSignup(nome, email, senha) {
    if (!isSupabaseEnabled()) {
      return { ok: false, reason: "supabase_disabled" };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { ok: false, reason: "supabase_not_ready" };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            nome
          }
        }
      });

      if (error) {
        return { ok: false, reason: "signup_error", error };
      }

      return { ok: true, data };
    } catch (error) {
      return { ok: false, reason: "signup_exception", error };
    }
  }

  async function trySupabaseRecovery(email) {
    if (!isSupabaseEnabled()) {
      return { ok: false, reason: "supabase_disabled" };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { ok: false, reason: "supabase_not_ready" };
    }

    try {
      const redirectTo = window.location.origin + "/" + getConfig("routes.entryPage", "index.html");

      const { data, error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) {
        return { ok: false, reason: "recovery_error", error };
      }

      return { ok: true, data };
    } catch (error) {
      return { ok: false, reason: "recovery_exception", error };
    }
  }

  function persistAuthSession(login, source = "local") {
    const payload = {
      login,
      source,
      connectedAt: new Date().toISOString(),
      authenticated: true
    };

    write(STORE_KEYS.auth, payload);
    return payload;
  }

  function goAfterLogin() {
    const nextPage = getConfig("routes.nextPageAfterConnection", "painel.html");
    window.location.href = nextPage;
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    const login = normalize(document.getElementById("login")?.value);
    const senha = normalize(document.getElementById("senha")?.value);

    if (!login || !senha) {
      setMessage("formMessage", "Preencha login e senha para continuar.", "error");
      return;
    }

    setMessage("formMessage", "");
    setButtonLoading("submitButton", true, "Entrar no sistema", "Entrando...");

    const result = await trySupabaseLogin(login, senha);

    if (result.ok) {
      persistAuthSession(login, "supabase");
      setMessage("formMessage", "Acesso confirmado. Entrando no sistema...", "success");
      setTimeout(goAfterLogin, 500);
      return;
    }

    if (result.reason === "supabase_disabled" || result.reason === "supabase_not_ready") {
      persistAuthSession(login, "local-fallback");
      setMessage(
        "formMessage",
        "Autenticação real ainda em configuração. Entrada liberada em modo controlado.",
        "success"
      );
      setTimeout(goAfterLogin, 700);
      return;
    }

    if (result.reason === "auth_error") {
      const msg = result.error?.message || "Não foi possível autenticar.";
      setMessage("formMessage", `Falha no acesso: ${msg}`, "error");
      setButtonLoading("submitButton", false, "Entrar no sistema", "Entrando...");
      return;
    }

    setMessage("formMessage", "Erro inesperado ao tentar entrar.", "error");
    setButtonLoading("submitButton", false, "Entrar no sistema", "Entrando...");
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();

    const nome = normalize(document.getElementById("signupName")?.value);
    const email = normalize(document.getElementById("signupEmail")?.value);
    const senha = normalize(document.getElementById("signupPassword")?.value);
    const confirmar = normalize(document.getElementById("signupPasswordConfirm")?.value);

    if (!nome || !email || !senha || !confirmar) {
      setMessage("signupMessage", "Preencha todos os campos do cadastro.", "error");
      return;
    }

    if (senha.length < 6) {
      setMessage("signupMessage", "A senha precisa ter pelo menos 6 caracteres.", "error");
      return;
    }

    if (senha !== confirmar) {
      setMessage("signupMessage", "As senhas não coincidem.", "error");
      return;
    }

    setMessage("signupMessage", "");
    setButtonLoading("signupButton", true, "Criar acesso", "Criando acesso...");

    const result = await trySupabaseSignup(nome, email, senha);

    if (result.ok) {
      setMessage(
        "signupMessage",
        "Cadastro realizado com sucesso. Verifique seu e-mail para confirmar o acesso, se necessário.",
        "success"
      );
      setButtonLoading("signupButton", false, "Criar acesso", "Criando acesso...");
      return;
    }

    if (result.reason === "supabase_disabled" || result.reason === "supabase_not_ready") {
      setMessage(
        "signupMessage",
        "Cadastro real ainda em configuração. Estrutura pronta para ativação com Supabase.",
        "success"
      );
      setButtonLoading("signupButton", false, "Criar acesso", "Criando acesso...");
      return;
    }

    if (result.reason === "signup_error") {
      const msg = result.error?.message || "Não foi possível criar o acesso.";
      setMessage("signupMessage", `Falha no cadastro: ${msg}`, "error");
      setButtonLoading("signupButton", false, "Criar acesso", "Criando acesso...");
      return;
    }

    setMessage("signupMessage", "Erro inesperado ao criar acesso.", "error");
    setButtonLoading("signupButton", false, "Criar acesso", "Criando acesso...");
  }

  async function handleRecoverySubmit(event) {
    event.preventDefault();

    const email = normalize(document.getElementById("recoveryEmail")?.value);

    if (!email) {
      setMessage("recoveryMessage", "Informe seu e-mail para continuar.", "error");
      return;
    }

    setMessage("recoveryMessage", "");
    setButtonLoading("recoveryButton", true, "Enviar recuperação", "Enviando...");

    const result = await trySupabaseRecovery(email);

    if (result.ok) {
      setMessage(
        "recoveryMessage",
        "Se o e-mail estiver cadastrado, o fluxo de recuperação foi iniciado.",
        "success"
      );
      setButtonLoading("recoveryButton", false, "Enviar recuperação", "Enviando...");
      return;
    }

    if (result.reason === "supabase_disabled" || result.reason === "supabase_not_ready") {
      setMessage(
        "recoveryMessage",
        "Recuperação real ainda em configuração. Fluxo preparado para Supabase.",
        "success"
      );
      setButtonLoading("recoveryButton", false, "Enviar recuperação", "Enviando...");
      return;
    }

    if (result.reason === "recovery_error") {
      const msg = result.error?.message || "Não foi possível iniciar a recuperação.";
      setMessage("recoveryMessage", `Falha na recuperação: ${msg}`, "error");
      setButtonLoading("recoveryButton", false, "Enviar recuperação", "Enviando...");
      return;
    }

    setMessage("recoveryMessage", "Erro inesperado ao recuperar senha.", "error");
    setButtonLoading("recoveryButton", false, "Enviar recuperação", "Enviando...");
  }

  function bindPasswordToggle(buttonId, inputId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    if (!button || !input) return;

    button.addEventListener("click", function () {
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
    });
  }

  function bindLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;
    form.addEventListener("submit", handleLoginSubmit);
  }

  function bindSignup() {
    const form = document.getElementById("signupForm");
    if (!form) return;
    form.addEventListener("submit", handleSignupSubmit);
  }

  function bindRecovery() {
    const form = document.getElementById("recoveryForm");
    if (!form) return;
    form.addEventListener("submit", handleRecoverySubmit);
  }

  function fillConnectionPage() {
    const auth = read(STORE_KEYS.auth, null);
    const welcome = document.getElementById("welcomeLogin");

    if (welcome && auth?.login) {
      welcome.textContent = `Operador: ${auth.login}`;
    }
  }

  function bindEnterApp() {
    const btn = document.getElementById("btnEntrarApp");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const nextPage = getConfig("routes.nextPageAfterConnection", "painel.html");
      window.location.href = nextPage;
    });
  }

  function bindLogoutButtons() {
    const logoutButtons = document.querySelectorAll("[data-action='logout']");
    if (!logoutButtons.length) return;

    logoutButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        remove(STORE_KEYS.auth);
        const entryPage = getConfig("routes.entryPage", "index.html");
        window.location.href = entryPage;
      });
    });
  }

  function protectPrivatePages() {
    const publicPages = ["index", "cadastro", "recuperar", "apresentacao"];
    const page = document.body?.dataset?.page || "";
    const auth = read(STORE_KEYS.auth, null);

    if (publicPages.includes(page)) return;

    if (!auth?.authenticated) {
      const entryPage = getConfig("routes.entryPage", "index.html");
      window.location.href = entryPage;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    protectPrivatePages();

    bindPasswordToggle("togglePassword", "senha");
    bindPasswordToggle("toggleSignupPassword", "signupPassword");
    bindPasswordToggle("toggleSignupPasswordConfirm", "signupPasswordConfirm");

    bindLogin();
    bindSignup();
    bindRecovery();

    fillConnectionPage();
    bindEnterApp();
    bindLogoutButtons();
  });
})();