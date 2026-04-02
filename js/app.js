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

  function setMessage(message, type = "default") {
    const box = document.getElementById("formMessage");
    if (!box) return;

    box.textContent = message || "";
    box.className = "form-message";

    if (type === "error") box.classList.add("error");
    if (type === "success") box.classList.add("success");
  }

  function setLoading(isLoading) {
    const submitButton = document.getElementById("submitButton");
    if (!submitButton) return;

    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Entrando..." : "Entrar no sistema";
  }

  function normalizeLogin(value) {
    return String(value || "").trim();
  }

  function normalizePassword(value) {
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

  async function trySupabaseLogin(login, senha) {
    if (!isSupabaseEnabled() || !hasSupabaseCredentials()) {
      return {
        ok: false,
        reason: "supabase_not_ready"
      };
    }

    if (!window.supabase || !window.supabase.createClient) {
      return {
        ok: false,
        reason: "supabase_lib_missing"
      };
    }

    try {
      const supabaseUrl = getConfig("supabase.url");
      const supabaseAnonKey = getConfig("supabase.anonKey");
      const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

      const { data, error } = await client.auth.signInWithPassword({
        email: login,
        password: senha
      });

      if (error) {
        return {
          ok: false,
          reason: "auth_error",
          error
        };
      }

      return {
        ok: true,
        data
      };
    } catch (error) {
      return {
        ok: false,
        reason: "auth_exception",
        error
      };
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

    const loginInput = document.getElementById("login");
    const senhaInput = document.getElementById("senha");

    const login = normalizeLogin(loginInput?.value);
    const senha = normalizePassword(senhaInput?.value);

    if (!login || !senha) {
      setMessage("Preencha login e senha para continuar.", "error");
      return;
    }

    setMessage("");
    setLoading(true);

    const supabaseResult = await trySupabaseLogin(login, senha);

    if (supabaseResult.ok) {
      persistAuthSession(login, "supabase");
      setMessage("Acesso confirmado. Entrando no sistema...", "success");
      setTimeout(goAfterLogin, 450);
      return;
    }

    const reason = supabaseResult.reason;

    // Fallback controlado enquanto o Supabase ainda não estiver configurado
    if (reason === "supabase_not_ready" || reason === "supabase_lib_missing") {
      persistAuthSession(login, "local-fallback");
      setMessage("Ambiente de autenticação ainda em configuração. Entrada liberada em modo controlado.", "success");
      setTimeout(goAfterLogin, 550);
      return;
    }

    if (reason === "auth_error") {
      const msg = supabaseResult.error?.message || "Não foi possível autenticar.";
      setMessage(`Falha no acesso: ${msg}`, "error");
      setLoading(false);
      return;
    }

    if (reason === "auth_exception") {
      setMessage("Erro inesperado ao conectar com a autenticação. Tente novamente.", "error");
      setLoading(false);
      return;
    }

    setMessage("Não foi possível concluir o acesso.", "error");
    setLoading(false);
  }

  function bindLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", handleLoginSubmit);
  }

  function bindPasswordToggle() {
    const passwordInput = document.getElementById("senha");
    const togglePassword = document.getElementById("togglePassword");

    if (!passwordInput || !togglePassword) return;

    togglePassword.addEventListener("click", function () {
      const hidden = passwordInput.type === "password";
      passwordInput.type = hidden ? "text" : "password";
    });
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
    bindPasswordToggle();
    bindLogin();
    fillConnectionPage();
    bindEnterApp();
    bindLogoutButtons();
  });
})();