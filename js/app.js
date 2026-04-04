(function () {
  const CONFIG = window.ELAYON_CONFIG || {};

  function getConfig(path, fallback = null) {
    try {
      return path.split(".").reduce((acc, key) => acc[key], CONFIG) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function getPageName() {
    return document.body?.dataset?.page || "";
  }

  function isPublicPage(page) {
    return (CONFIG.publicPages || []).includes(page);
  }

  function isProtectedPage(page) {
    return (CONFIG.protectedPages || []).includes(page);
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
    const supabaseAnonKey = getConfig("supabase.anonKey", "");

    if (!supabaseUrl || !supabaseAnonKey) return null;

    return window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  }

  async function getSession() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Erro ao obter sessão:", error);
      return null;
    }

    return data?.session || null;
  }

  async function getUser() {
    const session = await getSession();
    return session?.user || null;
  }

  function persistAuthUser(user) {
    if (!user) return;
    localStorage.setItem(
      "elayon_auth_user",
      JSON.stringify({
        id: user.id || "",
        email: user.email || "",
        nome: user.user_metadata?.nome || "",
        updatedAt: new Date().toISOString()
      })
    );
  }

  function clearAuthUser() {
    localStorage.removeItem("elayon_auth_user");
  }

  function goTo(routeKey, fallback = "index.html") {
    const url = getConfig(`routes.${routeKey}`, fallback);
    window.location.href = url;
  }

  function getSiteBaseForRedirect() {
    return "https://paulorobertoxavierjunior-create.github.io/alinhamentoelayon";
  }

  async function protectRoute() {
    const page = getPageName();

    if (!page) return;

    const session = await getSession();

    if (isProtectedPage(page) && !session) {
      goTo("login", "index.html");
      return;
    }

    if (session?.user) {
      persistAuthUser(session.user);
    }
  }

  async function redirectIfLoggedOnAuthPages() {
    const page = getPageName();

    if (!["index", "cadastro"].includes(page)) return;

    const session = await getSession();
    if (session) {
      goTo("afterLogin", "painel.html");
    }
  }

  function bindPasswordToggle(buttonId, inputId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    if (!button || !input) return;

    button.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.setAttribute("aria-pressed", String(isPassword));
      button.textContent = isPassword ? "🙈" : "👁";
    });
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    const email = normalize(document.getElementById("login")?.value);
    const senha = normalize(document.getElementById("senha")?.value);

    if (!email || !senha) {
      setMessage("formMessage", "Preencha e-mail e senha.", "error");
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });

      if (error) {
        setMessage("formMessage", "E-mail ou senha inválidos.", "error");
        return;
      }

      if (!data?.session || !data?.user) {
        setMessage("formMessage", "Sessão não iniciada. Tente novamente.", "error");
        return;
      }

      persistAuthUser(data.user);
      setMessage("formMessage", "Login realizado com sucesso.", "success");

      setTimeout(() => {
        goTo("afterLogin", "painel.html");
      }, 700);
    } catch (err) {
      console.error(err);
      setMessage("formMessage", "Erro ao tentar entrar. Tente novamente.", "error");
    } finally {
      setButtonLoading("submitButton", false, "Entrar no sistema", "Entrando...");
    }
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();

    const nome = normalize(document.getElementById("signupName")?.value);
    const email = normalize(document.getElementById("signupEmail")?.value);
    const senha = normalize(document.getElementById("signupPassword")?.value);
    const confirmar = normalize(document.getElementById("signupPasswordConfirm")?.value);

    if (!nome || !email || !senha || !confirmar) {
      setMessage("signupMessage", "Preencha todos os campos.", "error");
      return;
    }

    if (senha.length < 6) {
      setMessage("signupMessage", "A senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }

    if (senha !== confirmar) {
      setMessage("signupMessage", "As senhas não coincidem.", "error");
      return;
    }

    setMessage("signupMessage", "");
    setButtonLoading("signupButton", true, "Criar acesso", "Criando...");

    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage("signupMessage", "Supabase não carregado ou configuração ausente.", "error");
      setButtonLoading("signupButton", false, "Criar acesso", "Criando...");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: `${getSiteBaseForRedirect()}/index.html`,
          data: {
            nome
          }
        }
      });

      if (error) {
        setMessage("signupMessage", error.message || "Erro ao criar acesso.", "error");
        return;
      }

      if (!data?.user) {
        setMessage("signupMessage", "Não foi possível concluir o cadastro.", "error");
        return;
      }

      setMessage("signupMessage", "Cadastro realizado. Verifique seu e-mail para confirmar o acesso.", "success");

      setTimeout(() => {
        goTo("confirmacao", "confirmacao.html");
      }, 800);
    } catch (err) {
      console.error(err);
      setMessage("signupMessage", "Erro ao criar acesso. Tente novamente.", "error");
    } finally {
      setButtonLoading("signupButton", false, "Criar acesso", "Criando...");
    }
  }

  async function handleRecoverySubmit(event) {
    event.preventDefault();

    const email = normalize(document.getElementById("recoveryEmail")?.value);

    if (!email) {
      setMessage("recoveryMessage", "Digite seu e-mail.", "error");
      return;
    }

    setMessage("recoveryMessage", "");
    setButtonLoading("recoveryButton", true, "Enviar recuperação", "Enviando...");

    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage("recoveryMessage", "Supabase não carregado ou configuração ausente.", "error");
      setButtonLoading("recoveryButton", false, "Enviar recuperação", "Enviando...");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getSiteBaseForRedirect()}/redefinir-senha.html`
      });

      if (error) {
        setMessage("recoveryMessage", "Erro ao enviar recuperação.", "error");
        return;
      }

      setMessage("recoveryMessage", "Link de recuperação enviado para seu e-mail.", "success");
    } catch (err) {
      console.error(err);
      setMessage("recoveryMessage", "Erro ao enviar recuperação. Tente novamente.", "error");
    } finally {
      setButtonLoading("recoveryButton", false, "Enviar recuperação", "Enviando...");
    }
  }

  async function handleResetPasswordSubmit(event) {
    event.preventDefault();

    const senha = normalize(document.getElementById("resetPassword")?.value);
    const confirmar = normalize(document.getElementById("resetPasswordConfirm")?.value);

    if (!senha || !confirmar) {
      setMessage("resetMessage", "Preencha os dois campos.", "error");
      return;
    }

    if (senha.length < 6) {
      setMessage("resetMessage", "A nova senha deve ter pelo menos 6 caracteres.", "error");
      return;
    }

    if (senha !== confirmar) {
      setMessage("resetMessage", "As senhas não coincidem.", "error");
      return;
    }

    setMessage("resetMessage", "");
    setButtonLoading("resetButton", true, "Salvar nova senha", "Salvando...");

    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage("resetMessage", "Supabase não carregado ou configuração ausente.", "error");
      setButtonLoading("resetButton", false, "Salvar nova senha", "Salvando...");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: senha
      });

      if (error) {
        setMessage("resetMessage", "Erro ao redefinir senha.", "error");
        return;
      }

      setMessage("resetMessage", "Senha atualizada com sucesso. Faça login novamente.", "success");

      setTimeout(() => {
        goTo("login", "index.html");
      }, 1000);
    } catch (err) {
      console.error(err);
      setMessage("resetMessage", "Erro ao redefinir senha. Tente novamente.", "error");
    } finally {
      setButtonLoading("resetButton", false, "Salvar nova senha", "Salvando...");
    }
  }

  async function handleLogout() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Erro ao sair:", err);
    } finally {
      clearAuthUser();
      goTo("login", "index.html");
    }
  }

  async function bindAuthStateListener() {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth.onAuthStateChange((event, session) => {
      const page = getPageName();

      if (session?.user) {
        persistAuthUser(session.user);
      }

      if (event === "SIGNED_OUT") {
        clearAuthUser();

        if (isProtectedPage(page)) {
          goTo("login", "index.html");
        }
      }
    });
  }

  async function bindPageEvents() {
    bindPasswordToggle("togglePassword", "senha");
    bindPasswordToggle("toggleSignupPassword", "signupPassword");
    bindPasswordToggle("toggleSignupPasswordConfirm", "signupPasswordConfirm");
    bindPasswordToggle("toggleResetPassword", "resetPassword");
    bindPasswordToggle("toggleResetPasswordConfirm", "resetPasswordConfirm");

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", handleLoginSubmit);
    }

    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
      signupForm.addEventListener("submit", handleSignupSubmit);
    }

    const recoveryForm = document.getElementById("recoveryForm");
    if (recoveryForm) {
      recoveryForm.addEventListener("submit", handleRecoverySubmit);
    }

    const resetForm = document.getElementById("resetForm");
    if (resetForm) {
      resetForm.addEventListener("submit", handleResetPasswordSubmit);
    }

    const logoutButton = document.getElementById("logout");
    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogout);
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await bindAuthStateListener();
    await protectRoute();
    await redirectIfLoggedOnAuthPages();
    await bindPageEvents();
  });
})();