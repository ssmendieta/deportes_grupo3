import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Disciplina, DisciplinaFormData } from "../types/disciplina.types";
import {
  validarNombreCompleto,
  type ErroresForm,
  mostrarError,
} from "../../../shared/utils/validators";

type Props = {
  abierto: boolean;
  disciplinaEditando: Disciplina | null;
  onCerrar: () => void;
  onGuardar: (data: DisciplinaFormData) => Promise<void> | void;
};

const formInicial: DisciplinaFormData = {
  nombre: "",
  descripcion: "",
  categorias: "",
  mensualidad: "",
  estado: "activa",
};

function DisciplinaFormModal({
  abierto,
  disciplinaEditando,
  onCerrar,
  onGuardar,
}: Props) {
  const [formData, setFormData] = useState<DisciplinaFormData>(formInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState<ErroresForm>({});

  useEffect(() => {
    if (!abierto) return;
    setFormData(
      disciplinaEditando
        ? {
            nombre: disciplinaEditando.nombre,
            descripcion: disciplinaEditando.descripcion,
            categorias: disciplinaEditando.categorias,
            mensualidad: String(disciplinaEditando.mensualidad),
            estado: disciplinaEditando.estado,
          }
        : formInicial,
    );
    setError("");
    setErrores({});
  }, [abierto, disciplinaEditando]);

  if (!abierto) return null;

  const handleChange = <K extends keyof DisciplinaFormData>(
    campo: K,
    value: DisciplinaFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [campo]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const nuevosErrores: ErroresForm = {
      nombre: validarNombreCompleto(formData.nombre, "El nombre"),
      mensualidad: formData.mensualidad && Number(formData.mensualidad) < 0 ? "La mensualidad no puede ser negativa." : null,
    };
    setErrores(nuevosErrores);
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setGuardando(true);
    try {
      await onGuardar(formData);
    } catch {
      setError("No se pudo guardar la disciplina. Verifica los datos.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card">
        <button className="modal-close" onClick={onCerrar}>
          ×
        </button>
        <h2>{disciplinaEditando ? "Editar disciplina" : "Nueva disciplina"}</h2>

        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Nombre *</span>
            <input
              id="disc-nombre"
              value={formData.nombre}
              onChange={(e) => { const v = e.target.value; handleChange("nombre", v.charAt(0).toUpperCase() + v.slice(1)); setErrores((p) => ({ ...p, nombre: null })); }}
              onBlur={() => { if (!formData.nombre.trim()) setErrores((p) => ({ ...p, nombre: validarNombreCompleto(formData.nombre, "El nombre") })); }}
              placeholder="Ej. Voleibol"
              required
              maxLength={80}
              aria-describedby={mostrarError(errores, "nombre") ? "error-disc-nombre" : undefined}
            />
            {mostrarError(errores, "nombre") && <small id="error-disc-nombre" className="field-error">{mostrarError(errores, "nombre")}</small>}
          </label>

          <label className="field">
            <span>Estado</span>
            <select
              value={formData.estado}
              onChange={(e) =>
                handleChange(
                  "estado",
                  e.target.value as DisciplinaFormData["estado"],
                )
              }
            >
              <option value="activa">Activa</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </label>

          <label className="field full">
            <span>Descripción</span>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleChange("descripcion", e.target.value)}
              placeholder="Breve descripción de la disciplina"
            />
          </label>

          <label className="field">
            <span>Categorías</span>
            <input
              value={formData.categorias}
              onChange={(e) => handleChange("categorias", e.target.value)}
              placeholder="Ej. Mayores, Sub-17, Sub-14"
            />
          </label>

          <label className="field">
            <span>Mensualidad (Bs.)</span>
            <input
              id="disc-mensualidad"
              type="number"
              min="0"
              value={formData.mensualidad}
              onChange={(e) => { handleChange("mensualidad", e.target.value); setErrores((p) => ({ ...p, mensualidad: null })); }}
              onBlur={() => { if (formData.mensualidad && Number(formData.mensualidad) < 0) setErrores((p) => ({ ...p, mensualidad: "La mensualidad no puede ser negativa." })); }}
              placeholder="Ej. 120"
              aria-describedby={mostrarError(errores, "mensualidad") ? "error-disc-mensualidad" : undefined}
            />
            {mostrarError(errores, "mensualidad") && <small id="error-disc-mensualidad" className="field-error">{mostrarError(errores, "mensualidad")}</small>}
          </label>

          <div className="form-hint full">
            No se elimina una disciplina — se desactiva para preservar el
            historial.
          </div>

          {error && <div className="form-error full">{error}</div>}

          <div className="form-actions full">
            <button className="btn btn-ghost" type="button" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : disciplinaEditando
                  ? "Guardar cambios"
                  : "Crear disciplina"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default DisciplinaFormModal;
