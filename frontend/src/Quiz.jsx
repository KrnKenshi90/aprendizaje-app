import { useState, useEffect } from "react"
import axios from "axios"

const API = "http://localhost:8000"

const CSS_QUIZ = `
.quiz-shell { max-width: 720px; margin: 0 auto; }
.quiz-header { margin-bottom: 24px; }
.quiz-title { font-family: 'Figtree', sans-serif; font-style: italic; font-size: 26px; font-weight: 700; color: #1A1816; margin-bottom: 4px; }
.quiz-sub { font-size: 13px; color: rgba(26,24,22,0.42); margin-bottom: 20px; }
.quiz-config { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.quiz-config-btn { padding: 7px 16px; border-radius: 20px; border: 1.5px solid rgba(26,24,22,0.1); background: #fff; color: rgba(26,24,22,0.5); font-size: 12px; font-family: 'Figtree', sans-serif; font-weight: 600; cursor: pointer; transition: all .2s; }
.quiz-config-btn.active { background: #1A1816; border-color: #1A1816; color: #fff; }
.quiz-start-card { background: #1A1816; border-radius: 20px; padding: 32px; text-align: center; margin-bottom: 16px; }
.quiz-start-icon { font-size: 52px; margin-bottom: 16px; }
.quiz-start-title { font-family: 'Figtree', sans-serif; font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 8px; }
.quiz-start-sub { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 24px; line-height: 1.6; }
.quiz-start-btn { background: #8B7FD4; border: none; border-radius: 12px; padding: 14px 32px; color: #fff; font-family: 'Figtree', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; transition: background .2s; display: inline-flex; align-items: center; gap: 8px; }
.quiz-start-btn:hover { background: #7668C0; }
.quiz-start-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.quiz-progress { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.quiz-progress-bar { flex: 1; height: 6px; background: rgba(26,24,22,0.08); border-radius: 3px; }
.quiz-progress-fill { height: 6px; border-radius: 3px; background: #8B7FD4; transition: width .4s ease; }
.quiz-progress-text { font-size: 12px; font-weight: 600; color: rgba(26,24,22,0.4); white-space: nowrap; }
.quiz-card { background: #fff; border: 1px solid rgba(26,24,22,0.07); border-radius: 18px; padding: 24px; margin-bottom: 14px; animation: fadeUp .3s ease; }
.quiz-tipo-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 20px; margin-bottom: 14px; }
.quiz-tipo-multiple { background: #F0EEF9; color: #6857B8; }
.quiz-tipo-completar { background: #EBF7F2; color: #2D7A5B; }
.quiz-pregunta { font-size: 16px; font-weight: 600; color: #1A1816; line-height: 1.55; margin-bottom: 18px; }
.quiz-pregunta .blank { display: inline-block; min-width: 100px; border-bottom: 2px solid #8B7FD4; margin: 0 6px; color: transparent; }
.quiz-opciones { display: flex; flex-direction: column; gap: 8px; }
.quiz-opcion { background: #F7F4EF; border: 1.5px solid rgba(26,24,22,0.08); border-radius: 12px; padding: 12px 16px; font-size: 14px; color: #1A1816; cursor: pointer; text-align: left; font-family: 'Figtree', sans-serif; transition: all .18s; width: 100%; display: flex; align-items: center; gap: 12px; }
.quiz-opcion:hover:not(:disabled) { background: #F0EEF9; border-color: #8B7FD4; }
.quiz-opcion.correcta { background: #EBF7F2; border-color: #5DB896; color: #1A1816; }
.quiz-opcion.incorrecta { background: #FCF0EE; border-color: #E07B6A; color: #1A1816; }
.quiz-opcion:disabled { cursor: default; }
.quiz-opcion-letra { width: 28px; height: 28px; border-radius: 8px; background: rgba(26,24,22,0.06); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; transition: all .18s; }
.quiz-opcion.correcta .quiz-opcion-letra { background: #5DB896; color: #fff; }
.quiz-opcion.incorrecta .quiz-opcion-letra { background: #E07B6A; color: #fff; }
.quiz-completar-opciones { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.quiz-completar-opcion { background: #F7F4EF; border: 1.5px solid rgba(26,24,22,0.08); border-radius: 12px; padding: 11px 16px; font-size: 14px; color: #1A1816; cursor: pointer; text-align: center; font-family: 'Figtree', sans-serif; transition: all .18s; width: 100%; font-weight: 500; }
.quiz-completar-opcion:hover:not(:disabled) { background: #EBF7F2; border-color: #5DB896; }
.quiz-completar-opcion.correcta { background: #EBF7F2; border-color: #5DB896; color: #2D7A5B; font-weight: 700; }
.quiz-completar-opcion.incorrecta { background: #FCF0EE; border-color: #E07B6A; color: #C0523F; }
.quiz-completar-opcion:disabled { cursor: default; }
.quiz-explicacion { margin-top: 14px; background: #F7F4EF; border-radius: 12px; padding: 13px 16px; font-size: 13px; color: rgba(26,24,22,0.65); line-height: 1.65; animation: fadeUp .3s ease; border-left: 3px solid #8B7FD4; }
.quiz-explicacion strong { color: #1A1816; display: block; margin-bottom: 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
.quiz-nav { display: flex; justify-content: flex-end; margin-top: 16px; }
.quiz-next-btn { background: #8B7FD4; border: none; border-radius: 12px; padding: 12px 24px; color: #fff; font-family: 'Figtree', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .2s; display: flex; align-items: center; gap: 8px; }
.quiz-next-btn:hover { background: #7668C0; }

/* RESULTADO */
.quiz-resultado { border-radius: 20px; padding: 36px; text-align: center; animation: fadeUp .4s ease; }
.quiz-resultado-icon { font-size: 64px; margin-bottom: 12px; }
.quiz-resultado-score { font-family: 'Figtree', sans-serif; font-size: 72px; font-weight: 700; line-height: 1; margin-bottom: 6px; }
.quiz-resultado-fraction { font-size: 20px; font-weight: 500; margin-bottom: 8px; opacity: 0.6; }
.quiz-resultado-label { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
.quiz-resultado-sub { font-size: 14px; line-height: 1.6; margin-bottom: 28px; opacity: 0.6; }
.quiz-resultado-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.quiz-btn-reintentar { border: none; border-radius: 12px; padding: 13px 28px; color: #fff; font-family: 'Figtree', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .2s; }
.quiz-btn-historial { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); border-radius: 12px; padding: 13px 24px; color: rgba(255,255,255,0.7); font-family: 'Figtree', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .2s; }
.quiz-btn-historial:hover { background: rgba(255,255,255,0.18); }

/* BARRA DE CALIFICACION */
.quiz-calif-bar { width: 100%; height: 12px; border-radius: 6px; background: rgba(255,255,255,0.12); margin: 16px 0 24px; overflow: hidden; }
.quiz-calif-fill { height: 12px; border-radius: 6px; transition: width 1s ease; }

/* HISTORIAL */
.quiz-historial-card { background: #fff; border: 1px solid rgba(26,24,22,0.07); border-radius: 16px; padding: 20px; margin-top: 16px; }
.quiz-hist-title { font-size: 11px; font-weight: 700; color: rgba(26,24,22,0.36); text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 16px; }
.quiz-hist-items { display: flex; flex-direction: column; gap: 10px; }
.quiz-hist-item { display: flex; align-items: center; gap: 12px; }
.quiz-hist-fecha { font-size: 11px; color: rgba(26,24,22,0.4); min-width: 88px; }
.quiz-hist-bar-wrap { flex: 1; }
.quiz-hist-bar-bg { height: 8px; background: #F7F4EF; border-radius: 4px; }
.quiz-hist-bar { height: 8px; border-radius: 4px; transition: width .6s ease; }
.quiz-hist-pct { font-size: 13px; font-weight: 700; min-width: 40px; text-align: right; }
.quiz-hist-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; min-width: 60px; text-align: center; }

/* LOADING */
.quiz-loading { text-align: center; padding: 60px 20px; }
.quiz-loading-icon { font-size: 40px; margin-bottom: 16px; animation: pulse 1.5s infinite; }
.quiz-loading-text { font-size: 15px; font-weight: 600; color: #1A1816; margin-bottom: 6px; }
.quiz-loading-sub { font-size: 13px; color: rgba(26,24,22,0.42); }

/* RESUMEN FINAL */
.quiz-resumen { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; text-align: left; }
.quiz-resumen-item { background: rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; }
.quiz-resumen-num { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); min-width: 24px; }
.quiz-resumen-texto { font-size: 13px; color: rgba(255,255,255,0.7); flex: 1; line-height: 1.5; }
.quiz-resumen-icon { font-size: 18px; flex-shrink: 0; }

@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
`

const CALIFICACIONES = [
    { min: 90, color: "#5DB896", bg: "#0D3D2A", btnBg: "#5DB896", label: "¡Excelente! 🏆", sub: "Dominas completamente el tema. ¡Eres increíble!", icon: "🌟" },
    { min: 70, color: "#8B7FD4", bg: "#1E1A3A", btnBg: "#8B7FD4", label: "¡Muy bien! 🎯", sub: "Tienes una base sólida. Repasa los errores y estarás perfecto.", icon: "💪" },
    { min: 50, color: "#DCA84A", bg: "#3D2E0A", btnBg: "#DCA84A", label: "Buen intento 📚", sub: "La mitad está bien. Vuelve a repasar los temas que fallaste.", icon: "⚡" },
    { min: 0, color: "#E07B6A", bg: "#3D1A14", btnBg: "#E07B6A", label: "Necesitas repasar 🔥", sub: "No te rindas. Registra más aprendizajes y vuelve a intentarlo.", icon: "📖" },
]

function getCalif(pct) {
    return CALIFICACIONES.find(c => pct >= c.min) || CALIFICACIONES[3]
}

function getHistColor(pct) {
    if (pct >= 90) return { color: "#5DB896", bg: "#EBF7F2", label: "Excelente" }
    if (pct >= 70) return { color: "#8B7FD4", bg: "#F0EEF9", label: "Muy bien" }
    if (pct >= 50) return { color: "#DCA84A", bg: "#FBF4E3", label: "Regular" }
    return { color: "#E07B6A", bg: "#FCF0EE", label: "Bajo" }
}

export default function Quiz({ usuario }) {
    const [estado, setEstado] = useState("inicio")
    const [cantPreguntas, setCantPreguntas] = useState(10)
    const [preguntas, setPreguntas] = useState([])
    const [indice, setIndice] = useState(0)
    const [respuestas, setRespuestas] = useState({})
    const [respondida, setRespondida] = useState(false)
    const [puntaje, setPuntaje] = useState(0)
    const [historial, setHistorial] = useState([])
    const [guardando, setGuardando] = useState(false)

    useEffect(() => { cargarHistorial() }, [])

    const cargarHistorial = async () => {
        try {
            const r = await axios.get(`${API}/quiz/historial/${usuario.id}`)
            setHistorial(r.data)
        } catch (e) { console.error(e) }
    }

    const iniciarQuiz = async () => {
        setEstado("cargando")
        setIndice(0)
        setRespuestas({})
        setRespondida(false)
        setPuntaje(0)
        try {
            const r = await axios.post(`${API}/quiz/generar`, {
                usuario_id: usuario.id,
                cantidad: cantPreguntas
            })
            setPreguntas(r.data.preguntas || [])
            setEstado("jugando")
        } catch (e) {
            setEstado("inicio")
            alert("Error generando el quiz. Intenta de nuevo.")
        }
    }

    const responderOpcion = (oi) => {
        if (respondida) return
        const pregunta = preguntas[indice]
        const esCorrecta = oi === pregunta.correcta
        setRespuestas(prev => ({ ...prev, [indice]: { elegida: oi, correcta: esCorrecta } }))
        if (esCorrecta) setPuntaje(p => p + 1)
        setRespondida(true)
    }

    const siguiente = async () => {
        const sig = indice + 1
        if (sig >= preguntas.length) {
            setEstado("resultado")
            setGuardando(true)
            try {
                await axios.post(`${API}/quiz/guardar`, {
                    usuario_id: usuario.id,
                    puntaje,
                    total: preguntas.length
                })
                await cargarHistorial()
            } catch (e) { console.error(e) }
            setGuardando(false)
        } else {
            setIndice(sig)
            setRespondida(false)
        }
    }

    const preguntaActual = preguntas[indice]
    const pct = preguntas.length > 0 ? Math.round((puntaje / preguntas.length) * 100) : 0
    const calif = getCalif(pct)

    const renderPreguntaTexto = (texto) => {
        if (!texto.includes("___")) return texto
        const partes = texto.split("___")
        return (
            <span>
                {partes[0]}
                <span className="blank" style={{
                    display: "inline-block",
                    minWidth: 120,
                    borderBottom: "2px solid #8B7FD4",
                    margin: "0 6px",
                    verticalAlign: "bottom"
                }}>&nbsp;</span>
                {partes.slice(1).join("")}
            </span>
        )
    }

    return (
        <>
            <style>{CSS_QUIZ}</style>
            <div className="quiz-shell">
                <div className="quiz-header">
                    <div className="quiz-title">Quiz de conocimiento</div>
                    <div className="quiz-sub">La IA genera preguntas personalizadas basadas en lo que has aprendido.</div>
                </div>

                {/* INICIO */}
                {estado === "inicio" && (
                    <>
                        <div className="quiz-start-card">
                            <div className="quiz-start-icon">🧠</div>
                            <div className="quiz-start-title">¿Listo para ponerte a prueba?</div>
                            <div className="quiz-start-sub">
                                La IA analizará tus aprendizajes y generará preguntas personalizadas.<br />
                                Mezcla opción múltiple y completar espacios con alternativas.
                            </div>

                            {/* Selector de cantidad */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                                    Cantidad de preguntas
                                </div>
                                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                                    {[5, 10, 15, 20].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setCantPreguntas(n)}
                                            style={{
                                                padding: "8px 18px",
                                                borderRadius: 20,
                                                border: cantPreguntas === n ? "2px solid #8B7FD4" : "2px solid rgba(255,255,255,0.1)",
                                                background: cantPreguntas === n ? "#8B7FD4" : "rgba(255,255,255,0.05)",
                                                color: cantPreguntas === n ? "#fff" : "rgba(255,255,255,0.4)",
                                                fontFamily: "'Figtree', sans-serif",
                                                fontSize: 13,
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                transition: "all .2s"
                                            }}
                                        >{n}</button>
                                    ))}
                                </div>
                            </div>

                            <button className="quiz-start-btn" onClick={iniciarQuiz}>
                                🚀 Comenzar {cantPreguntas} preguntas
                            </button>
                        </div>

                        {/* Historial */}
                        {historial.length > 0 && (
                            <div className="quiz-historial-card">
                                <div className="quiz-hist-title">Tu historial de quizzes</div>
                                <div className="quiz-hist-items">
                                    {historial.slice(0, 10).map((h, i) => {
                                        const hc = getHistColor(h.porcentaje)
                                        return (
                                            <div className="quiz-hist-item" key={i}>
                                                <span className="quiz-hist-fecha">{h.fecha} · {h.puntaje}/{h.total}</span>
                                                <div className="quiz-hist-bar-wrap">
                                                    <div className="quiz-hist-bar-bg">
                                                        <div className="quiz-hist-bar" style={{ width: `${h.porcentaje}%`, background: hc.color }} />
                                                    </div>
                                                </div>
                                                <span className="quiz-hist-pct" style={{ color: hc.color }}>{h.porcentaje}%</span>
                                                <span className="quiz-hist-badge" style={{ color: hc.color, background: hc.bg }}>{hc.label}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* CARGANDO */}
                {estado === "cargando" && (
                    <div className="quiz-card quiz-loading">
                        <div className="quiz-loading-icon">🤖</div>
                        <div className="quiz-loading-text">La IA está preparando {cantPreguntas} preguntas…</div>
                        <div className="quiz-loading-sub">Analizando tus aprendizajes para crear preguntas personalizadas</div>
                    </div>
                )}

                {/* JUGANDO */}
                {estado === "jugando" && preguntaActual && (
                    <>
                        <div className="quiz-progress">
                            <div className="quiz-progress-bar">
                                <div className="quiz-progress-fill" style={{ width: `${(indice / preguntas.length) * 100}%` }} />
                            </div>
                            <span className="quiz-progress-text">Pregunta {indice + 1} de {preguntas.length}</span>
                        </div>

                        {/* Mini puntaje */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10, gap: 12 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#5DB896" }}>✓ {puntaje} correctas</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#E07B6A" }}>✗ {indice - puntaje + (respondida && !respuestas[indice]?.correcta ? 0 : 0)} incorrectas</span>
                        </div>

                        <div className="quiz-card">
                            <span className={`quiz-tipo-badge ${preguntaActual.tipo === "opcion_multiple" ? "quiz-tipo-multiple" : "quiz-tipo-completar"}`}>
                                {preguntaActual.tipo === "opcion_multiple" ? "📋 Opción múltiple" : "✏️ Completar el espacio"}
                            </span>

                            <div className="quiz-pregunta">
                                {renderPreguntaTexto(preguntaActual.pregunta)}
                            </div>

                            {/* Opción múltiple */}
                            {preguntaActual.tipo === "opcion_multiple" && (
                                <div className="quiz-opciones">
                                    {preguntaActual.opciones.map((op, oi) => {
                                        const resp = respuestas[indice]
                                        let cls = "quiz-opcion"
                                        if (respondida) {
                                            if (oi === preguntaActual.correcta) cls += " correcta"
                                            else if (resp?.elegida === oi) cls += " incorrecta"
                                        }
                                        return (
                                            <button key={oi} className={cls} onClick={() => responderOpcion(oi)} disabled={respondida}>
                                                <span className="quiz-opcion-letra">{["A", "B", "C", "D"][oi]}</span>
                                                {op}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Completar con alternativas */}
                            {preguntaActual.tipo === "completar" && (
                                <div className="quiz-completar-opciones">
                                    {preguntaActual.opciones.map((op, oi) => {
                                        const resp = respuestas[indice]
                                        let cls = "quiz-completar-opcion"
                                        if (respondida) {
                                            if (oi === preguntaActual.correcta) cls += " correcta"
                                            else if (resp?.elegida === oi) cls += " incorrecta"
                                        }
                                        return (
                                            <button key={oi} className={cls} onClick={() => responderOpcion(oi)} disabled={respondida}>
                                                {op}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Explicación */}
                            {respondida && (
                                <div className="quiz-explicacion">
                                    <strong>{respuestas[indice]?.correcta ? "✅ ¡Correcto!" : "❌ Incorrecto"}</strong>
                                    {preguntaActual.tipo === "completar" && !respuestas[indice]?.correcta && (
                                        <span style={{ display: "block", marginBottom: 6, color: "#5DB896", fontWeight: 600 }}>
                                            Respuesta correcta: <strong>{preguntaActual.opciones[preguntaActual.correcta]}</strong>
                                        </span>
                                    )}
                                    {preguntaActual.explicacion}
                                </div>
                            )}
                        </div>

                        {respondida && (
                            <div className="quiz-nav">
                                <button className="quiz-next-btn" onClick={siguiente}>
                                    {indice + 1 >= preguntas.length ? "Ver resultado 🏁" : "Siguiente →"}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* RESULTADO */}
                {estado === "resultado" && (
                    <>
                        <div className="quiz-resultado" style={{ background: calif.bg, color: "#fff" }}>
                            <div className="quiz-resultado-icon">{calif.icon}</div>
                            <div className="quiz-resultado-score" style={{ color: calif.color }}>{pct}%</div>
                            <div className="quiz-resultado-fraction">{puntaje} de {preguntas.length} correctas</div>

                            {/* Barra de calificacion */}
                            <div className="quiz-calif-bar">
                                <div className="quiz-calif-fill" style={{ width: `${pct}%`, background: calif.color }} />
                            </div>

                            <div className="quiz-resultado-label" style={{ color: calif.color }}>{calif.label}</div>
                            <div className="quiz-resultado-sub">{calif.sub}</div>

                            {/* Semáforo visual */}
                            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
                                {[
                                    { label: "Bajo", color: "#E07B6A", min: 0, max: 49 },
                                    { label: "Regular", color: "#DCA84A", min: 50, max: 69 },
                                    { label: "Bien", color: "#8B7FD4", min: 70, max: 89 },
                                    { label: "Excelente", color: "#5DB896", min: 90, max: 100 },
                                ].map(s => (
                                    <div key={s.label} style={{ textAlign: "center", opacity: pct >= s.min && pct <= s.max ? 1 : 0.25 }}>
                                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: s.color, margin: "0 auto 4px" }} />
                                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="quiz-resultado-btns">
                                <button
                                    className="quiz-btn-reintentar"
                                    style={{ background: calif.btnBg }}
                                    onClick={iniciarQuiz}
                                >🔄 Nuevo quiz</button>
                                <button className="quiz-btn-historial" onClick={() => setEstado("inicio")}>
                                    📊 Ver historial
                                </button>
                            </div>

                            {/* Resumen de respuestas */}
                            {preguntas.length > 0 && (
                                <div className="quiz-resumen">
                                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, marginTop: 8 }}>
                                        Resumen de respuestas
                                    </div>
                                    {preguntas.map((p, i) => (
                                        <div className="quiz-resumen-item" key={i}>
                                            <span className="quiz-resumen-num">{i + 1}</span>
                                            <span className="quiz-resumen-texto">{p.pregunta.replace("___", "___")}</span>
                                            <span className="quiz-resumen-icon">{respuestas[i]?.correcta ? "✅" : "❌"}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
