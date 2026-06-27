import { useState, useRef, useEffect } from "react"
import axios from "axios"
import Icon from "../components/Icon"
import { API } from "../constants"

export default function EstudiarPage() {
  const [pdfDatos, setPdfDatos] = useState(null)
  const [pdfTab, setPdfTab] = useState("resumen")
  const [pdfCargando, setPdfCargando] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [chatMsgs, setChatMsgs] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [chatCargando, setChatCargando] = useState(false)
  const [quiz, setQuiz] = useState(null)
  const [quizCargando, setQuizCargando] = useState(false)
  const [quizRespuestas, setQuizRespuestas] = useState({})
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMsgs])

  const subirPDF = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) { setPdfError("Solo se aceptan archivos PDF"); return }
    setPdfCargando(true); setPdfError(null); setPdfDatos(null)
    setChatMsgs([]); setQuiz(null); setQuizRespuestas({})
    const fd = new FormData()
    fd.append("file", file)
    try {
      const r = await axios.post(`${API}/pdf/analizar`, fd, { headers: { "Content-Type": "multipart/form-data" } })
      setPdfDatos(r.data)
      setPdfTab("resumen")
      setChatMsgs([{ role: "bot", content: `¡Hola! Ya leí "${r.data.titulo}". Podés preguntarme lo que quieras sobre este tema 😊` }])
    } catch (e) {
      setPdfError(e?.response?.data?.detail || "No se pudo analizar el PDF")
    }
    setPdfCargando(false)
  }

  const enviarChat = async () => {
    if (!chatInput.trim() || chatCargando) return
    const pregunta = chatInput.trim()
    setChatInput("")
    setChatMsgs(prev => [...prev, { role: "user", content: pregunta }])
    setChatCargando(true)
    try {
      const r = await axios.post(`${API}/pdf/chat`, { pregunta, contexto: pdfDatos?.texto_completo || "", historial: chatMsgs.slice(-6) })
      setChatMsgs(prev => [...prev, { role: "bot", content: r.data.respuesta }])
    } catch {
      setChatMsgs(prev => [...prev, { role: "bot", content: "Uy, algo salió mal. Intentá de nuevo 😅" }])
    }
    setChatCargando(false)
  }

  const generarQuiz = async () => {
    setQuizCargando(true); setQuizRespuestas({})
    try {
      const r = await axios.post(`${API}/pdf/quiz`, { contexto: pdfDatos?.texto_completo || "" })
      setQuiz(r.data)
    } catch {
      setQuiz(null)
    }
    setQuizCargando(false)
  }

  const responderQuiz = (qi, oi) => {
    if (quizRespuestas[qi] !== undefined) return
    setQuizRespuestas(prev => ({ ...prev, [qi]: oi }))
  }

  const puntajeQuiz = () => {
    if (!quiz) return 0
    return quiz.preguntas.filter((q, i) => quizRespuestas[i] === q.correcta).length
  }

  return (
    <>
      <div className="page-hdr">
        <div className="page-greeting">Estudiar con PDF</div>
        <div className="page-sub">Subí un apunte o libro y la IA te lo explica, responde tus preguntas y te pone a prueba.</div>
      </div>

      {!pdfDatos && !pdfCargando && (
        <>
          <div
            className={`pdf-drop ${dragOver ? "over" : ""}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) subirPDF(f) }}
          >
            <input type="file" accept=".pdf" onChange={e => { const f = e.target.files[0]; if (f) subirPDF(f) }} />
            <div className="pdf-drop-icon"><Icon name="upload" size={24} color="#8B7FD4" /></div>
            <div className="pdf-drop-title">Soltá tu PDF acá o hacé click</div>
            <div className="pdf-drop-sub">Apuntes, libros, resúmenes — cualquier PDF de estudio</div>
          </div>
          {pdfError && <div className="error-box" style={{ marginTop: 14 }}><Icon name="warning" size={14} color="#C0523F" />{pdfError}</div>}
        </>
      )}

      {pdfCargando && (
        <div className="card" style={{ textAlign: "center", padding: "48px 20px" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📖</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Leyendo tu PDF…</div>
          <div style={{ fontSize: 13, color: "rgba(26,24,22,0.42)" }}>La IA está analizando el contenido, ya casi.</div>
        </div>
      )}

      {pdfDatos && !pdfCargando && (
        <>
          <div className="card" style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FCF0EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="books" size={20} color="#E07B6A" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1A1816" }}>{pdfDatos.titulo}</div>
                <div style={{ fontSize: 12, color: "rgba(26,24,22,0.4)", marginTop: 2 }}>PDF analizado correctamente</div>
              </div>
            </div>
            <button className="card-link" onClick={() => { setPdfDatos(null); setChatMsgs([]); setQuiz(null) }}>
              Cambiar PDF <Icon name="refresh" size={11} color="#8B7FD4" />
            </button>
          </div>

          <div className="pdf-tabs">
            <button className={`pdf-tab ${pdfTab === "resumen" ? "active" : ""}`} onClick={() => setPdfTab("resumen")}><Icon name="lightbulb" size={14} color="currentColor" />Resumen</button>
            <button className={`pdf-tab ${pdfTab === "chat" ? "active" : ""}`} onClick={() => setPdfTab("chat")}><Icon name="send" size={14} color="currentColor" />Preguntarle a la IA</button>
            <button className={`pdf-tab ${pdfTab === "quiz" ? "active" : ""}`} onClick={() => { setPdfTab("quiz"); if (!quiz && !quizCargando) generarQuiz() }}><Icon name="quiz" size={14} color="currentColor" />Ponerte a prueba</button>
          </div>

          {pdfTab === "resumen" && (
            <>
              <div className="pdf-resumen-box">
                <div className="pdf-resumen-label">De qué trata</div>
                <div className="pdf-resumen-text">{pdfDatos.resumen}</div>
              </div>
              <div className="card-lbl" style={{ marginBottom: 10 }}>Puntos clave para entender el tema</div>
              <ul className="pdf-puntos">
                {pdfDatos.puntos_clave.map((p, i) => (
                  <li key={i} className="pdf-punto">
                    <div className="pdf-punto-num">{i + 1}</div>
                    <div className="pdf-punto-text">{p}</div>
                  </li>
                ))}
              </ul>
              {pdfDatos.consejo && (
                <div className="pdf-consejo">
                  <Icon name="checkCircle" size={18} color="#5DB896" />
                  <div className="pdf-consejo-text"><strong style={{ display: "block", marginBottom: 3, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Consejo de la IA</strong>{pdfDatos.consejo}</div>
                </div>
              )}
            </>
          )}

          {pdfTab === "chat" && (
            <div className="card">
              <div className="card-lbl">Chat con tu PDF</div>
              <div className="chat-wrap">
                <div className="chat-msgs">
                  {chatMsgs.map((m, i) => (<div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>))}
                  {chatCargando && <div className="chat-msg bot loading">Pensando…</div>}
                  <div ref={chatEndRef} />
                </div>
                <div className="chat-input-row">
                  <input className="chat-input" placeholder="Preguntá lo que quieras sobre el tema…" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && enviarChat()} disabled={chatCargando} />
                  <button className="chat-send" onClick={enviarChat} disabled={!chatInput.trim() || chatCargando}><Icon name="send" size={16} color="#fff" /></button>
                </div>
              </div>
            </div>
          )}

          {pdfTab === "quiz" && (
            <>
              {quizCargando && (
                <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>🧠</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Generando preguntas…</div>
                </div>
              )}
              {quiz && !quizCargando && (
                <>
                  {Object.keys(quizRespuestas).length === quiz.preguntas.length && (
                    <div className="quiz-score">
                      <div className="quiz-score-num">{puntajeQuiz()}/{quiz.preguntas.length}</div>
                      <div className="quiz-score-label">{puntajeQuiz() >= 4 ? "¡Excelente! Lo entendiste muy bien 🎉" : puntajeQuiz() >= 2 ? "Buen intento, repasá un poco más 💪" : "No te preocupes, volvé a leer el resumen 📖"}</div>
                    </div>
                  )}
                  {quiz.preguntas.map((q, qi) => (
                    <div key={qi} className="quiz-q">
                      <div className="quiz-q-num">Pregunta {qi + 1}</div>
                      <div className="quiz-q-text">{q.pregunta}</div>
                      <div className="quiz-opts">
                        {q.opciones.map((op, oi) => {
                          const respondido = quizRespuestas[qi] !== undefined
                          const esCorrecta = oi === q.correcta
                          const esElegida = quizRespuestas[qi] === oi
                          let cls = "quiz-opt"
                          if (respondido) { if (esCorrecta) cls += " correct"; else if (esElegida) cls += " wrong" }
                          return <button key={oi} className={cls} onClick={() => responderQuiz(qi, oi)} disabled={respondido}>{op}</button>
                        })}
                      </div>
                      {quizRespuestas[qi] !== undefined && <div className="quiz-exp">💡 {q.explicacion}</div>}
                    </div>
                  ))}
                  <button className="submit-btn" onClick={generarQuiz} style={{ marginTop: 4 }}>
                    <Icon name="refresh" size={14} color="#fff" />Generar nuevas preguntas
                  </button>
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
