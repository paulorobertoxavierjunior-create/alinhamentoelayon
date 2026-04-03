// ==============================
// CONFIG
// ==============================
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ==============================
// HELPERS
// ==============================
function setMessage(elementId, text, type = "") {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.textContent = text || "";
  el.className = "form-message";

  if (type === "error") {
    el.classList.add("error");
  }

  if (type === "success") {
    el.classList.add("success");
  }
}

function clearMessage(elementId) {
  setMessage(elementId, "", "");
}

function setButtonState(buttonId, isLoading, idleText, loadingText) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.disabled = isLoading;
  btn.textContent = isLoading ? loadingText : idleText;
}

function bindPasswordToggle(buttonId, inputId) {
  const button = document.getElementById(buttonId);
  const input = document.getElementById(inputId);

  if (!button || !input) return;

  button.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.setAttribute("aria-pressed", isPassword ? "true" : "false");
    button.textContent = isPassword ? "🙈" : "👁";
  });
}

// ==============================
// PASSWORD TOGGLES
// ==============================
bindPasswordToggle("togglePassword", "senha");
bindPasswordToggle("toggleSignupPassword", "signupPassword");
bindPasswordToggle("toggleSignupPasswordConfirm", "signupPasswordConfirm");

// ==============================
// LOGIN
// ==============================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login")?.value?.trim();
    const senha = document.getElementById("senha")?.value;
    const msgId = "formMessage";

    clearMessage(msgId);

    if (!email || !senha) {
      setMessage(msgId, "Preencha e-mail e senha.", "error");
      return;
    }

    setButtonState("submitButton", true, "Entrar no sistema", "Entrando...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      setMessage(msgId, "E-mail ou senha inválidos.", "error");
      setButtonState("submitButton", false, "Entrar no sistema", "Entrando...");
      return;
    }

    setMessage(msgId, "Login realizado com sucesso.", "success");

    setTimeout(() => {
      window.location.href = "painel.html";
    }, 500);
  });
}

// ==============================
// CADASTRO
// ==============================
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("signupName")?.value?.trim();
    const email = document.getElementById("signupEmail")?.value?.trim();
    const senha = document.getElementById("signupPassword")?.value;
    const confirmar = document.getElementById("signupPasswordConfirm")?.value;
    const msgId = "signupMessage";

    clearMessage(msgId);

    if (!nome || !email || !senha || !confirmar) {
      setMessage(msgId, "Preencha todos os campos.", "error");
      return;
    }

    if (senha.length < 6) {
      setMessage(msgId, "A senha precisa ter pelo menos 6 caracteres.", "error");
      return;
    }

    if (senha !== confirmar) {
      setMessage(msgId, "As senhas não coincidem.", "error");
      return;
    }

    setButtonState("signupButton", true, "Criar acesso", "Criando acesso...");

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome: nome
        },
        emailRedirectTo: "https://paulorobertoxavierjunior-create.github.io/alinhamentoelayon/index.html"
      }
    });

    if (error) {
      setMessage(msgId, error.message || "Erro ao cadastrar.", "error");
      setButtonState("signupButton", false, "Criar acesso", "Criando acesso...");
      return;
    }

    setMessage(
      msgId,
      "Cadastro realizado. Verifique seu e-mail para confirmar o acesso.",
      "success"
    );

    setTimeout(() => {
      window.location.href = "confirmacao.html";
    }, 1000);
  });
}

// ==============================
// RECUPERAR SENHA
// ==============================
const recoveryForm = document.getElementById("recoveryForm");

if (recoveryForm) {
  recoveryForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("recoveryEmail")?.value?.trim();
    const msgId = "recoveryMessage";

    clearMessage(msgId);

    if (!email) {
      setMessage(msgId, "Digite seu e-mail.", "error");
      return;
    }

    setButtonState("recoveryButton", true, "Enviar recuperação", "Enviando...");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://paulorobertoxavierjunior-create.github.io/alinhamentoelayon/redefinir-senha.html"
    });

    if (error) {
      setMessage(msgId, error.message || "Erro ao enviar e-mail.", "error");
      setButtonState("recoveryButton", false, "Enviar recuperação", "Enviando...");
      return;
    }

    setMessage(
      msgId,
      "E-mail de redefinição enviado com sucesso.",
      "success"
    );

    setButtonState("recoveryButton", false, "Enviar recuperação", "Enviando...");
  });
}

// ==============================
// REDEFINIR SENHA
// ==============================
const resetForm = document.getElementById("resetForm");

if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const senha = document.getElementById("senha")?.value;
    const msgId = "formMessage";

    clearMessage(msgId);

    if (!senha) {
      setMessage(msgId, "Digite a nova senha.", "error");
      return;
    }

    if (senha.length < 6) {
      setMessage(msgId, "A nova senha precisa ter pelo menos 6 caracteres.", "error");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: senha
    });

    if (error) {
      setMessage(msgId, error.message || "Erro ao redefinir senha.", "error");
      return;
    }

    setMessage(msgId, "Senha atualizada com sucesso.", "success");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  });
}

// ==============================
// LOGOUT
// ==============================
const btnLogout = document.getElementById("logout");

if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });
}

// ==============================
// PROTEÇÃO DO PAINEL
// ==============================
if (document.body.dataset.page === "painel") {
  supabase.auth.getSession().then(({ data }) => {
    if (!data.session) {
      window.location.href = "index.html";
      return;
    }

    const user = data.session.user;
    const painelLogin = document.getElementById("painelLogin");

    if (painelLogin) {
      const nome = user.user_metadata?.nome || "Operador";
      painelLogin.textContent = `${nome} • ${user.email}`;
    }
  });
}