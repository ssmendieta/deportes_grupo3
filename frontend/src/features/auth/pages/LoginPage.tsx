import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "../authStore";

const AUTH_BASE_URL = "https://deportes.62344037.xyz";

export default function LoginPage() {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState("");

  function handleLoginRedirect() {
    const callbackUrl = `${window.location.origin}/`;
    window.location.href = `${AUTH_BASE_URL}/auth/google?redirect_uri=${encodeURIComponent(callbackUrl)}`;
  }

  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setError("Pega el token JWT obtenido al iniciar sesión.");
      return;
    }
    try {
      const parts = trimmed.split(".");
      if (parts.length !== 3) throw new Error("Formato inválido");
      setToken(trimmed);
      navigate("/dashboard");
    } catch {
      setError("El token no es válido. Asegúrate de copiarlo completo.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/favicon.svg" alt="UCB" width={52} height={52} />
        </div>
        <h1>Sistema de Deportes UCB</h1>
        <p>Inicia sesión con tu cuenta institucional Google para continuar.</p>

        <button className="btn btn-primary btn-google" onClick={handleLoginRedirect}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Ingresar con Google institucional
        </button>

        <div className="login-divider">
          <span>o pega tu token JWT si ya iniciaste sesión</span>
        </div>

        <form onSubmit={handleTokenSubmit} className="token-form">
          <div className="field">
            <span>Token JWT</span>
            <textarea
              value={tokenInput}
              onChange={(e) => { setTokenInput(e.target.value); setError(""); }}
              placeholder="eyJhbGciOiJSUzI1NiIs..."
              rows={3}
            />
          </div>
          {error && <div className="alerta-calendario error">{error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Usar este token
          </button>
        </form>

        <p className="login-help">
          Obtén tu token en{" "}
          <a href={AUTH_BASE_URL} target="_blank" rel="noopener noreferrer">
            {AUTH_BASE_URL}
          </a>
        </p>
      </div>
    </div>
  );
}
