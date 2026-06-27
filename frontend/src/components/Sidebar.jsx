import Icon from "./Icon"
import { NAV } from "../constants"
import { initials } from "../utils"

export default function Sidebar({ usuario, vista, setVista, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sb-top">
        <div className="sb-logo"><div className="sb-logo-dot" />aprende.ia</div>
        <div className="sb-logo-sub">Diario de aprendizaje</div>
      </div>
      <div className="sb-nav">
        <div className="sb-section">Menú</div>
        {NAV.map(n => (
          <button key={n.id} className={`sb-btn ${vista === n.id ? "active" : ""}`} onClick={() => setVista(n.id)}>
            <Icon name={n.icon} size={15} color="currentColor" />
            {n.label}
          </button>
        ))}
      </div>
      <div className="sb-bottom">
        <div className="sb-divider" />
        <div className="sb-user">
          <div className="sb-avatar">{initials(usuario.nombre)}</div>
          <div className="sb-userinfo">
            <div className="sb-username">{usuario.nombre}</div>
            <div className="sb-userrole">Estudiante</div>
          </div>
          <button className="sb-logout" title="Cerrar sesión" onClick={onLogout}>
            <Icon name="logout" size={14} color="currentColor" />
          </button>
        </div>
      </div>
    </aside>
  )
}
