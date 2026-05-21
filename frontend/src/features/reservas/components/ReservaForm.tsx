import { useEffect, useMemo, useCallback, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  crearReserva,
  getDisciplinasReserva,
  getEspacios,
} from "../services/reservaService";
import type { DisciplinaBasica, Espacio, ReservaFormData } from "../types/reserva.types";
import {
  validarCI,
  validarEmail,
  validarNombreCompleto,
  validarRequerido,
  type ErroresForm,
  mostrarError,
} from "../../../shared/utils/validators";
import Spinner from "../../../shared/components/Spinner";

function formatearCI(v: string) {
  return v.replace(/[^0-9A-Za-z-]/g, "").slice(0, 13);
}

function hoyString() {
  return new Date().toISOString().split("T")[0];
}

type Props = {
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

function ReservaForm({ onReservaCreada }: Props) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ReservaFormData>(formInicial);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [disciplinas, setDisciplinas] = useState<DisciplinaBasica[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<ErroresForm>({});
  const [tocado, setTocado] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([getEspacios(), getDisciplinasReserva()]).then(([espaciosData, disciplinasData]) => {
      setEspacios(espaciosData);
      setDisciplinas(disciplinasData);
      setFormData((prev) => ({
        ...prev,
        espacio_id: prev.espacio_id || String(espaciosData[0]?.id || ""),
        disciplina_id: prev.disciplina_id || String(disciplinasData[0]?.id || ""),
      }));
    });
  }, []);

  const duracionHoras = useMemo(() => {
    if (!formData.hora_inicio || !formData.hora_fin) return 0;
    return (horaAMinutos(formData.hora_fin) - horaAMinutos(formData.hora_inicio)) / 60;
  }, [formData.hora_fin, formData.hora_inicio]);

  const handleChange = (campo: keyof ReservaFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [campo]: value }));
  };

  const validarCampo = useCallback((campo: string, valor: string): string | null => {
    switch (campo) {
      case "nombre_solicitante": return validarNombreCompleto(valor, "El nombre del solicitante");
      case "carnet": return validarCI(valor);
      case "email_solicitante": return valor.trim() ? validarEmail(valor) : null;
      case "motivo": return validarRequerido(valor, "El motivo");
      case "espacio_id": return valor ? null : "Debes seleccionar un espacio.";
      case "disciplina_id": return valor ? null : "Debes seleccionar una disciplina.";
      case "fecha": return valor ? null : "La fecha es obligatoria.";
      case "hora_inicio": return valor ? null : "La hora de inicio es obligatoria.";
      case "hora_fin": return valor ? null : "La hora de fin es obligatoria.";
      default: return null;
    }
  }, []);

  const handleBlur = (campo: string) => {
    setTocado((prev) => ({ ...prev, [campo]: true }));
    setErrores((prev) => ({ ...prev, [campo]: validarCampo(campo, formData[campo as keyof ReservaFormData]) }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const nuevosErrores: ErroresForm = {
      nombre_solicitante: validarNombreCompleto(formData.nombre_solicitante, "El nombre del solicitante"),
      carnet: validarCI(formData.carnet),
      email_solicitante: formData.email_solicitante.trim() ? validarEmail(formData.email_solicitante) : null,
      motivo: validarRequerido(formData.motivo, "El motivo"),
      espacio_id: formData.espacio_id ? null : "Debes seleccionar un espacio.",
      disciplina_id: formData.disciplina_id ? null : "Debes seleccionar una disciplina.",
      fecha: formData.fecha ? null : "La fecha es obligatoria.",
      hora_inicio: formData.hora_inicio ? null : "La hora de inicio es obligatoria.",
      hora_fin: formData.hora_fin ? null : "La hora de fin es obligatoria.",
    };
    setErrores(nuevosErrores);
    setTocado({ nombre_solicitante: true, carnet: true, email_solicitante: true, motivo: true, espacio_id: true, disciplina_id: true, fecha: true, hora_inicio: true, hora_fin: true });
    if (Object.values(nuevosErrores).some(Boolean)) return;

    if (duracionHoras <= 0 || duracionHoras > 3) {
      setError("La reserva debe durar máximo 3 horas y la hora final debe ser mayor a la inicial.");
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
      navigate("/reservas");
    } catch (err) {
      setError("No se pudo crear la reserva. Verifica los datos e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  if (!espacios.length || !disciplinas.length) {
    return <Spinner texto="Preparando formulario..." />;
  }

  return (
    <section className="form-page-card narrow">
      <h1>Nueva Reserva</h1>
      <p>UCB - Dirección de Deportes</p>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label className="field full">
          <span>Nombre del solicitante *</span>
          <input id="res-nombre" value={formData.nombre_solicitante} onChange={(e) => { handleChange("nombre_solicitante", e.target.value); setErrores((p) => ({ ...p, nombre_solicitante: null })); }} onBlur={() => handleBlur("nombre_solicitante")} placeholder="Ej. Juan Pérez" required maxLength={100} aria-describedby={tocado.nombre_solicitante && mostrarError(errores, "nombre_solicitante") ? "error-res-nombre" : undefined} />
          {tocado.nombre_solicitante && mostrarError(errores, "nombre_solicitante") && <small id="error-res-nombre" className="field-error">{mostrarError(errores, "nombre_solicitante")}</small>}
        </label>

        <label className="field full">
          <span>Carnet *</span>
          <input id="res-carnet" value={formData.carnet} onChange={(e) => { handleChange("carnet", formatearCI(e.target.value)); setErrores((p) => ({ ...p, carnet: null })); }} onBlur={() => handleBlur("carnet")} placeholder="Ej. 1234567 o 1234567-1L" required maxLength={13} aria-describedby={tocado.carnet && mostrarError(errores, "carnet") ? "error-res-carnet" : undefined} />
          {tocado.carnet && mostrarError(errores, "carnet") && <small id="error-res-carnet" className="field-error">{mostrarError(errores, "carnet")}</small>}
        </label>

        <label className="field full">
          <span>Correo electrónico <small>(opcional — para recibir el comprobante)</small></span>
          <input id="res-email" type="email" value={formData.email_solicitante} onChange={(e) => { handleChange("email_solicitante", e.target.value); setErrores((p) => ({ ...p, email_solicitante: null })); }} onBlur={() => handleBlur("email_solicitante")} placeholder="Ej. juan.perez@ucb.edu.bo" maxLength={120} aria-describedby={tocado.email_solicitante && mostrarError(errores, "email_solicitante") ? "error-res-email" : undefined} />
          {tocado.email_solicitante && mostrarError(errores, "email_solicitante") && <small id="error-res-email" className="field-error">{mostrarError(errores, "email_solicitante")}</small>}
        </label>

        <label className="field full">
          <span>Motivo *</span>
          <input id="res-motivo" value={formData.motivo} onChange={(e) => { handleChange("motivo", e.target.value); setErrores((p) => ({ ...p, motivo: null })); }} onBlur={() => handleBlur("motivo")} placeholder="Ej. Práctica de Fútsal" required maxLength={300} aria-describedby={tocado.motivo && mostrarError(errores, "motivo") ? "error-res-motivo" : undefined} />
          {tocado.motivo && mostrarError(errores, "motivo") && <small id="error-res-motivo" className="field-error">{mostrarError(errores, "motivo")}</small>}
        </label>

        <label className="field">
          <span>Espacio *</span>
          <select id="res-espacio" value={formData.espacio_id} onChange={(e) => { handleChange("espacio_id", e.target.value); setErrores((p) => ({ ...p, espacio_id: null })); }} onBlur={() => handleBlur("espacio_id")} required aria-describedby={tocado.espacio_id && mostrarError(errores, "espacio_id") ? "error-res-espacio" : undefined}>
            {espacios.map((espacio) => <option key={espacio.id} value={espacio.id}>{espacio.nombre}</option>)}
          </select>
          {tocado.espacio_id && mostrarError(errores, "espacio_id") && <small id="error-res-espacio" className="field-error">{mostrarError(errores, "espacio_id")}</small>}
        </label>

        <label className="field">
          <span>Disciplina *</span>
          <select id="res-disciplina" value={formData.disciplina_id} onChange={(e) => { handleChange("disciplina_id", e.target.value); setErrores((p) => ({ ...p, disciplina_id: null })); }} onBlur={() => handleBlur("disciplina_id")} required aria-describedby={tocado.disciplina_id && mostrarError(errores, "disciplina_id") ? "error-res-disciplina" : undefined}>
            {disciplinas.map((disciplina) => <option key={disciplina.id} value={disciplina.id}>{disciplina.nombre}</option>)}
          </select>
          {tocado.disciplina_id && mostrarError(errores, "disciplina_id") && <small id="error-res-disciplina" className="field-error">{mostrarError(errores, "disciplina_id")}</small>}
        </label>

        <label className="field full">
          <span>Fecha *</span>
          <input id="res-fecha" type="date" value={formData.fecha} onChange={(e) => { handleChange("fecha", e.target.value); setErrores((p) => ({ ...p, fecha: null })); }} onBlur={() => handleBlur("fecha")} min={hoyString()} required aria-describedby={tocado.fecha && mostrarError(errores, "fecha") ? "error-res-fecha" : undefined} />
          {tocado.fecha && mostrarError(errores, "fecha") && <small id="error-res-fecha" className="field-error">{mostrarError(errores, "fecha")}</small>}
        </label>

        <label className="field">
          <span>Desde *</span>
          <select id="res-hora-inicio" value={formData.hora_inicio} onChange={(e) => { handleChange("hora_inicio", e.target.value); setErrores((p) => ({ ...p, hora_inicio: null })); }} onBlur={() => handleBlur("hora_inicio")} required aria-describedby={tocado.hora_inicio && mostrarError(errores, "hora_inicio") ? "error-res-hora-inicio" : undefined}>
            <option value="">Seleccionar hora</option>
            {horasDisponibles.slice(0, -1).map((hora) => <option key={hora} value={hora}>{hora}</option>)}
          </select>
          {tocado.hora_inicio && mostrarError(errores, "hora_inicio") && <small id="error-res-hora-inicio" className="field-error">{mostrarError(errores, "hora_inicio")}</small>}
        </label>

        <label className="field">
          <span>Hasta *</span>
          <select id="res-hora-fin" value={formData.hora_fin} onChange={(e) => { handleChange("hora_fin", e.target.value); setErrores((p) => ({ ...p, hora_fin: null })); }} onBlur={() => handleBlur("hora_fin")} required aria-describedby={tocado.hora_fin && mostrarError(errores, "hora_fin") ? "error-res-hora-fin" : undefined}>
            <option value="">Seleccionar hora</option>
            {horasDisponibles.slice(1).map((hora) => <option key={hora} value={hora}>{hora}</option>)}
          </select>
          {tocado.hora_fin && mostrarError(errores, "hora_fin") && <small id="error-res-hora-fin" className="field-error">{mostrarError(errores, "hora_fin")}</small>}
        </label>

        <div className="form-hint full">
          Duración calculada: <strong>{duracionHoras > 0 ? `${duracionHoras} h` : "sin definir"}</strong>. Máximo permitido: 3 horas.
        </div>

        {error && <div className="form-error full">{error}</div>}

        <div className="form-actions full">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/reservas")} disabled={guardando}>Volver</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? "Guardando..." : "Crear reserva"}</button>
        </div>
      </form>
    </section>
  );
}

export default ReservaForm;
