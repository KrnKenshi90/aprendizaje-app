import { useState, useEffect } from "react"
import axios from "axios"
import Icon from "./components/Icon"
import Sidebar from "./components/Sidebar"
import AuthPage from "./pages/AuthPage"
import InicioPage from "./pages/InicioPage"
import RegistroPage from "./pages/RegistroPage"
import EstudiarPage from "./pages/EstudiarPage"
import BalancePage from "./pages/BalancePage"
import HistorialPage from "./pages/HistorialPage"
import MetasPage from "./pages/MetasPage"
import NivelPage from "./pages/NivelPage"
import Quiz from "./Quiz"
import { API, NUTRIENTES, METAS_DEFAULT } from "./constants"

const PAGE_TITLE = {
  inicio: "Dashboard", registro: "Registrar aprendizaje", estudiar: "Estudiar con PDF",
  balance: "Balance de nutrientes", historial: "Historial", quiz: "Mi Quiz",
  metas: "Metas Semanales", nivel: "Nivel de comprensión",
}

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem("usuario_session")) || null }
    catch { return null }
  })
  const [vista, setVista] = useState("inicio")
  const [registros, setRegistros] = useState([])
  const [errorCarga, setErrorCarga] = useState(null)
  const [metas, setMetas] = useState(() => {
    try { return JSON.parse(localStorage.getItem("metas_aprendizaje")) || METAS_DEFAULT }
    catch { return METAS_DEFAULT }
  })

  useEffect(() => {
    if (usuario) localStorage.setItem("usuario_session", JSON.stringify(usuario))
    else localStorage.removeItem("usuario_session")
  }, [usuario])

  useEffect(() => {
    localStorage.setItem("metas_aprendizaje", JSON.stringify(metas))
  }, [metas])

  useEffect(() => {
    if (usuario) cargarRegistros()
  }, [usuario])

  const cargarRegistros = async () => {
    try {
      const r = await axios.get(`${API}/registros/${usuario.id}`)
      setRegistros(r.data)
      setErrorCarga(null)
    } catch (e) {
      setErrorCarga("No se pudieron cargar tus registros. Verifica que el servidor esté activo.")
    }
  }

  const eliminar = async (id) => {
    try {
      await axios.delete(`${API}/registros/${id}`, { params: { usuario_id: usuario.id } })
      await cargarRegistros()
    } catch (e) {
      setErrorCarga(e.response?.data?.detail || "Error al eliminar el registro")
    }
  }

  const calcularBalance = () => {
    const c = {}; NUTRIENTES.forEach(n => c[n] = 0)
    registros.forEach(r => { if (r.nutrientes) r.nutrientes.split(",").forEach(n => { if (c[n] !== undefined) c[n]++ }) })
    return c
  }

  const calcularRacha = () => {
    if (!registros.length) return 0
    const fechas = [...new Set(registros.map(r => r.fecha))].sort().reverse()
    let r = 1
    for (let i = 0; i < fechas.length - 1; i++) {
      const d = (new Date(fechas[i]) - new Date(fechas[i + 1])) / 86400000
      if (d === 1) r++; else break
    }
    return r
  }

  const balance = calcularBalance()
  const racha = calcularRacha()
  const masDebil = NUTRIENTES.reduce((a, b) => balance[a] <= balance[b] ? a : b)
  const metasCumplidas = NUTRIENTES.filter(n => balance[n] >= (metas[n] || 1)).length
  const balancePct = Math.round((NUTRIENTES.reduce((s, n) => s + Math.min(balance[n] / (metas[n] || 1), 1), 0) / 5) * 100)

  const logout = () => setUsuario(null)

  if (!usuario) return (
    <>
<AuthPage onLogin={setUsuario} />
    </>
  )

  const renderPage = () => {
    switch (vista) {
      case "inicio":    return <InicioPage usuario={usuario} registros={registros} balance={balance} racha={racha} metas={metas} metasCumplidas={metasCumplidas} balancePct={balancePct} masDebil={masDebil} setVista={setVista} onNuevoRegistro={cargarRegistros} />
      case "registro":  return <RegistroPage usuario={usuario} balance={balance} metas={metas} onNuevoRegistro={cargarRegistros} />
      case "estudiar":  return <EstudiarPage />
      case "balance":   return <BalancePage registros={registros} balance={balance} metas={metas} setMetas={setMetas} masDebil={masDebil} setVista={setVista} />
      case "historial": return <HistorialPage registros={registros} eliminar={eliminar} />
      case "metas":     return <MetasPage usuario={usuario} />
      case "nivel":     return <NivelPage registros={registros} />
      case "quiz":      return <Quiz usuario={usuario} />
      default:          return null
    }
  }

  return (
    <>
<div className="shell">
        <Sidebar usuario={usuario} vista={vista} setVista={setVista} onLogout={logout} />
        <div className="main">
          <div className="topbar">
            <div className="tb-left"><span className="tb-title">{PAGE_TITLE[vista]}</span></div>
            <div className="tb-right">
              <span className="tb-date">
                <Icon name="calendar" size={13} color="rgba(26,24,22,0.35)" />
                {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
              </span>
              {racha > 1 && (<div className="racha-pill"><Icon name="flame" size={13} color="#DCA84A" />{racha} días seguidos</div>)}
            </div>
          </div>
          {errorCarga && (
            <div style={{ background: "#FCF0EE", borderBottom: "1px solid rgba(224,123,106,0.28)", padding: "8px 28px", fontSize: 13, color: "#C0523F", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>⚠ {errorCarga}</span>
              <button onClick={() => setErrorCarga(null)} style={{ background: "none", border: "none", color: "#C0523F", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          )}
          <div className="content">
            {renderPage()}
          </div>
        </div>
      </div>
    </>
  )
}
