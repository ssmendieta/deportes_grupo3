import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import EmptyState from "../../../shared/components/EmptyState";
import {
  crearReserva,
  getDisciplinasReserva,
  getEspacios,
} from "../services/reservaService";
import type { DisciplinaBasica, Espacio, ReservaFormData } from "../types/reserva.types";

type Props = {
  onVolver: () => void;
  onReservaCreada?: () => void;
};

const formInicial: ReservaFormData = {
  nombre_solicitante: "",
  carnet: "",
  email_solicitante: "",
  motivo: "",
  espacio_id: "",
  disciplina_id: "",
  fecha: "",
  hora_inicio: "",
  hora_fin: "",
};

const horasDisponibles = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"];

function horaAMinutos(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function ReservaForm({ onVolver, onReservaCreada }: Props) {
  const [formData, setFormData] = useState<ReservaFormData>(formInicial);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [disciplinas, setDisciplinas] = useState<DisciplinaBasica[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void Promise.all([getEspacios(), getDisciplinasReserva()]).then(([espaciosData, disciplinasData]) => {
        setEspacios(espaciosData);
        setDisciplinas(disciplinasData);
        setFormData((prev) => ({
          ...prev,
          espacio_id: prev.espacio_id || String(espaciosData[0]?.id || ""),
          disciplina_id: prev.disciplina_id || String(disciplinasData[0]?.id || ""),
        }));
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const duracionHoras = useMemo(() => {
    if (!formData.hora_inicio || !formData.hora_fin) return 0;
    return (horaAMinutos(formData.hora_fin) - horaAMinutos(formData.hora_inicio)) / 60;
  }, [formData.hora_fin, formData.hora_inicio]);

  const formularioValido =
    formData.nombre_solicitante.trim() &&
    formData.carnet.trim() &&
    formData.motivo.trim() &&
    formData.espacio_id &&
    formData.disciplina_id &&
    formData.fecha &&
    formData.hora_inicio &&
    formData.hora_fin &&
    duracionHoras > 0 &&
    duracionHoras <= 3;

  const handleChange = (campo: keyof ReservaFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [campo]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!formularioValido) {
      setError("Completa todos los campos obligatorios. La reserva debe durar máximo 3 horas y tener hora final mayor a la inicial.");
      return;
    }

    setGuardando(true);
    try {
      await crearReserva({
        espacio_id: Number(formData.espacio_id),
        disciplina_id: Number(formData.disciplina_id),
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        nombre_solicitante: formData.nombre_solicitante.trim(),
        carnet: formData.carnet.trim(),
        motivo: formData.motivo.trim(),
        ...(formData.email_solicitante.trim() && { email_solicitante: formData.email_solicitante.trim() }),
      });
      onReservaCreada?.();
      onVolver();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la reserva");
    } finally {
      setGuardando(false);
    }
  };

  if (!espacios.length || !disciplinas.length) {
    return <EmptyState title="Cargando formulario" description="Preparando espacios y disciplinas." />;
  }

  return (
    <section className="form-page-card narrow">
      <h1>Nueva Reserva</h1>
      <p>UCB - Dirección de Deportes</p>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field full">
          <span>Nombre del solicitante *</span>
          <input value={formData.nombre_solicitante} onChange={(e) => handleChange("nombre_solicitante", e.target.value)} placeholder="Ej. Juan Pérez" required />
        </label>

        <label className="field full">
          <span>Carnet *</span>
          <input value={formData.carnet} onChange={(e) => handleChange("carnet", e.target.value)} placeholder="Ej. 12345678" required />
        </label>

        <label className="field full">
          <span>Correo electrónico <small>(opcional — para recibir el comprobante)</small></span>
          <input type="email" value={formData.email_solicitante} onChange={(e) => handleChange("email_solicitante", e.target.value)} placeholder="Ej. juan.perez@ucb.edu.bo" />
        </label>

        <label className="field full">
          <span>Motivo *</span>
          <input value={formData.motivo} onChange={(e) => handleChange("motivo", e.target.value)} placeholder="Ej. Práctica de Fútsal" required />
        </label>

        <label className="field">
          <span>Espacio *</span>
          <select value={formData.espacio_id} onChange={(e) => handleChange("espacio_id", e.target.value)} required>
            {espacios.map((espacio) => <option key={espacio.id} value={espacio.id}>{espacio.nombre}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Disciplina *</span>
          <select value={formData.disciplina_id} onChange={(e) => handleChange("disciplina_id", e.target.value)} required>
            {disciplinas.map((disciplina) => <option key={disciplina.id} value={disciplina.id}>{disciplina.nombre}</option>)}
          </select>
        </label>

        <label className="field full">
          <span>Fecha *</span>
          <input type="date" value={formData.fecha} onChange={(e) => handleChange("fecha", e.target.value)} required />
        </label>

        <label className="field">
          <span>Desde *</span>
          <select value={formData.hora_inicio} onChange={(e) => handleChange("hora_inicio", e.target.value)} required>
            <option value="">Seleccionar hora</option>
            {horasDisponibles.slice(0, -1).map((hora) => <option key={hora} value={hora}>{hora}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Hasta *</span>
          <select value={formData.hora_fin} onChange={(e) => handleChange("hora_fin", e.target.value)} required>
            <option value="">Seleccionar hora</option>
            {horasDisponibles.slice(1).map((hora) => <option key={hora} value={hora}>{hora}</option>)}
          </select>
        </label>

        <div className="form-hint full">
          Duración calculada: <strong>{duracionHoras > 0 ? `${duracionHoras} h` : "sin definir"}</strong>. Máximo permitido: 3 horas.
        </div>

        {error && <div className="form-error full">{error}</div>}

        <div className="form-actions full">
          <button type="button" className="btn btn-ghost" onClick={onVolver}>Volver</button>
          <button type="submit" className="btn btn-primary" disabled={!formularioValido || guardando}>{guardando ? "Guardando..." : "Crear reserva"}</button>
        </div>
      </form>
    </section>
  );
}

export default ReservaForm;
