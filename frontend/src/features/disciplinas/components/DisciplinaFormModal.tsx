import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Disciplina, DisciplinaFormData, Entrenador } from "../types/disciplina.types";

type Props = {
  abierto: boolean;
  disciplinaEditando: Disciplina | null;
  entrenadores: Entrenador[];
  onCerrar: () => void;
  onGuardar: (data: DisciplinaFormData) => Promise<void> | void;
};

const formInicial: DisciplinaFormData = {
  nombre: "",
  descripcion: "",
  tipo: "",
  entrenadorId: "",
  categorias: "",
  mensualidad: "",
  estado: "activa",
};

function DisciplinaFormModal({ abierto, disciplinaEditando, entrenadores, onCerrar, onGuardar }: Props) {
  const [formData, setFormData] = useState<DisciplinaFormData>(formInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto) return;

    const nuevoFormData: DisciplinaFormData = disciplinaEditando
      ? {
          nombre: disciplinaEditando.nombre,
          descripcion: disciplinaEditando.descripcion || "",
          tipo: disciplinaEditando.tipo,
          entrenadorId: disciplinaEditando.entrenadorId ? String(disciplinaEditando.entrenadorId) : "",
          categorias: disciplinaEditando.categorias || "",
          mensualidad: disciplinaEditando.mensualidad ? String(disciplinaEditando.mensualidad) : "",
          estado: disciplinaEditando.estado,
        }
      : formInicial;

    const timeoutId = window.setTimeout(() => {
      setFormData(nuevoFormData);
      setError("");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [abierto, disciplinaEditando]);

  if (!abierto) return null;

  const handleChange = <K extends keyof DisciplinaFormData>(campo: K, value: DisciplinaFormData[K]) => {
    setFormData((prev) => ({ ...prev, [campo]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!formData.nombre.trim() || !formData.tipo || !formData.categorias.trim()) {
      setError("Nombre, tipo y categorías son obligatorios.");
      return;
    }

    setGuardando(true);
    try {
      await onGuardar(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la disciplina");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card">
        <button className="modal-close" onClick={onCerrar}>×</button>
        <h2>{disciplinaEditando ? "Editar disciplina" : "Crear nueva disciplina"}</h2>
        <p>HU-GES-17: CRUD, activar/desactivar y asignar entrenadores.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field"><span>Nombre de disciplina *</span><input value={formData.nombre} onChange={(e) => handleChange("nombre", e.target.value)} placeholder="Ej. Voleibol" /></label>
          <label className="field"><span>Tipo *</span><select value={formData.tipo} onChange={(e) => handleChange("tipo", e.target.value as DisciplinaFormData["tipo"])}><option value="">Seleccionar tipo</option><option value="academia">Academia</option><option value="clase_libre">Clase libre</option><option value="competitivo">Competitivo</option></select></label>
          <label className="field full"><span>Descripción</span><textarea value={formData.descripcion} onChange={(e) => handleChange("descripcion", e.target.value)} placeholder="Breve descripción de la disciplina" /></label>
          <label className="field"><span>Entrenador asignado</span><select value={formData.entrenadorId} onChange={(e) => handleChange("entrenadorId", e.target.value)}><option value="">Sin entrenador</option>{entrenadores.map((entrenador) => <option key={entrenador.id} value={entrenador.id}>{entrenador.nombre}</option>)}</select></label>
          <label className="field"><span>Categorías disponibles *</span><input value={formData.categorias} onChange={(e) => handleChange("categorias", e.target.value)} placeholder="Ej. Sub-14, Mayores" /></label>
          <label className="field"><span>Monto mensual sugerido</span><input type="number" min="0" value={formData.mensualidad} onChange={(e) => handleChange("mensualidad", e.target.value)} placeholder="Bs. 130" /></label>
          <label className="field"><span>Estado</span><select value={formData.estado} onChange={(e) => handleChange("estado", e.target.value as DisciplinaFormData["estado"])}><option value="activa">Activa</option><option value="inactiva">Inactiva</option></select></label>

          <div className="form-hint full">No se elimina una disciplina; se desactiva para no romper historial de reservas, pagos e inscripciones.</div>
          {error && <div className="form-error full">{error}</div>}
          <div className="form-actions full"><button className="btn btn-ghost" type="button" onClick={onCerrar}>Cancelar</button><button className="btn btn-primary" type="submit" disabled={guardando}>{guardando ? "Guardando..." : disciplinaEditando ? "Guardar cambios" : "Crear disciplina"}</button></div>
        </form>
      </section>
    </div>
  );
}

export default DisciplinaFormModal;
