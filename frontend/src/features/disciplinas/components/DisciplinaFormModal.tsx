import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Disciplina, DisciplinaFormData } from "../types/disciplina.types";

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

  useEffect(() => {
    if (!abierto) return;
    const timeoutId = window.setTimeout(() => {
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
    }, 0);
    return () => window.clearTimeout(timeoutId);
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
    if (!formData.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(formData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la disciplina.",
      );
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

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nombre *</span>
            <input
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              placeholder="Ej. Voleibol"
              disabled={!!disciplinaEditando} // no se puede cambiar el nombre
            />
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
              type="number"
              min="0"
              value={formData.mensualidad}
              onChange={(e) => handleChange("mensualidad", e.target.value)}
              placeholder="Ej. 120"
            />
          </label>

          <div className="form-hint full">
            No se elimina una disciplina — se desactiva para preservar el
            historial.
          </div>

          {error && <div className="form-error full">{error}</div>}

          <div className="form-actions full">
            <button className="btn btn-ghost" type="button" onClick={onCerrar}>
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
