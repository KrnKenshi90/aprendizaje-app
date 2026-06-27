import { useState } from "react"
import axios from "axios"
import Icon from "../components/Icon"
import { API, COLORES, COLORES_BG } from "../constants"
import { NUTRIENTE_ICONS } from "../components/Icon"

export default function NivelPage({ registros }) {
  const [ncPaso, setNcPaso] = useState("seleccionar")
  const [ncTemaSeleccionado, setNcTemaSeleccionado] = useState(null)
  const [ncMsgs, setNcMsgs] = useState([])
  const [ncInput, setNcInput] = useState("")
  const [ncCargando, setNcCargando] = useState(false)

  const iniciarResumen = async () => {
    if (!ncTemaSeleccionado) return
    setNcCargando(true)
    setNcMsgs([{ rol: "assistant", texto: "⏳ Generando tu resumen personalizado…" }])
    setNcPaso("chat")
    try {
      const r = await axios.post(`${API}/nivel/resumen`, { tema: ncTemaSeleccionado.tema, descripcion: ncTemaSeleccionado.texto })
      setNcMsgs([{ rol: "assistant", texto: r.data.respuesta }])
    } catch {
      setNcMsgs([{ rol: "assistant", texto: "Hubo un error al conectar con la IA. Intenta de nuevo." }])
    }
    setNcCargando(false)
  }

  const enviarMensaje = async (pregunta) => {
    if (!pregunta || ncCargando) return
    setNcInput("")
    const historial = [...ncMsgs, { rol: "user", texto: pregunta }]
    setNcMsgs(historial)
    setNcCargando(true)
    try {
      const r = await axios.post(`${API}/nivel/chat`, { tema: ncTemaSeleccionado?.tema || "", historial })
      setNcMsgs([...historial, { rol: "assistant", texto: r.data.respuesta }])
    } catch {
      setNcMsgs([...historial, { rol: "assistant", texto: "Error al conectar. Intenta de nuevo." }])
    }
    setNcCargando(false)
  }

  const temasUnicos = [...new Map(
    registros.filter(r => r.tema && r.tema.trim()).map(r => [r.tema.trim().toLowerCase(), r])
  ).values()]

  return (
    <>
      <div className="page-hdr">
        <div className="page-greeting">Nivel de comprensión</div>
        <div className="page-sub">Selecciona un tema registrado y la IA te explicará un resumen para que puedas reforzarlo.</div>
      </div>

      {ncPaso === "seleccionar" && (
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="card-lbl">Selecciona el tema que quieres reforzar</div>
          {temasUnicos.length === 0 ? (
            <div className="empty">Aún no tienes registros con tema. Ve a Registrar y escribe el nombre del tema.</div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {temasUnicos.map((r, i) => (
                  <button key={i} onClick={() => setNcTemaSeleccionado(r)}
                    style={{
                      background: ncTemaSeleccionado?.id === r.id ? "#F0EEF9" : "#F7F4EF",
                      border: ncTemaSeleccionado?.id === r.id ? "1.5px solid #8B7FD4" : "1.5px solid rgba(26,24,22,0.09)",
                      borderRadius: 12, padding: "12px 16px", textAlign: "left", cursor: "pointer",
                      fontFamily: "'Figtree',sans-serif", fontSize: 14, color: "#1A1816",
                      display: "flex", alignItems: "center", gap: 10, transition: "all .2s"
                    }}>
                    <span style={{ fontSize: 18 }}>📚</span>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>{r.tema}</div>
                      <div style={{ fontSize: 11, color: "rgba(26,24,22,0.4)" }}>{r.fecha} · {r.nutrientes ? r.nutrientes.split(",").join(", ") : "sin nutrientes"}</div>
                    </div>
                    {ncTemaSeleccionado?.id === r.id && <span style={{ marginLeft: "auto", color: "#8B7FD4", fontSize: 18 }}>✓</span>}
                  </button>
                ))}
              </div>
              <button className="submit-btn" disabled={!ncTemaSeleccionado || ncCargando} onClick={iniciarResumen}>
                {ncCargando ? "Generando…" : <><span>Siguiente</span><Icon name="arrow_right" size={14} color="#fff" /></>}
              </button>
            </>
          )}
        </div>
      )}

      {ncPaso === "chat" && (
        <div className="card" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)", minHeight: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(26,24,22,0.07)" }}>
            <button onClick={() => { setNcPaso("seleccionar"); setNcMsgs([]); setNcTemaSeleccionado(null) }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8B7FD4", fontFamily: "'Figtree',sans-serif", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
              ← Cambiar tema
            </button>
            <span style={{ fontSize: 10, color: "rgba(26,24,22,0.3)", marginLeft: "auto", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              📚 {ncTemaSeleccionado?.tema}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4, marginBottom: 12 }}>
            {ncMsgs.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.rol === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                background: m.rol === "user" ? "#8B7FD4" : "#F7F4EF",
                color: m.rol === "user" ? "#fff" : "#1A1816",
                borderRadius: m.rol === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding: "11px 15px", fontSize: 14, lineHeight: 1.6,
                fontFamily: "'Figtree',sans-serif", whiteSpace: "pre-wrap"
              }}>
                {m.texto}
              </div>
            ))}
            {ncCargando && (
              <div style={{ alignSelf: "flex-start", background: "#F7F4EF", borderRadius: "16px 16px 16px 4px", padding: "11px 15px", fontSize: 14, color: "rgba(26,24,22,0.4)", fontFamily: "'Figtree',sans-serif" }}>
                Escribiendo…
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="chat-input"
              value={ncInput}
              onChange={e => setNcInput(e.target.value)}
              placeholder="Escribe tu pregunta sobre el tema…"
              onKeyDown={e => { if (e.key === "Enter" && ncInput.trim()) enviarMensaje(ncInput.trim()) }}
            />
            <button className="submit-btn" style={{ width: "auto", marginTop: 0, paddingLeft: 16, paddingRight: 16, flexShrink: 0 }}
              disabled={!ncInput.trim() || ncCargando}
              onClick={() => enviarMensaje(ncInput.trim())}>
              <Icon name="send" size={14} color="#fff" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
