import { useState } from "react"
import axios from "axios"
import Icon, { NUTRIENTE_ICONS } from "../components/Icon"
import { API, NUTRIENTES, LABELS, COLORES, COLORES_BG, MOTIVACIONES } from "../constants"

export default function RegistroPage({ usuario, balance, metas, onNuevoRegistro }) {
  const [tema, setTema] = useState("")
  const [texto, setTexto] = useState("")
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [motivacion, setMotivacion] = useState(null)

  const clasificar = async () => {
    if (!texto.trim()) return
    setCargando(true); setError(null); setMotivacion(null)
    try {
      const r = await axios.post(`${API}/clasificar`, { texto, tema, usuario_id: usuario.id })
      setResultado(r.data)
      await onNuevoRegistro()
      setTexto(""); setTema("")
      setMotivacion(MOTIVACIONES[Math.floor(Math.random() * MOTIVACIONES.length)])
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Error al conectar con el servidor")
    }
    setCargando(false)
  }

  return (
    <>
      <div className="page-hdr"><div className="page-greeting">¿Qué aprendiste hoy?</div><div className="page-sub">Escribe con tus propias palabras — la IA detecta los nutrientes automáticamente.</div></div>
      <div className="reg-layout">
        <div className="card reg-main">
          <div className="card-lbl">Nuevo registro</div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(26,24,22,0.35)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 6 }}>Tema del aprendizaje</div>
            <input
              type="text"
              value={tema}
              onChange={e => setTema(e.target.value)}
              placeholder="Ej: Regresión logística, React Hooks, Fotosíntesis…"
              style={{ width: "100%", background: "#F7F4EF", border: "1.5px solid rgba(26,24,22,0.09)", borderRadius: 12, padding: "11px 14px", fontSize: 14, color: "#1A1816", fontFamily: "'Figtree',sans-serif", outline: "none", transition: "border-color .2s, background .2s", boxSizing: "border-box" }}
              onFocus={e => { e.target.style.borderColor = "#8B7FD4"; e.target.style.background = "#fff" }}
              onBlur={e => { e.target.style.borderColor = "rgba(26,24,22,0.09)"; e.target.style.background = "#F7F4EF" }}
            />
          </div>
          <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Ej: Hoy aprendí sobre regresión logística y practiqué con un dataset de Kaggle…" rows={7} />
          <div className="reg-footer">
            <span className="char-count" style={{ color: texto.length > 20 ? "rgba(26,24,22,0.35)" : "rgba(26,24,22,0.2)" }}>{texto.length} caracteres</span>
            <button className="submit-btn" style={{ width: "auto", marginTop: 0, paddingLeft: 20, paddingRight: 20 }} onClick={clasificar} disabled={cargando || !texto.trim()}>{cargando ? <span style={{ opacity: 0.7 }}>Analizando…</span> : <><span>Registrar</span><Icon name="arrow_right" size={14} color="#fff" /></>}</button>
          </div>
          {error && <div className="error-box"><Icon name="warning" size={14} color="#C0523F" />{error}</div>}
          {motivacion && <div className="motivacion"><Icon name="checkCircle" size={14} color="#2D7A5B" />{motivacion}</div>}
          {resultado && (<div className="resultado"><div className="resultado-lbl">Nutrientes detectados</div><div className="tags-row">{resultado.nutrientes.map(n => (<span key={n} className="tag" style={{ color: COLORES[n], borderColor: COLORES[n] + "66", background: COLORES_BG[n] }}><Icon name={NUTRIENTE_ICONS[n]} size={10} color={COLORES[n]} />{n.replace("_", " ")}</span>))}</div><div className="resumen">"{resultado.resumen}"</div></div>)}
        </div>
        <div className="reg-side">
          <div className="card" style={{ marginBottom: 13 }}>
            <div className="card-lbl">Tus nutrientes hoy</div>
            {NUTRIENTES.map((n, i) => (<div className="nut-row" key={n}><div className="nut-icon" style={{ background: COLORES_BG[n] }}><Icon name={NUTRIENTE_ICONS[n]} size={15} color={COLORES[n]} /></div><div className="nut-info"><div className="nut-name">{LABELS[i]}</div><div className="bar-bg"><div className="bar-fill" style={{ width: `${Math.min((balance[n] / (metas[n] || 1)) * 100, 100)}%`, background: COLORES[n] }} /></div></div><div className="nut-count">{balance[n]}</div></div>))}
          </div>
          <div className="reg-hint-card"><div className="reg-hint-icon"><Icon name="lightbulb" size={15} color="#fff" /></div><div><div className="reg-hint-title">Consejo</div><div className="reg-hint-text">Cuanto más detallado sea tu texto, más precisa será la clasificación de la IA.</div></div></div>
        </div>
      </div>
    </>
  )
}
