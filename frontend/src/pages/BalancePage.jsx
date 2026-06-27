import { useState } from "react"
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js"
import { Radar } from "react-chartjs-2"
import Icon, { NUTRIENTE_ICONS } from "../components/Icon"
import { NUTRIENTES, LABELS, COLORES, COLORES_BG } from "../constants"

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

export default function BalancePage({ registros, balance, metas, setMetas, masDebil, setVista }) {
  const [editandoMetas, setEditandoMetas] = useState(false)

  const radarData = {
    labels: LABELS,
    datasets: [{ label: "Tu balance", data: NUTRIENTES.map(n => balance[n]), backgroundColor: "rgba(139,127,212,0.1)", borderColor: "#8B7FD4", borderWidth: 2, pointBackgroundColor: "#8B7FD4", pointRadius: 4 }]
  }
  const radarOpts = {
    scales: { r: { beginAtZero: true, ticks: { stepSize: 1, color: "#9CA3AF", font: { size: 10 } }, grid: { color: "rgba(26,24,22,0.07)" }, angleLines: { color: "rgba(26,24,22,0.07)" }, pointLabels: { color: "#6B7280", font: { size: 11, family: "Figtree" } } } },
    plugins: { legend: { display: false } }
  }

  return (
    <>
      <div className="page-hdr"><div className="page-greeting">Balance de nutrientes</div><div className="page-sub">Visualiza el equilibrio de tu aprendizaje y ajusta tus metas.</div></div>
      {registros.length > 0 && (<div className="g4" style={{ marginBottom: 14 }}>{NUTRIENTES.map((n, i) => (<div className="stat-card" key={n}><div className="stat-top"><div className="stat-ico-wrap" style={{ background: COLORES_BG[n] }}><Icon name={NUTRIENTE_ICONS[n]} size={17} color={COLORES[n]} /></div><span className={`stat-badge ${balance[n] >= (metas[n] || 1) ? "up" : "neutral"}`}>{balance[n] >= (metas[n] || 1) ? "meta ✓" : `${Math.round((balance[n] / (metas[n] || 1)) * 100)}%`}</span></div><div className="stat-val" style={{ fontSize: 26 }}>{balance[n]}</div><div className="stat-lbl">{LABELS[i]}</div></div>))}</div>)}
      <div className="g2">
        <div className="card"><div className="card-lbl">Gráfico radar</div><div className="radar-wrap"><Radar data={radarData} options={radarOpts} /></div></div>
        <div className="card">
          <div className="metas-hdr"><div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(26,24,22,0.36)", textTransform: "uppercase", letterSpacing: "0.09em" }}>Progreso hacia metas</div><button className="edit-btn" onClick={() => setEditandoMetas(!editandoMetas)}><Icon name="edit" size={12} color="#8B7FD4" />{editandoMetas ? "Guardar" : "Editar metas"}</button></div>
          <div className="meta-grid">{NUTRIENTES.map((n, i) => { const pct = Math.min((balance[n] / (metas[n] || 1)) * 100, 100); return (<div className="meta-item" key={n}><div className="meta-top"><div className="meta-icon" style={{ background: COLORES_BG[n] }}><Icon name={NUTRIENTE_ICONS[n]} size={13} color={COLORES[n]} /></div><span className="meta-name">{LABELS[i]}</span><span className="meta-count">{balance[n]}</span>{editandoMetas && <input className="meta-inp" type="number" min={1} max={50} value={metas[n]} onChange={e => setMetas({ ...metas, [n]: parseInt(e.target.value) || 1 })} />}</div><div className="bar-bg2"><div className="meta-bar" style={{ width: `${pct}%`, background: COLORES[n] }} /></div>{!editandoMetas && <div className="meta-foot">{balance[n]} de {metas[n]}</div>}</div>) })}</div>
        </div>
      </div>
      {registros.length > 0 && (<div className="recom"><div className="recom-icon"><Icon name="lightbulb" size={16} color="#fff" /></div><div><div className="recom-title">Recomendación</div><div className="recom-text">Tu área más débil es <strong style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name={NUTRIENTE_ICONS[masDebil]} size={12} color={COLORES[masDebil]} />{masDebil.replace("_", " ")}</strong> con {balance[masDebil]} entrada(s). Enfócate ahí esta semana.</div></div></div>)}
      {registros.length === 0 && (<div className="card" style={{ textAlign: "center", padding: "40px 20px" }}><div style={{ fontSize: 32, marginBottom: 10 }}>📊</div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Aún no hay datos</div><div style={{ fontSize: 13, color: "rgba(26,24,22,0.42)", marginBottom: 16 }}>Registra tu primer aprendizaje para ver el balance.</div><button className="submit-btn" style={{ width: "auto", margin: "0 auto", paddingLeft: 20, paddingRight: 20 }} onClick={() => setVista("registro")}><span>Registrar aprendizaje</span><Icon name="arrow_right" size={14} color="#fff" /></button></div>)}
    </>
  )
}
