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
    auth: "elayon_auth"
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

  function getSupabaseClient() {
    if (!window.supabase || !window.supabase.createClient) return null;

    const supabaseUrl = getConfig("supabase.url", "");
    const supabaseAnonKey = getConfig("supabase.anonKey", "") || getConfig("supabase.key", "");

    if (!supabaseUrl || !supabaseAnonKey) return null;

    return window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  }

  function persistAuthSession(login, source = "supabase") {
    const payload = {
      login,
      source,
      connectedAt: new Date().toISOString(),
      authenticated: true
    };

    write(STORE_KEYS.auth, payload);
    return payload;
  }

  function clearAuthSession() {
    remove(STORE_KEYS.auth);
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

    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage("formMessage", "Supabase não carregado ou configuração ausente.", "error");
      setButtonLoading("submitButton", false, "Entrar no sistema", "Entrando...");
      return;
    }

    try