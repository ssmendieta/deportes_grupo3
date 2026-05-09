import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiRequest } from "../../../shared/services/apiClient";
import type { DeportistaFormData, Disciplina } from "../types/deportista.types";

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!formData.nombreCompleto.trim()) {
      setError("El nombre completo es obligatorio.");
      return;
    }
    if (!formData.ci.trim()) {
      setError("El CI es obligatorio.");
      return;
    }
    if (!formData.disciplinaId) {
      setError("Debes seleccionar una disciplina.");
      return;
    }

    setGuardando(true);
    try {
      await onGuardar(formData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar.");
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

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nombre completo *</span>
          <input
            value={formData.nombreCompleto}
            onChange={(e) => handleChange("nombreCompleto", e.target.value)}
          />
        </label>
        <label className="field">
          <span>CI *</span>
          <input
            value={formData.ci}
            onChange={(e) => handleChange("ci", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Fecha de nacimiento</span>
          <input
            type="date"
            value={formData.fechaNacimiento}
            onChange={(e) => handleChange("fechaNacimiento", e.target.value)}
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
            value={formData.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Correo</span>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </label>
        <label className="field full">
          <span>Dirección</span>
          <input
            value={formData.direccion}
            onChange={(e) => handleChange("direccion", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Carrera</span>
          <input
            value={formData.carrera}
            onChange={(e) => handleChange("carrera", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Semestre</span>
          <input
            type="number"
            min="1"
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
            value={formData.disciplinaId ?? ""}
            onChange={(e) =>
              handleChange(
                "disciplinaId",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
          >
            <option value="">Seleccionar disciplina</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Categoría</span>
          <input
            value={formData.categoria}
            onChange={(e) => handleChange("categoria", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Nivel</span>
          <input
            value={formData.nivel}
            onChange={(e) => handleChange("nivel", e.target.value)}
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
          <button className="btn btn-ghost" type="button" onClick={onCancelar}>
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
