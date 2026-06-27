import { useState } from "react"
import axios from "axios"
import Icon, { NUTRIENTE_ICONS } from "../components/Icon"
import { API, NUTRIENTES, LABELS, COLORES, COLORES_BG, MOTIVACIONES } from "../constants"
import { greeting, weekDays } from "../utils"

export default function InicioPage({ usuario, registros, balance, racha, metas, metasCumplidas, balancePct, masDebil, setVista, onNuevoRegistro }) {
  const [texto, setTexto] = useState("")
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [motivacion, setMotivacion] = useState(null)

  const dias = weekDays()
  const fechasSet = new Set(registros.map(r => r.fecha))

  const clasificar = async () => {
    if (!texto.trim()) return
    setCargando(true); setError(null); setMotivacion(null)
    try {
      const r = await axios.post(`${API}/clasificar`, { texto, tema: "", usuario_id: usuario.id })
      setResultado(r.data)
      await onNuevoRegistro()
      setTexto("")
      setMotivacion(MOTIVACIONES[Math.floor(Math.random() * MOTIVACIONES.length)])
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Error al conectar con el servidor")
    }
    setCargando(false)
  }

  return (
    <>
      <div className="page-hdr">
        <div className="page-greeting">{greeting()}, {usuario.nombre.split(" ")[0]}</div>
        <div className="page-sub">{racha > 1 ? `Llevas ${racha} días aprendiendo sin parar. ¡Increíble!` : "¡Bienvenido! Registra tu primer aprendizaje de hoy."}</div>
      </div>
      <div className="g4">
        <div className="stat-card"><div className="stat-top"><div className="stat-ico-wrap" style={{ background: "#F0EEF9" }}><Icon name="books" size={17} color="#8B7FD4" /></div><span className="stat-badge neutral">total</span></div><div className="stat-val">{registros.length}</div><div className="stat-lbl">Registros</div></div>
        <div className="stat-card"><div className="stat-top"><div className="stat-ico-wrap" style={{ background: "#EBF7F2" }}><Icon name="target" size={17} color="#5DB896" /></div><span className={`stat-badge ${metasCumplidas >= 3 ? "up" : "neutral"}`}>{metasCumplidas >= 3 ? "buen ritmo" : "en progreso"}</span></div><div className="stat-val">{metasCumplidas}<span style={{ fontSize: 14, fontWeight: 500, color: "rgba(26,24,22,0.50)" }}>/5</span></div><div className="stat-lbl">Metas cumplidas</div></div>
        <div className="stat-card"><div className="stat-top"><div className="stat-ico-wrap" style={{ background: "#FBF4E3" }}><Icon name="zap" size={17} color="#DCA84A" /></div><span className={`stat-badge ${balancePct >= 60 ? "up" : balancePct >= 30 ? "neutral" : "warn"}`}>{balancePct >= 60 ? "saludable" : balancePct >= 30 ? "estable" : "mejorar"}</span></div><div className="stat-val">{balancePct}<span style={{ fontSize: 14, fontWeight: 500, color: "rgba(26,24,22,0.28)" }}>%</span></div><div className="stat-lbl">Balance general</div></div>
        <div className="stat-card"><div className="stat-top"><div className="stat-ico-wrap" style={{ background: COLORES_BG[masDebil] }}><Icon name={NUTRIENTE_ICONS[masDebil]} size={17} color={COLORES[masDebil]} /></div><span className="stat-badge warn">débil</span></div><div className="stat-val">{balance[masDebil]}</div><div className="stat-lbl">{masDebil.replace("_", " ").toLowerCase()}</div></div>
      </div>
      {racha > 0 ? (
        <div className="g2-1">
          <div className="card">
            <div className="card-lbl">Actividad esta semana</div>
            <div className="week-row">{dias.map((d, i) => { const isToday = d.date.toDateString() === new Date().toDateString(); const ds = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, "0")}-${String(d.date.getDate()).padStart(2, "0")}`; const hasReg = fechasSet.has(ds); return (<div key={i} className={`day-box ${hasReg ? "active" : isToday ? "today" : "empty"}`}><div className="day-dot" /><span className="dn">{d.num}</span><span className="dl">{d.letter}</span></div>) })}</div>
          </div>
          <div className="racha-card"><div className="racha-l"><div className="racha-icon-wrap"><Icon name="flame" size={20} color="#DCA84A" /></div><div><div className="racha-title">Racha activa</div><div className="racha-sub">{registros[0]?.fecha || "hoy"}</div></div></div><div><div className="racha-num">{racha}</div><div className="racha-unit">días</div></div></div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-lbl">Actividad esta semana</div>
          <div className="week-row">{dias.map((d, i) => { const isToday = d.date.toDateString() === new Date().toDateString(); const ds = `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, "0")}-${String(d.date.getDate()).padStart(2, "0")}`; const hasReg = fechasSet.has(ds); return (<div key={i} className={`day-box ${hasReg ? "active" : isToday ? "today" : "empty"}`}><div className="day-dot" /><span className="dn">{d.num}</span><span className="dl">{d.letter}</span></div>) })}</div>
        </div>
      )}
      <div className="g2">
        <div className="card">
          <div className="card-lbl">Nutrientes<button className="card-link" onClick={() => setVista("balance")}>Ver gráfico <Icon name="arrow_right" size={11} color="#8B7FD4" /></button></div>
          {NUTRIENTES.map((n, i) => (<div className="nut-row" key={n}><div className="nut-icon" style={{ background: COLORES_BG[n] }}><Icon name={NUTRIENTE_ICONS[n]} size={15} color={COLORES[n]} /></div><div className="nut-info"><div className="nut-name">{LABELS[i]}</div><div className="bar-bg"><div className="bar-fill" style={{ width: `${Math.min((balance[n] / (metas[n] || 1)) * 100, 100)}%`, background: COLORES[n] }} /></div></div><div className="nut-count">{balance[n]}</div></div>))}
        </div>
        <div className="card">
          <div className="card-lbl">Registro rápido</div>
          <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="¿Qué aprendiste hoy? Escribe libremente…" rows={5} />
          <button className="submit-btn" onClick={clasificar} disabled={cargando || !texto.trim()}>{cargando ? <><span style={{ opacity: 0.7 }}>Analizando con IA…</span></> : <><span>Registrar aprendizaje</span><Icon name="arrow_right" size={14} color="#fff" /></>}</button>
          {error && <div className="error-box"><Icon name="warning" size={14} color="#C0523F" />{error}</div>}
          {motivacion && <div className="motivacion"><Icon name="checkCircle" size={14} color="#2D7A5B" />{motivacion}</div>}
          {resultado && (<div className="resultado"><div className="resultado-lbl">Nutrientes detectados</div><div className="tags-row">{resultado.nutrientes.map(n => (<span key={n} className="tag" style={{ color: COLORES[n], borderColor: COLORES[n] + "66", background: COLORES_BG[n] }}><Icon name={NUTRIENTE_ICONS[n]} size={10} color={COLORES[n]} />{n.replace("_", " ")}</span>))}</div><div className="resumen">"{resultado.resumen}"</div></div>)}
        </div>
      </div>
      {registros.length > 0 && (<div className="recom"><div className="recom-icon"><Icon name="lightbulb" size={16} color="#fff" /></div><div><div className="recom-title">Recomendación de la semana</div><div className="recom-text">Tu área más débil es <strong style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name={NUTRIENTE_ICONS[masDebil]} size={12} color={COLORES[masDebil]} />{masDebil.replace("_", " ")}</strong> con solo {balance[masDebil]} entrada(s). Esta semana intenta enfocarte más en esa área.</div></div></div>)}
      <div className="card"><div className="card-lbl">Últimos aprendizajes<button className="card-link" onClick={() => setVista("historial")}>Ver todos <Icon name="arrow_right" size={11} color="#8B7FD4" /></button></div>{registros.length === 0 ? <div className="empty">Aún no hay registros</div> : registros.slice(0, 3).map((r, i) => (<div className="entry" key={i}><div className="entry-top"><span className="entry-date"><Icon name="calendar" size={11} color="rgba(26,24,22,0.55)" />{r.fecha || "Hoy"}</span><div className="entry-tags">{r.nutrientes && r.nutrientes.split(",").map(n => (<span key={n} className="tag" style={{ color: COLORES[n], borderColor: COLORES[n] + "66", background: COLORES_BG[n] }}><Icon name={NUTRIENTE_ICONS[n]} size={9} color={COLORES[n]} />{n.replace("_", " ")}</span>))}</div></div><div className="entry-text">"{r.texto}"</div></div>))}</div>
    </>
  )
}
