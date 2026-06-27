import { useState } from "react"
import Icon, { NUTRIENTE_ICONS } from "../components/Icon"
import { COLORES, COLORES_BG } from "../constants"

export default function HistorialPage({ registros, eliminar }) {
  const [filtro, setFiltro] = useState("todo")

  const registrosFiltrados = () => {
    const hoy = new Date()
    return registros.filter(r => {
      if (filtro === "todo") return true
      if (!r.fecha) return false
      const f = new Date(r.fecha)
      if (filtro === "semana") { const h7 = new Date(hoy); h7.setDate(hoy.getDate() - 7); return f >= h7 }
      if (filtro === "mes") return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
      return true
    })
  }

  const filtrados = registrosFiltrados()

  return (
    <>
      <div className="page-hdr"><div className="page-greeting">Historial de aprendizajes</div><div className="page-sub">{registros.length} registro{registros.length !== 1 ? "s" : ""} en total · ordenados por fecha</div></div>
      <div className="hist-toolbar">
        <div className="filtros" style={{ marginBottom: 0 }}>{[["todo", "Todos"], ["semana", "Esta semana"], ["mes", "Este mes"]].map(([v, l]) => (<button key={v} className={`fil-btn ${filtro === v ? "active" : ""}`} onClick={() => setFiltro(v)}>{l}</button>))}</div>
        <span className="hist-count">{filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="card" style={{ marginTop: 13 }}>
        {filtrados.length === 0
          ? <div className="empty">No hay registros para este período</div>
          : filtrados.map((r, i) => (
            <div className="entry" key={i}>
              <div className="entry-top">
                <span className="entry-date"><Icon name="calendar" size={11} color="rgba(26,24,22,0.55)" />{r.fecha || "Hoy"}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div className="entry-tags">{r.nutrientes && r.nutrientes.split(",").map(n => (<span key={n} className="tag" style={{ color: COLORES[n], borderColor: COLORES[n] + "66", background: COLORES_BG[n] }}><Icon name={NUTRIENTE_ICONS[n]} size={9} color={COLORES[n]} />{n.replace("_", " ")}</span>))}</div>
                  <button className="del-btn" onClick={() => eliminar(r.id)} title="Eliminar"><Icon name="trash" size={13} color="currentColor" /></button>
                </div>
              </div>
              <div className="entry-text">"{r.texto}"</div>
              {r.resumen && <div className="entry-resumen">{r.resumen}</div>}
            </div>
          ))
        }
      </div>
    </>
  )
}
