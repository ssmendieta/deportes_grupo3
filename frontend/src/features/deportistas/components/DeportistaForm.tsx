import { useEffect, useCallback, useState } from "react";
import type { FormEvent } from "react";
import { apiRequest } from "../../../shared/services/apiClient";
import type { DeportistaFormData, Disciplina } from "../types/deportista.types";
import {
  validarCI,
  validarTelefono,
  validarEmail,
  validarNombreCompleto,
  type ErroresForm,
  mostrarError,
} from "../../../shared/utils/validators";

function capitalizar(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function soloDigitos(v: string) {
  return v.replace(/\D/g, "").slice(0, 8);
}

function formatearCI(v: string) {
  const limpio = v.replace(/[^0-9A-Za-z-]/g, "").slice(0, 13);
  return limpio;
}

type Props = {
  onCancelar: () => void;
  onGuardar: (data: DeportistaFormData) => Promise<void> | void;
};

const formInicial: DeportistaFormData = {
  nombreCompleto: "",
  ci: "",
  fechaNacimiento: "",
  genero: "",
  telefono: "",
  email: "",
  direccion: "",
  carrera: "",
  semestre: "",
  tipo: "academia",
  disciplinaId: undefined,
  categoria: "Mayores",
  nivel: "Inicial",
  matriculaActiva: true,
  tallaCamiseta: "M",
  activo: true,
};

function DeportistaForm({ onCancelar, onGuardar }: Props) {
  const [formData, setFormData] = useState(formInicial);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState<ErroresForm>({});
  const [tocado, setTocado] = useState<Record<string, boolean>>({});

  useEffect(() => {
    apiRequest<Disciplina[]>("/api/disciplinas?activo=true", {
      requiresAdmin: true,
    })
      .then(setDisciplinas)
      .catch(() => setDisciplinas([]));
  }, []);

  const handleChange = <K extends keyof DeportistaFormData>(
    campo: K,
    value: DeportistaFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [campo]: value }));
  };

  const validarCampo = useCallback((campo: string, valor: unknown): string | null => {
    switch (campo) {
      case "nombreCompleto": return validarNombreCompleto(valor as string, "El nombre");
      case "ci": return validarCI(valor as string);
      case "telefono": return validarTelefono(valor as string);
      case "email": return validarEmail(valor as string);
      case "disciplinaId": return valor ? null : "Debes seleccionar una disciplina.";
      default: return null;
    }
  }, []);

  const handleBlur = (campo: string) => {
    setTocado((prev) => ({ ...prev, [campo]: true }));
    setErrores((prev) => ({ ...prev, [campo]: validarCampo(campo, formData[campo as keyof DeportistaFormData]) }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const nuevosErrores: ErroresForm = {
      nombreCompleto: validarNombreCompleto(formData.nombreCompleto, "El nombre"),
      ci: validarCI(formData.ci),
      telefono: validarTelefono(formData.telefono),
      email: validarEmail(formData.email),
      disciplinaId: formData.disciplinaId ? null : "Debes seleccionar una disciplina.",
    };
    setErrores(nuevosErrores);
    setTocado({ nombreCompleto: true, ci: true, telefono: true, email: true, disciplinaId: true });
    const hayErrores = Object.values(nuevosErrores).some(Boolean);
    if (hayErrores) return;

    setGuardando(true);
    try {
      await onGuardar(formData);
    } catch {
      setError("No se pudo guardar el deportista. Verifica los datos.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="panel-card form-section">
      <div className="section-heading">
        <span>Formulario</span>
        <h2>Nuevo deportista</h2>
      </div>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Nombre completo *</span>
          <input
            id="dep-nombre"
            value={formData.nombreCompleto}
            onChange={(e) => { const v = capitalizar(e.target.value); handleChange("nombreCompleto", v); setErrores((p) => ({ ...p, nombreCompleto: null })); }}
            onBlur={() => handleBlur("nombreCompleto")}
            maxLength={100}
            required
            aria-describedby={tocado.nombreCompleto && mostrarError(errores, "nombreCompleto") ? "error-dep-nombre" : undefined}
          />
          {tocado.nombreCompleto && mostrarError(errores, "nombreCompleto") && <small id="error-dep-nombre" className="field-error">{mostrarError(errores, "nombreCompleto")}</small>}
        </label>
        <label className="field">
          <span>CI *</span>
          <input
            id="dep-ci"
            value={formData.ci}
            onChange={(e) => { handleChange("ci", formatearCI(e.target.value)); setErrores((p) => ({ ...p, ci: null })); }}
            onBlur={() => handleBlur("ci")}
            maxLength={13}
            placeholder="Ej. 1234567 o 1234567-1L"
            required
            aria-describedby={tocado.ci && mostrarError(errores, "ci") ? "error-dep-ci" : undefined}
          />
          {tocado.ci && mostrarError(errores, "ci") && <small id="error-dep-ci" className="field-error">{mostrarError(errores, "ci")}</small>}
        </label>
        <label className="field">
          <span>Fecha de nacimiento</span>
          <input
            type="date"
            value={formData.fechaNacimiento}
            onChange={(e) => handleChange("fechaNacimiento", e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </label>
        <label className="field">
          <span>Género</span>
          <select
            value={formData.genero}
            onChange={(e) => handleChange("genero", e.target.value)}
          >
            <option value="">Seleccionar</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </label>
        <label className="field">
          <span>Celular</span>
          <input
            id="dep-telefono"
            value={formData.telefono}
            onChange={(e) => { handleChange("telefono", soloDigitos(e.target.value)); setErrores((p) => ({ ...p, telefono: null })); }}
            onBlur={() => handleBlur("telefono")}
            maxLength={8}
            placeholder="Ej. 71234567"
            aria-describedby={tocado.telefono && mostrarError(errores, "telefono") ? "error-dep-telefono" : undefined}
          />
          {tocado.telefono && mostrarError(errores, "telefono") && <small id="error-dep-telefono" className="field-error">{mostrarError(errores, "telefono")}</small>}
        </label>
        <label className="field">
          <span>Correo</span>
          <input
            id="dep-email"
            type="email"
            value={formData.email}
            onChange={(e) => { handleChange("email", e.target.value); setErrores((p) => ({ ...p, email: null })); }}
            onBlur={() => handleBlur("email")}
            maxLength={120}
            placeholder="ej. correo@ucb.edu.bo"
            aria-describedby={tocado.email && mostrarError(errores, "email") ? "error-dep-email" : undefined}
          />
          {tocado.email && mostrarError(errores, "email") && <small id="error-dep-email" className="field-error">{mostrarError(errores, "email")}</small>}
        </label>
        <label className="field full">
          <span>Dirección</span>
          <input
            value={formData.direccion}
            onChange={(e) => handleChange("direccion", e.target.value)}
            maxLength={200}
          />
        </label>
        <label className="field">
          <span>Carrera</span>
          <input
            value={formData.carrera}
            onChange={(e) => handleChange("carrera", e.target.value)}
            maxLength={100}
          />
        </label>
        <label className="field">
          <span>Semestre</span>
          <input
            type="number"
            min="1"
            max="12"
            value={formData.semestre}
            onChange={(e) => handleChange("semestre", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Tipo *</span>
          <select
            value={formData.tipo}
            onChange={(e) =>
              handleChange("tipo", e.target.value as DeportistaFormData["tipo"])
            }
          >
            <option value="academia">Academia</option>
            <option value="competitivo">Competitivo</option>
            <option value="estudiante_ucb">Estudiante UCB</option>
          </select>
        </label>
        <label className="field">
          <span>Disciplina *</span>
          <select
            id="dep-disciplina"
            value={formData.disciplinaId ?? ""}
            onChange={(e) => {
              handleChange(
                "disciplinaId",
                e.target.value ? Number(e.target.value) : undefined,
              );
              setErrores((p) => ({ ...p, disciplinaId: null }));
            }}
            onBlur={() => handleBlur("disciplinaId")}
            required
            aria-describedby={tocado.disciplinaId && mostrarError(errores, "disciplinaId") ? "error-dep-disciplina" : undefined}
          >
            <option value="">Seleccionar disciplina</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
          {tocado.disciplinaId && mostrarError(errores, "disciplinaId") && <small id="error-dep-disciplina" className="field-error">{mostrarError(errores, "disciplinaId")}</small>}
        </label>
        <label className="field">
          <span>Categoría</span>
          <input
            value={formData.categoria}
            onChange={(e) => handleChange("categoria", e.target.value)}
            maxLength={50}
          />
        </label>
        <label className="field">
          <span>Nivel</span>
          <input
            value={formData.nivel}
            onChange={(e) => handleChange("nivel", e.target.value)}
            maxLength={50}
          />
        </label>
        <label className="field">
          <span>Talla camiseta</span>
          <select
            value={formData.tallaCamiseta}
            onChange={(e) => handleChange("tallaCamiseta", e.target.value)}
          >
            <option>S</option>
            <option>M</option>
            <option>L</option>
            <option>XL</option>
          </select>
        </label>
        {error && <div className="form-error full">{error}</div>}
        <div className="form-actions full">
          <button className="btn btn-ghost" type="button" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={guardando}
          >
            {guardando ? "Guardando..." : "Guardar deportista"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default DeportistaForm;
