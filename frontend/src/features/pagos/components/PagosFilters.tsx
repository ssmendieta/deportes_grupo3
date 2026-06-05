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
            Buscar por nombre o CI
          </span>

          <input
            value={filtros.busqueda}
            onChange={(e) =>
              onChange({
                ...filtros,
                busqueda:
                  e.target.value,
              })
            }
            placeholder="Buscar..."
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
            <option value="todos">
              Todos
            </option>

            <option value="enero">
              Enero
            </option>

            <option value="febrero">
              Febrero
            </option>

            <option value="marzo">
              Marzo
            </option>

            <option value="abril">
              Abril
            </option>

            <option value="mayo">
              Mayo
            </option>

            <option value="junio">
              Junio
            </option>

            <option value="julio">
              Julio
            </option>

            <option value="agosto">
              Agosto
            </option>

            <option value="septiembre">
              Septiembre
            </option>

            <option value="octubre">
              Octubre
            </option>

            <option value="noviembre">
              Noviembre
            </option>

            <option value="diciembre">
              Diciembre
            </option>
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