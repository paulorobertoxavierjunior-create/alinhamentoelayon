// ==============================
// CONFIG
// ==============================
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ==============================
// LOGIN
// ==============================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login').value;
    const senha = document.getElementById('senha').value;
    const msg = document.getElementById('formMessage');

    if (!email || !senha) {
      msg.innerText = "Preencha e-mail e senha.";
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      msg.innerText = "Login inválido.";
      return;
    }

    window.location.href = "painel.html";
  });
}

// ==============================
// CADASTRO
// ==============================
const cadastroForm = document.getElementById('cadastroForm');

if (cadastroForm) {
  cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msg = document.getElementById('formMessage');

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo:
          "https://paulorobertoxavierjunior-create.github.io/alinhamentoelayon/index.html"
      }
    });

    if (error) {
      msg.innerText = "Erro ao cadastrar.";
      return;
    }

    window.location.href = "confirmacao.html";
  });
}

// ==============================
// RECUPERAR SENHA
// ==============================
const recoverForm = document.getElementById('recoverForm');

if (recoverForm) {
  recoverForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const msg = document.getElementById('formMessage');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        "https://paulorobertoxavierjunior-create.github.io/alinhamentoelayon/redefinir-senha.html"
    });

    if (error) {
      msg.innerText = "Erro ao enviar e-mail.";
      return;
    }

    msg.innerText = "E-mail enviado.";
  });
}

// ==============================
// REDEFINIR SENHA
// ==============================
const resetForm = document.getElementById('resetForm');

if (resetForm) {
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const senha = document.getElementById('senha').value;
    const msg = document.getElementById('formMessage');

    const { error } = await supabase.auth.updateUser({
      password: senha
    });

    if (error) {
      msg.innerText = "Erro ao redefinir.";
      return;
    }

    msg.innerText = "Senha atualizada!";
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  });
}

// ==============================
// LOGOUT
// ==============================
const btnLogout = document.getElementById('logout');

if (btnLogout) {
  btnLogout.addEventListener('click', async () => {
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
    }
  });
}