import { useState, useEffect } from "react"
import axios from "axios"
import Icon, { NUTRIENTE_ICONS } from "../components/Icon"
import { API, NUTRIENTES, LABELS, COLORES, COLORES_BG, METAS_DEFAULT } from "../constants"

export default function MetasPage({ usuario }) {
  const [metasData, setMetasData] = useState(null)
  const [metasEditando, setMetasEditando] = useState(false)
  const [metasForm, setMetasForm] = useState({ tecnico: 5, conceptual: 5, aplicado: 5, soft_skills: 5, contexto: 5 })
  const [badges, setBadges] = useState([])
  const [metasCargando, setMetasCargando] = useState(false)
  const [metasError, setMetasError] = useState(null)

  useEffect(() => {
    cargarMetas()
    cargarBadges()
  }, [])

  const cargarMetas = async () => {
    if (!usuario) return
    setMetasCargando(true)
    setMetasError(null)
    try {
      const r = await axios.get(`${API}/metas/semana/${usuario.id}`)
      setMetasData(r.data)
      setMetasForm({
        tecnico: r.data.metas.tecnico || 5,
        conceptual: r.data.metas.conceptual || 5,
        aplicado: r.data.metas.aplicado || 5,
        soft_skills: r.data.metas.soft_skills || 5,
        contexto: r.data.metas.contexto || 5,
      })
    } catch (e) {
      setMetasError("No se pudieron cargar las metas. Verifica que el servidor esté activo.")
    }
    setMetasCargando(false)
  }

  const guardarMetas = async () => {
    if (!usuario) return
    setMetasCargando(true)
    setMetasError(null)
    try {
      await axios.post(`${API}/metas/semana/actualizar`, { usuario_id: usuario.id, ...metasForm })
      await cargarMetas()
      setMetasEditando(false)
    } catch (e) {
      setMetasError(e.response?.data?.detail || "Error al guardar las metas")
    }
    setMetasCargando(false)
  }

  const cargarBadges = async () => {
    if (!usuario) return
    try { const r = await axios.get(`${API}/badges/${usuario.id}`); setBadges(r.data) }
    catch (e) { console.error("Error cargando badges:", e) }
  }

  return (
    <>
      <div className="page-hdr">
        <div className="page-greeting">Metas Semanales</div>
        <div className="page-sub">Define cuántos registros por nutriente quieres lograr esta semana.</div>
      </div>

      {metasError && (
        <div className="error-box" style={{ marginBottom: 14 }}>
          <Icon name="warning" size={14} color="#C0523F" />{metasError}
          <button onClick={() => setMetasError(null)} style={{ background: "none", border: "none", color: "#C0523F", cursor: "pointer", marginLeft: "auto", fontSize: 16 }}>×</button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 13 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontFamily: "'Figtree',sans-serif", fontWeight: 700, fontSize: 15, color: "#1A1816" }}>
              {metasData ? `${metasData.semana_inicio} — ${metasData.semana_fin}` : "Semana actual"}
            </div>
            {metasData && (
              <div style={{ fontSize: 12, color: "rgba(26,24,22,0.42)", marginTop: 2 }}>
                Progreso total: {Object.values(metasData.progreso).reduce((a, b) => a + b, 0)} / {Object.values(metasData.metas).reduce((a, b) => a + b, 0)} registros
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="edit-btn" onClick={() => {
              if (!metasEditando && metasData) setMetasForm({ tecnico: metasData.metas.tecnico || 5, conceptual: metasData.metas.conceptual || 5, aplicado: metasData.metas.aplicado || 5, soft_skills: metasData.metas.soft_skills || 5, contexto: metasData.metas.contexto || 5 })
              setMetasEditando(!metasEditando)
            }}>
              <Icon name="edit" size={13} color="#8B7FD4" />{metasEditando ? "Cancelar" : "Editar metas"}
            </button>
            <button className="submit-btn" style={{ width: "auto", marginTop: 0, padding: "8px 16px", fontSize: 12 }} onClick={cargarMetas} disabled={metasCargando}>
              {metasCargando ? "Cargando…" : "Actualizar"}
            </button>
          </div>
        </div>
      </div>

      <div className="meta-grid">
        {NUTRIENTES.map((n, i) => {
          const keyLow = n.toLowerCase()
          const prog = metasData ? (metasData.progreso[keyLow] ?? metasData.progreso[n] ?? 0) : 0
          const target = metasEditando
            ? (metasForm[keyLow] || 1)
            : (metasData ? (metasData.metas[keyLow] ?? metasData.metas[n] ?? METAS_DEFAULT[n]) : METAS_DEFAULT[n])
          const pct = Math.min((prog / (target || 1)) * 100, 100)
          const cumplida = prog >= target
          return (
            <div key={n} className="meta-item">
              <div className="meta-top">
                <div className="meta-icon" style={{ background: COLORES_BG[n] }}>
                  <Icon name={NUTRIENTE_ICONS[n]} size={14} color={COLORES[n]} />
                </div>
                <span className="meta-name">{LABELS[i]}</span>
                {cumplida && !metasEditando && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#2D7A5B", background: "#EBF7F2", borderRadius: 20, padding: "2px 8px" }}>✓ meta</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div className="meta-count">{prog}</div>
                <div style={{ fontSize: 12, color: "rgba(26,24,22,0.35)", fontWeight: 500 }}>
                  {metasEditando ? "de" : `/ ${target}`}
                </div>
                {metasEditando && (
                  <input type="number" min={1} max={50} className="meta-inp" value={metasForm[keyLow] || ""} onChange={e => setMetasForm({ ...metasForm, [keyLow]: parseInt(e.target.value) || 1 })} />
                )}
              </div>
              <div className="bar-bg2">
                <div className="meta-bar" style={{ width: `${pct}%`, background: cumplida ? "#5DB896" : COLORES[n] }} />
              </div>
              <div className="meta-foot">{Math.round(pct)}% completado</div>
            </div>
          )
        })}
      </div>

      {metasEditando && (
        <div style={{ display: "flex", gap: 8, marginTop: 4, justifyContent: "flex-end" }}>
          <button className="submit-btn" style={{ width: "auto", padding: "10px 24px" }} onClick={guardarMetas} disabled={metasCargando}>
            {metasCargando ? "Guardando…" : <><Icon name="check" size={14} color="#fff" />Guardar metas</>}
          </button>
        </div>
      )}

      <div className="card" style={{ marginTop: 13 }}>
        <div className="card-lbl">Logros obtenidos</div>
        {badges && badges.length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {badges.map((b, i) => (
              <div key={i} style={{ background: "#F0EEF9", border: "1.5px solid rgba(139,127,212,0.2)", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#6857B8", display: "flex", alignItems: "center", gap: 6 }}>
                <span>🏅</span>{b.nombre}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">Completa tus metas semanales para ganar badges 🎯</div>
        )}
      </div>
    </>
  )
}
