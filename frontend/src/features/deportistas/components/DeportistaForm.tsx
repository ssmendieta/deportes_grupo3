import { useEffect, useCallback, useState } from "react";
import type { FormEvent } from "react";
import { apiRequest } from "../../../shared/services/apiClient";
import type {
  Deportista,
  DeportistaFormData,
  Disciplina,
} from "../types/deportista.types";
import {
  validarCI,
  validarTelefono,
  validarEmail,
  validarNombreCompleto,
  type ErroresForm,
  mostrarError,
} from "../../../shared/utils/validators";

type Carrera = { id: number; nombre: string; sigla?: string | null };

function capitalizar(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function soloDigitos(v: string) {
  return v.replace(/\D/g, "").slice(0, 8);
}

type Props = {
  onCancelar: () => void;
  onGuardar: (data: DeportistaFormData) => Promise<void> | void;
  deportistaEditando?: Deportista | null;
};

const formInicial: DeportistaFormData = {
  nombres: "",
  ape_paterno: "",
  ape_materno: "",
  ci: "",
  complemento: "",
  celular: "",
  fechaNacimiento: "",
  email: "",
  idCarrera: undefined,
  carrera: "",
  semestre: "",
  colegioInstituto: "",
  curso: "",
  tipo: "academia",
  disciplinaId: undefined,
  categoria: "Mayores",
  tallaRopa: "M",
  activo: true,
};

function crearFormDesdeDeportista(deportista: Deportista): DeportistaFormData {
  const inscripcionActiva = deportista.inscripciones?.find((i) => i.activo);

  return {
    nombres: deportista.nombres ?? "",
    ape_paterno: deportista.apePaterno ?? "",
    ape_materno: deportista.apeMaterno ?? "",
    ci: deportista.ci ?? "",
    complemento: deportista.complemento ?? "",
    celular: deportista.celular ?? "",
    fechaNacimiento: deportista.fechaNacimiento?.slice(0, 10) ?? "",
    email: deportista.email ?? "",
    idCarrera: deportista.idCarrera ?? undefined,
    carrera: deportista.carrera ?? "",
    semestre: deportista.semestre ? String(deportista.semestre) : "",
    colegioInstituto: deportista.colegioInstituto ?? "",
    curso: deportista.curso ?? "",
    tipo: deportista.tipo,
    disciplinaId: inscripcionActiva?.disciplina?.id,
    categoria: inscripcionActiva?.categoria ?? "Mayores",
    tallaRopa: deportista.tallaRopa ?? "M",
    activo: deportista.activo ?? true,
  };
}

function DeportistaForm({ onCancelar, onGuardar, deportistaEditando }: Props) {
  const [formData, setFormData] = useState(formInicial);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState<ErroresForm>({});
  const [tocado, setTocado] = useState<Record<string, boolean>>({});
  const esEdicion = Boolean(deportistaEditando);

  useEffect(() => {
    apiRequest<Disciplina[]>("/api/disciplinas?activo=true", {
      requiresAuth: true,
    })
      .then(setDisciplinas)
      .catch(() => setDisciplinas([]));

    apiRequest<Carrera[]>("/api/carreras")
      .then(setCarreras)
      .catch(() => setCarreras([]));
  }, []);

  useEffect(() => {
    const tarea = window.setTimeout(() => {
      if (deportistaEditando) {
        setFormData(crearFormDesdeDeportista(deportistaEditando));
      } else {
        setFormData(formInicial);
      }

      setErrores({});
      setTocado({});
      setError("");
    }, 0);

    return () => window.clearTimeout(tarea);
  }, [deportistaEditando]);

  const handleChange = <K extends keyof DeportistaFormData>(
    campo: K,
    value: DeportistaFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [campo]: value }));
  };

  const validarCampo = useCallback(
    (campo: string, valor: unknown): string | null => {
      switch (campo) {
        case "nombres":
          return validarNombreCompleto(valor as string, "Los nombres");
        case "ci":
          return validarCI(valor as string);
        case "celular":
          return validarTelefono(valor as string);
        case "email":
          return validarEmail(valor as string);
        case "disciplinaId":
          return valor ? null : "Debes seleccionar una disciplina.";
        default:
          return null;
      }
    },
    [],
  );

  const handleBlur = (campo: string) => {
    setTocado((prev) => ({ ...prev, [campo]: true }));
    setErrores((prev) => ({
      ...prev,
      [campo]: validarCampo(campo, formData[campo as keyof DeportistaFormData]),
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const nuevosErrores: ErroresForm = {
      nombres: validarNombreCompleto(
        formData.nombres,
        "Los nombres",
      ),
      ci: validarCI(formData.ci),
      celular: validarTelefono(formData.celular),
      email: validarEmail(formData.email ?? ""),
      disciplinaId: formData.disciplinaId
        ? null
        : "Debes seleccionar una disciplina.",
    };
    setErrores(nuevosErrores);
    setTocado({
      nombres: true,
      ci: true,
      celular: true,
      email: true,
      disciplinaId: true,
    });
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

  const esCompetitivo = formData.tipo === "competitivo";
  const esUcb = formData.tipo === "estudiante_ucb";

  return (
    <section className="panel-card form-section">
      <div className="section-heading">
        <span>{esEdicion ? "Edición" : "Formulario"}</span>
        <h2>
          {esEdicion ? "Editar información del deportista" : "Nuevo deportista"}
        </h2>
      </div>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Nombres *</span>
          <input
            id="dep-nombres"
            value={formData.nombres}
            onChange={(e) => {
              const v = capitalizar(e.target.value);
              handleChange("nombres", v);
              setErrores((p) => ({ ...p, nombres: null }));
            }}
            onBlur={() => handleBlur("nombres")}
            maxLength={50}
            required
            aria-describedby={
              tocado.nombres && mostrarError(errores, "nombres")
                ? "error-dep-nombres"
                : undefined
            }
          />
          {tocado.nombres && mostrarError(errores, "nombres") && (
            <small id="error-dep-nombres" className="field-error">
              {mostrarError(errores, "nombres")}
            </small>
          )}
        </label>
        <label className="field">
          <span>Ape. Paterno *</span>
          <input
            id="dep-paterno"
            value={formData.ape_paterno}
            onChange={(e) => {
              const v = capitalizar(e.target.value);
              handleChange("ape_paterno", v);
              setErrores((p) => ({ ...p, ape_paterno: null }));
            }}
            maxLength={50}
            required
          />
        </label>
        <label className="field">
          <span>Ape. Materno</span>
          <input
            id="dep-materno"
            value={formData.ape_materno}
            onChange={(e) => {
              const v = capitalizar(e.target.value);
              handleChange("ape_materno", v);
            }}
            maxLength={50}
          />
        </label>
        <label className="field">
          <span>CI *</span>
          <input
            id="dep-ci"
            value={formData.ci}
            onChange={(e) => {
              handleChange("ci", soloDigitos(e.target.value));
              setErrores((p) => ({ ...p, ci: null }));
            }}
            onBlur={() => handleBlur("ci")}
            maxLength={8}
            placeholder="Ej. 1234567"
            inputMode="numeric"
            required
            aria-describedby={
              tocado.ci && mostrarError(errores, "ci")
                ? "error-dep-ci"
                : undefined
            }
          />
          {tocado.ci && mostrarError(errores, "ci") && (
            <small id="error-dep-ci" className="field-error">
              {mostrarError(errores, "ci")}
            </small>
          )}
        </label>
        <label className="field">
          <span>Complemento</span>
          <input
            id="dep-complemento"
            value={formData.complemento ?? ""}
            onChange={(e) => handleChange("complemento", e.target.value)}
            maxLength={5}
            placeholder="Ej. LP"
          />
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
          <span>Celular</span>
          <input
            id="dep-celular"
            value={formData.celular}
            onChange={(e) => {
              handleChange("celular", soloDigitos(e.target.value));
              setErrores((p) => ({ ...p, celular: null }));
            }}
            onBlur={() => handleBlur("celular")}
            maxLength={8}
            placeholder="Ej. 71234567"
            aria-describedby={
              tocado.celular && mostrarError(errores, "celular")
                ? "error-dep-celular"
                : undefined
            }
          />
          {tocado.celular && mostrarError(errores, "celular") && (
            <small id="error-dep-celular" className="field-error">
              {mostrarError(errores, "celular")}
            </small>
          )}
        </label>
        <label className="field">
          <span>Correo</span>
          <input
            id="dep-email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              handleChange("email", e.target.value);
              setErrores((p) => ({ ...p, email: null }));
            }}
            onBlur={() => handleBlur("email")}
            maxLength={120}
            placeholder="ej. correo@ucb.edu.bo"
            aria-describedby={
              tocado.email && mostrarError(errores, "email")
                ? "error-dep-email"
                : undefined
            }
          />
          {tocado.email && mostrarError(errores, "email") && (
            <small id="error-dep-email" className="field-error">
              {mostrarError(errores, "email")}
            </small>
          )}
        </label>

        {esUcb && (
          <label className="field full">
            <span>Carrera</span>
            <select
              value={formData.idCarrera ?? ""}
              onChange={(e) =>
                handleChange(
                  "idCarrera",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            >
              <option value="">Seleccionar carrera</option>
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
        )}

        {esUcb && (
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
        )}

        {esCompetitivo && (
          <label className="field full">
            <span>Colegio / Instituto</span>
            <input
              value={formData.colegioInstituto ?? ""}
              onChange={(e) => handleChange("colegioInstituto", e.target.value)}
              maxLength={120}
              placeholder="Ej. Colegio San Calixto"
            />
          </label>
        )}

        {esCompetitivo && (
          <label className="field">
            <span>Curso</span>
            <input
              value={formData.curso ?? ""}
              onChange={(e) => handleChange("curso", e.target.value)}
              maxLength={50}
              placeholder="Ej. 6to Secundaria"
            />
          </label>
        )}

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
            aria-describedby={
              tocado.disciplinaId && mostrarError(errores, "disciplinaId")
                ? "error-dep-disciplina"
                : undefined
            }
          >
            <option value="">Seleccionar disciplina</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
          {tocado.disciplinaId && mostrarError(errores, "disciplinaId") && (
            <small id="error-dep-disciplina" className="field-error">
              {mostrarError(errores, "disciplinaId")}
            </small>
          )}
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
          <span>Estado del deportista</span>
          <select
            value={formData.activo ? "activo" : "inactivo"}
            onChange={(e) =>
              handleChange("activo", e.target.value === "activo")
            }
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>
        <label className="field">
          <span>Talla ropa</span>
          <select
            value={formData.tallaRopa}
            onChange={(e) => handleChange("tallaRopa", e.target.value)}
          >
            <option>S</option>
            <option>M</option>
            <option>L</option>
            <option>XL</option>
          </select>
        </label>
        {error && <div className="form-error full">{error}</div>}
        <div className="form-actions full">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={onCancelar}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={guardando}
          >
            {guardando
              ? "Guardando..."
              : esEdicion
                ? "Guardar cambios"
                : "Guardar deportista"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default DeportistaForm;
