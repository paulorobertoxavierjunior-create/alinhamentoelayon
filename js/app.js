(function () {
  const CFG = window.ELAYON_CONFIG || {};
  const KEYS = CFG.storageKeys || {};
  const PAGE = document.body?.dataset?.page || "";

  function getSupabase() {
    if (!window.supabase?.createClient) return null;
    if (window.__elayonSupabase) return window.__elayonSupabase;

    const url = CFG.supabase?.url;
    const key = CFG.supabase?.publishableKey || CFG.supabase?.anonKey;

    if (!url || !key) return null;

    window.__elayonSupabase = window.supabase.createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    return window.__elayonSupabase;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setMessage(id, message, type = "") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message || "";
    el.className = "form-message";
    if (type) el.classList.add(type);
  }

  function normalize(v) {
    return String(v || "").trim();
  }

  function saveLocal(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readLocal(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function removeLocal(key) {
    localStorage.removeItem(key);
  }

  async function getSession() {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  }

  async function getUser() {
    const session = await getSession();
    return session?.user || null;
  }

  async function redirectIfProtectedWithoutAuth() {
    if (!CFG.protectedPages?.includes(PAGE)) return;
    const session = await getSession();
    if (!session) {
      window.location.href = CFG.routes.login;
    }
  }

  async function redirectIfLoggedInOnPublic() {
    if (!CFG.publicPages?.includes(PAGE)) return;
    const session = await getSession();
    if (session && PAGE !== "apresentacao" && PAGE !== "alinhamento") {
      window.location.href = CFG.routes.afterLogin;
    }
  }

  async function hydrateProfile() {
    const supabase = getSupabase();
    if (!supabase) return;

    const user = await getUser();
    if (!user) return;

    let nome = user.user_metadata?.nome || "";
    let email = user.email || "";

    const { data: profile } = await supabase
      .from("profiles")
      .select("nome,email")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.nome) nome = profile.nome;
    if (profile?.email) email = profile.email;

    const label = nome ? `${nome} • ${email}` : email;
    setText("painelLogin", `Operador: ${label}`);
    setText("profileNome", nome || "Não informado");
    setText("profileEmail", email || "Não informado");
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      setMessage("formMessage", "Supabase não carregado.", "error");
      return;
    }

    const email = normalize(document.getElementById("login")?.value);
    const password = normalize(document.getElementById("senha")?.value);

    if (!email || !password) {
      setMessage("formMessage", "Preencha e-mail e senha.", "error");
      return;
    }

    setMessage("formMessage", "Entrando...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setMessage("formMessage", error.message || "Login inválido.", "error");
      return;
    }

    setMessage("formMessage", "Login realizado com sucesso.", "success");
    window.location.href = CFG.routes.afterLogin;
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      setMessage("signupMessage", "Supabase não carregado.", "error");
      return;
    }

    const nome = normalize(document.getElementById("signupName")?.value);
    const email = normalize(document.getElementById("signupEmail")?.value);
    const password = normalize(document.getElementById("signupPassword")?.value);
    const confirm = normalize(document.getElementById("signupPasswordConfirm")?.value);

    if (!nome || !email || !password || !confirm) {
      setMessage("signupMessage", "Preencha todos os campos.", "error");
      return;
    }

    if (password !== confirm) {
      setMessage("signupMessage", "As senhas não coincidem.", "error");
      return;
    }

    if (password.length < 6) {
      setMessage("signupMessage", "A senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }

    setMessage("signupMessage", "Criando acesso...");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome }
      }
    });

    if (error) {
      setMessage("signupMessage", error.message || "Erro ao criar acesso.", "error");
      return;
    }

    if (data?.session) {
      setMessage("signupMessage", "Cadastro concluído. Entrando no painel...", "success");
      window.location.href = CFG.routes.afterLogin;
      return;
    }

    setMessage("signupMessage", "Cadastro criado. Faça login para continuar.", "success");
    setTimeout(() => {
      window.location.href = CFG.routes.login;
    }, 1200);
  }

  async function handleRecoverySubmit(event) {
    event.preventDefault();
    const supabase = getSupabase();
    if (!supabase) {
      setMessage("recoveryMessage", "Supabase não carregado.", "error");
      return;
    }

    const email = normalize(document.getElementById("recoveryEmail")?.value);

    if (!email) {
      setMessage("recoveryMessage", "Informe seu e-mail.", "error");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, "")}${CFG.routes.login}`
    });

    if (error) {
      setMessage("recoveryMessage", error.message || "Erro ao enviar recuperação.", "error");
      return;
    }

    setMessage("recoveryMessage", "E-mail de recuperação enviado.", "success");
  }

  async function logout() {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    removeLocal(KEYS.currentSessionId);
    removeLocal(KEYS.currentMode);
    window.location.href = CFG.routes.login;
  }

  async function startCRSSession(mode) {
    const supabase = getSupabase();
    const user = await getUser();
    if (!supabase || !user) return null;

    const { data, error } = await supabase
      .from("crs_sessions")
      .insert({
        user_id: user.id,
        mode,
        status: "started"
      })
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao iniciar sessão CRS:", error);
      return null;
    }

    saveLocal(KEYS.currentSessionId, data.id);
    saveLocal(KEYS.currentMode, mode);
    return data.id;
  }

  async function finalizeCRSSession(snapshot, modeKey, result) {
    const supabase = getSupabase();
    const user = await getUser();
    if (!supabase || !user) return false;

    const sessionId = readLocal(KEYS.currentSessionId, null);
    if (!sessionId) return false;

    const { error: updateError } = await supabase
      .from("crs_sessions")
      .update({
        status: "finished",
        ended_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Erro ao fechar sessão CRS:", updateError);
    }

    const { error: resultError } = await supabase
      .from("crs_results")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        score: result.score,
        fase: result.fase,
        leitura_base: result.leituraBase,
        direction: result.direction,
        averages: result.averages,
        peaks: result.peaks,
        flags: result.flags,
        snapshot
      });

    if (resultError) {
      console.error("Erro ao salvar resultado CRS:", resultError);
      return false;
    }

    removeLocal(KEYS.currentSessionId);
    removeLocal(KEYS.currentMode);
    return true;
  }

  function bindForms() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const recoveryForm = document.getElementById("recoveryForm");

    if (loginForm) loginForm.addEventListener("submit", handleLoginSubmit);
    if (signupForm) signupForm.addEventListener("submit", handleSignupSubmit);
    if (recoveryForm) recoveryForm.addEventListener("submit", handleRecoverySubmit);
  }

  function bindPasswordToggles() {
    document.querySelectorAll(".toggle-password").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.parentElement?.querySelector("input");
        if (!input) return;
        input.type = input.type === "password" ? "text" : "password";
      });
    });
  }

  function bindLogoutButtons() {
    document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
      btn.addEventListener("click", logout);
    });
  }

  async function init() {
    bindForms();
    bindPasswordToggles();
    bindLogoutButtons();
    await redirectIfProtectedWithoutAuth();
    await redirectIfLoggedInOnPublic();
    await hydrateProfile();
  }

  window.ELAYON_APP = {
    getSupabase,
    getSession,
    getUser,
    logout,
    startCRSSession,
    finalizeCRSSession
  };

  document.addEventListener("DOMContentLoaded", init);
})();