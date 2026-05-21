import { getUserFromToken } from "../authStore";

function PerfilPage() {
  const user = getUserFromToken();

  return (
    <div className="page-stack" style={{ maxWidth: "600px" }}>
      <h1>Mi Perfil</h1>
      <p style={{ marginBottom: "24px", color: "var(--gris-texto)" }}>
        Información del usuario autenticado.
      </p>

      <section className="panel-card" style={{ padding: "24px" }}>
        <div className="info-grid">
          <div className="field">
            <span>Nombre</span>
            <strong>{user?.nombre ?? "—"}</strong>
          </div>
          <div className="field">
            <span>Correo electrónico</span>
            <strong>{user?.email ?? "—"}</strong>
          </div>
          <div className="field">
            <span>Rol</span>
            <strong>{user?.rol ?? "—"}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PerfilPage;
