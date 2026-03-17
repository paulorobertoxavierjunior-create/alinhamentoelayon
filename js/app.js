(function () {
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

  function bindLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const login = document.getElementById("login")?.value?.trim() || "";
      const senha = document.getElementById("senha")?.value?.trim() || "";

      write(STORE_KEYS.auth, {
        login,
        senha,
        connectedAt: new Date().toISOString()
      });

      window.location.href = "conexao.html";
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
      window.location.href = ELAYON_CONFIG.nextPageAfterConnection;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindLogin();
    fillConnectionPage();
    bindEnterApp();
  });
})();