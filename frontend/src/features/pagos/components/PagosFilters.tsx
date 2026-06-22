import { useEffect, useState } from "react";

import { apiRequest } from "../../../shared/services/apiClient";

import type { PagoFiltro } from "../types/pago.types";

type DisciplinaOpcion = {
  id: number;
  nombre: string;
};

type Props = {
  filtros: PagoFiltro;

  onChange: (
    filtros: PagoFiltro
  ) => void;
};

function PagosFilters({
  filtros,
  onChange,
}: Props) {
  const [disciplinas, setDisciplinas] =
    useState<DisciplinaOpcion[]>([]);
  const [busquedaInput, setBusquedaInput] = useState(filtros.busqueda);

  useEffect(() => {
    apiRequest<DisciplinaOpcion[]>(
      "/api/disciplinas?activo=true",
      {
        requiresAuth: true,
      }
    )
      .then(setDisciplinas)
      .catch(() =>
        setDisciplinas([])
      );
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (busquedaInput !== filtros.busqueda) {
        onChange({ ...filtros, busqueda: busquedaInput });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [busquedaInput, filtros, onChange]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setBusquedaInput(filtros.busqueda);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [filtros.busqueda]);

  return (
    <section className="panel-card">

      {/* FILA PRINCIPAL */}
      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "2fr 1fr 1fr",

          gap: "16px",

          marginBottom: "16px",
        }}
      >

        {/* BUSQUEDA */}
        <label className="field">
          <span>
            Buscar por CI
          </span>

          <input
            value={busquedaInput}
            onChange={(e) =>
              setBusquedaInput(e.target.value.replace(/\D/g, ""))
            }
            placeholder="Buscar por CI..."
            inputMode="numeric"
          />
        </label>

        {/* DISCIPLINA */}
        <label className="field">
          <span>Disciplina</span>

          <select
            value={
              filtros.disciplinaId
            }
            onChange={(e) =>
              onChange({
                ...filtros,

                disciplinaId:
                  e.target.value ===
                  "todas"
                    ? "todas"
                    : Number(
                        e.target
                          .value
                      ),
              })
            }
          >
            <option value="todas">
              Todas
            </option>

            {disciplinas.map(
              (d) => (
                <option
                  key={d.id}
                  value={d.id}
                >
                  {d.nombre}
                </option>
              )
            )}
          </select>
        </label>

        {/* ESTADO */}
        <label className="field">
          <span>Estado</span>

          <select
            value={filtros.estado}
            onChange={(e) =>
              onChange({
                ...filtros,

                estado:
                  e.target
                    .value as PagoFiltro["estado"],
              })
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="al_dia">
              Al día
            </option>

            <option value="pendiente">
              Pendiente
            </option>
          </select>
        </label>
      </div>

      {/* FILA SECUNDARIA */}
      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "1fr 1fr",

          gap: "16px",

          maxWidth: "420px",
        }}
      >

        {/* MES */}
        <label className="field">
          <span>Mes</span>

          <select
            value={filtros.mes}
            onChange={(e) =>
              onChange({
                ...filtros,
                mes: e.target.value,
              })
            }
          >
            <option value="todos">Todos</option>
            <option value="1">Enero</option>
            <option value="2">Febrero</option>
            <option value="3">Marzo</option>
            <option value="4">Abril</option>
            <option value="5">Mayo</option>
            <option value="6">Junio</option>
            <option value="7">Julio</option>
            <option value="8">Agosto</option>
            <option value="9">Septiembre</option>
          </select>
        </label>

        {/* AÑO */}
        <label className="field">
          <span>Año</span>

          <select
            value={filtros.anio}
            onChange={(e) =>
              onChange({
                ...filtros,
                anio: e.target.value,
              })
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="2024">
              2024
            </option>

            <option value="2025">
              2025
            </option>

            <option value="2026">
              2026
            </option>
          </select>
        </label>
      </div>
    </section>
  );
}

export default PagosFilters;