import { useEffect, useMemo, useCallback, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  crearReserva,
  getEspacios,
} from "../services/reservaService";
import type { Espacio, Reserva, ReservaFormData } from "../types/reserva.types";
import {
  SLOT_PASO_MINUTOS,
  FALLBACK_SLOTS_DESDE,
  FALLBACK_SLOTS_HASTA,
  MAX_RESERVA_HORAS,
  CI_MAX_LENGTH,
  NOMBRE_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  COMPLEMENTOS,
} from "../constants/reservas.constants";
import {
  validarCI,
  validarEmail,
  validarNombreCompleto,
  type ErroresForm,
  mostrarError,
} from "../../../shared/utils/validators";
import Spinner from "../../../shared/components/Spinner";
import ReservaConfirmadaModal from "./ReservaConfirmadaModal";

function soloDigitos(v: string) {
  return v.replace(/\D/g, "").slice(0, 8);
}

function hoyString() {
  return new Date().toISOString().split("T")[0];
}

function extraerHHMM(valor: string): string {
  if (/^\d{2}:\d{2}$/.test(valor)) return valor;
  const d = new Date(valor);
  if (!isNaN(d.getTime())) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return "";
}

function generarSlots(desde: string, hasta: string, pasoMin = 30): string[] {
  const d = extraerHHMM(desde);
  const h = extraerHHMM(hasta);
  if (!d || !h) return [];
  const [h0, m0] = d.split(":").map(Number);
  const [h1, m1] = h.split(":").map(Number);
  const inicio = h0 * 60 + m0;
  const fin = h1 * 60 + m1;
  const slots: string[] = [];
  for (let t = inicio; t <= fin; t += pasoMin) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

type Props = {
  onReservaCreada?: (reserva: Reserva) => void;
};

const formInicial: ReservaFormData = {
  nombre_solicitante: "",
  ci: "",
  complemento: "",
  correo_solicitante: "",
  motivo: "",
  espacio_id: "",
  fecha_reserva: "",
  hora_inicio: "",
  hora_fin: "",
  tipo_reserva: "entrenamiento",
};

function horaAMinutos(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function ReservaForm({ onReservaCreada }: Props) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ReservaFormData>(formInicial);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errores, setErrores] = useState<ErroresForm>({});
  const [tocado, setTocado] = useState<Record<string, boolean>>({});
  const [reservaCreada, setReservaCreada] = useState<Reserva | null>(null);

  useEffect(() => {
    const tarea = window.setTimeout(() => {
      getEspacios().then((espaciosData) => {
        setEspacios(espaciosData);
        setFormData((prev) => ({
          ...prev,
          espacio_id: prev.espacio_id || String(espaciosData[0]?.id || ""),
        }));
      });
    }, 0);

    return () => window.clearTimeout(tarea);
  }, []);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, hora_inicio: "", hora_fin: "" }));
  }, [formData.espacio_id]);

  const espacioSeleccionado = useMemo(
    () => espacios.find((e) => e.id === Number(formData.espacio_id)),
    [espacios, formData.espacio_id],
  );

  const slotsDisponibles = useMemo(() => {
    const apertura = espacioSeleccionado?.horario_apertura;
    const cierre = espacioSeleccionado?.horario_cierre;
    const slots = apertura && cierre ? generarSlots(apertura, cierre, SLOT_PASO_MINUTOS) : [];
    return slots.length > 0 ? slots : generarSlots(FALLBACK_SLOTS_DESDE, FALLBACK_SLOTS_HASTA, SLOT_PASO_MINUTOS);
  }, [espacioSeleccionado]);

  const duracionHoras = useMemo(() => {
    if (!formData.hora_inicio || !formData.hora_fin) return 0;
    return (horaAMinutos(formData.hora_fin) - horaAMinutos(formData.hora_inicio)) / 60;
  }, [formData.hora_fin, formData.hora_inicio]);

  const horasFinDisponibles = useMemo(() => {
    if (!formData.hora_inicio) return slotsDisponibles;
    return slotsDisponibles.filter(
      (h) => horaAMinutos(h) > horaAMinutos(formData.hora_inicio),
    );
  }, [formData.hora_inicio, slotsDisponibles]);

  const handleChange = (campo: keyof ReservaFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [campo]: value }));
  };

  const validarCampo = useCallback((campo: string, valor: string): string | null => {
    switch (campo) {
      case "nombre_solicitante": return validarNombreCompleto(valor, "El nombre del solicitante");
      case "ci": return validarCI(valor);
      case "correo_solicitante": return valor.trim() ? validarEmail(valor) : null;
      case "espacio_id": return valor ? null : "Debes seleccionar un espacio.";
      case "fecha_reserva": return valor ? null : "La fecha es obligatoria.";
      case "tipo_reserva": return valor ? null : "Selecciona un tipo de reserva.";
      case "hora_inicio": return valor ? null : "La hora de inicio es obligatoria.";
      case "hora_fin": return valor ? null : "La hora de fin es obligatoria.";
      default: return null;
    }
  }, []);

  const handleBlur = (campo: string) => {
    setTocado((prev) => ({ ...prev, [campo]: true }));
    setErrores((prev) => ({ ...prev, [campo]: validarCampo(campo, formData[campo as keyof ReservaFormData] ?? "") }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const nuevosErrores: ErroresForm = {
      nombre_solicitante: validarNombreCompleto(formData.nombre_solicitante, "El nombre del solicitante"),
      ci: validarCI(formData.ci),
      correo_solicitante: (formData.correo_solicitante ?? "").trim() ? validarEmail(formData.correo_solicitante ?? "") : null,
      espacio_id: formData.espacio_id ? null : "Debes seleccionar un espacio.",
      fecha_reserva: formData.fecha_reserva ? null : "La fecha es obligatoria.",
      tipo_reserva: formData.tipo_reserva ? null : "Selecciona un tipo de reserva.",
      hora_inicio: formData.hora_inicio ? null : "La hora de inicio es obligatoria.",
      hora_fin: formData.hora_fin ? null : "La hora de fin es obligatoria.",
    };
    setErrores(nuevosErrores);
    setTocado({ nombre_solicitante: true, ci: true, correo_solicitante: true, espacio_id: true, fecha_reserva: true, tipo_reserva: true, hora_inicio: true, hora_fin: true });
    if (Object.values(nuevosErrores).some(Boolean)) return;

    if (duracionHoras <= 0 || duracionHoras > MAX_RESERVA_HORAS) {
      setError(`La reserva debe durar máximo ${MAX_RESERVA_HORAS} horas y la hora final debe ser mayor a la inicial.`);
      return;
    }

    setGuardando(true);
    try {
      const reserva = await crearReserva({
        espacio_id: Number(formData.espacio_id),
        fecha_reserva: formData.fecha_reserva,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin,
        tipo_reserva: formData.tipo_reserva,
        motivo: "Solicitud desde formulario",
        nombre_solicitante: formData.nombre_solicitante.trim(),
        ci: formData.ci ? parseInt(formData.ci) : 0,
        complemento: formData.complemento?.trim() || undefined,
        ...((formData.correo_solicitante ?? "").trim() && { correo_solicitante: (formData.correo_solicitante ?? "").trim() }),
      });
      setReservaCreada(reserva);
      onReservaCreada?.(reserva);
      setFormData(formInicial);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "Error desconocido";
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  if (!espacios.length) {
    return <Spinner texto="Preparando formulario..." />;
  }

  return (
    <section className="form-page-card narrow">
      <h1>Nueva Reserva</h1>
      <p>UCB - Dirección de Deportes</p>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label className="field full">
          <span>Nombre del solicitante *</span>
          <input id="res-nombre" value={formData.nombre_solicitante} onChange={(e) => { handleChange("nombre_solicitante", e.target.value); setErrores((p) => ({ ...p, nombre_solicitante: null })); }} onBlur={() => handleBlur("nombre_solicitante")} placeholder="Ej. Juan Pérez" required maxLength={NOMBRE_MAX_LENGTH} aria-describedby={tocado.nombre_solicitante && mostrarError(errores, "nombre_solicitante") ? "error-res-nombre" : undefined} />
          {tocado.nombre_solicitante && mostrarError(errores, "nombre_solicitante") && <small id="error-res-nombre" className="field-error">{mostrarError(errores, "nombre_solicitante")}</small>}
        </label>

        <label className="field" style={{ flex: "1 1 0" }}>
          <span>CI *</span>
          <input id="res-ci" value={formData.ci} onChange={(e) => { handleChange("ci", soloDigitos(e.target.value)); setErrores((p) => ({ ...p, ci: null })); }} onBlur={() => handleBlur("ci")} placeholder="Ej. 1234567" inputMode="numeric" required maxLength={CI_MAX_LENGTH} aria-describedby={tocado.ci && mostrarError(errores, "ci") ? "error-res-ci" : undefined} />
          {tocado.ci && mostrarError(errores, "ci") && <small id="error-res-ci" className="field-error">{mostrarError(errores, "ci")}</small>}
        </label>

        <label className="field" style={{ flex: "0 0 130px" }}>
          <span>Complemento</span>
          <select id="res-complemento" value={formData.complemento ?? ""} onChange={(e) => handleChange("complemento", e.target.value)}>
            {COMPLEMENTOS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </label>

        <label className="field full">
          <span>Correo electrónico *</span>
          <input id="res-email" type="email" value={formData.correo_solicitante} onChange={(e) => { handleChange("correo_solicitante", e.target.value); setErrores((p) => ({ ...p, correo_solicitante: null })); }} onBlur={() => handleBlur("correo_solicitante")} placeholder="Ej. juan.perez@ucb.edu.bo" required maxLength={EMAIL_MAX_LENGTH} aria-describedby={tocado.correo_solicitante && mostrarError(errores, "correo_solicitante") ? "error-res-email" : undefined} />
          {tocado.correo_solicitante && mostrarError(errores, "correo_solicitante") && <small id="error-res-email" className="field-error">{mostrarError(errores, "correo_solicitante")}</small>}
        </label>

        <label className="field">
          <span>Espacio *</span>
          <select id="res-espacio" value={formData.espacio_id} onChange={(e) => { handleChange("espacio_id", e.target.value); setErrores((p) => ({ ...p, espacio_id: null })); }} onBlur={() => handleBlur("espacio_id")} required aria-describedby={tocado.espacio_id && mostrarError(errores, "espacio_id") ? "error-res-espacio" : undefined}>
            {espacios.map((espacio) => <option key={espacio.id} value={espacio.id}>{espacio.nombre}</option>)}
          </select>
          {tocado.espacio_id && mostrarError(errores, "espacio_id") && <small id="error-res-espacio" className="field-error">{mostrarError(errores, "espacio_id")}</small>}
        </label>

        <label className="field">
          <span>Tipo reserva *</span>
          <select id="res-tipo" value={formData.tipo_reserva} onChange={(e) => { handleChange("tipo_reserva", e.target.value); setErrores((p) => ({ ...p, tipo_reserva: null })); }} onBlur={() => handleBlur("tipo_reserva")} required>
            <option value="entrenamiento">Entrenamiento</option>
            <option value="partido">Partido</option>
            <option value="evento">Evento</option>
            <option value="otro">Otro</option>
          </select>
          {tocado.tipo_reserva && mostrarError(errores, "tipo_reserva") && <small id="error-res-tipo" className="field-error">{mostrarError(errores, "tipo_reserva")}</small>}
        </label>

        <label className="field full">
          <span>Fecha *</span>
          <input id="res-fecha" type="date" value={formData.fecha_reserva} onChange={(e) => { handleChange("fecha_reserva", e.target.value); setErrores((p) => ({ ...p, fecha_reserva: null })); }} onBlur={() => handleBlur("fecha_reserva")} min={hoyString()} required aria-describedby={tocado.fecha_reserva && mostrarError(errores, "fecha_reserva") ? "error-res-fecha" : undefined} />
          {tocado.fecha_reserva && mostrarError(errores, "fecha_reserva") && <small id="error-res-fecha" className="field-error">{mostrarError(errores, "fecha_reserva")}</small>}
        </label>

        <label className="field">
          <span>Desde *</span>
          <select id="res-hora-inicio" value={formData.hora_inicio} onChange={(e) => { handleChange("hora_inicio", e.target.value); setErrores((p) => ({ ...p, hora_inicio: null })); }} onBlur={() => handleBlur("hora_inicio")} required aria-describedby={tocado.hora_inicio && mostrarError(errores, "hora_inicio") ? "error-res-hora-inicio" : undefined}>
            <option value="">Seleccionar hora</option>
            {slotsDisponibles.slice(0, -1).map((hora) => <option key={hora} value={hora}>{hora}</option>)}
          </select>
          {tocado.hora_inicio && mostrarError(errores, "hora_inicio") && <small id="error-res-hora-inicio" className="field-error">{mostrarError(errores, "hora_inicio")}</small>}
        </label>

        <label className="field">
          <span>Hasta *</span>
          <select id="res-hora-fin" value={formData.hora_fin} onChange={(e) => { handleChange("hora_fin", e.target.value); setErrores((p) => ({ ...p, hora_fin: null })); }} onBlur={() => handleBlur("hora_fin")} required aria-describedby={tocado.hora_fin && mostrarError(errores, "hora_fin") ? "error-res-hora-fin" : undefined}>
            <option value="">Seleccionar hora</option>
            {horasFinDisponibles.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
          </select>
          {tocado.hora_fin && mostrarError(errores, "hora_fin") && <small id="error-res-hora-fin" className="field-error">{mostrarError(errores, "hora_fin")}</small>}
        </label>

        {duracionHoras > MAX_RESERVA_HORAS && (
          <div className="form-error full">La reserva no puede durar más de {MAX_RESERVA_HORAS} horas.</div>
        )}

        {error && <div className="form-error full">{error}</div>}

        <div className="form-actions full">
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/reservas")} disabled={guardando}>Volver</button>
          <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? "Guardando..." : "Crear reserva"}</button>
        </div>
      </form>
      <ReservaConfirmadaModal
        abierto={!!reservaCreada}
        reserva={reservaCreada}
        onCerrar={() => setReservaCreada(null)}
      />
    </section>
  );
}

export default ReservaForm;
