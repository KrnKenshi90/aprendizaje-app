import { useState, useEffect } from "react"
import axios from "axios"
import Icon from "../components/Icon"
import { API } from "../constants"

export default function AuthPage({ onLogin }) {
  const [authVista, setAuthVista] = useState("login")
  const [authForm, setAuthForm] = useState({ nombre: "", apellido: "", email: "", password: "", confirmar: "" })
  const [authError, setAuthError] = useState(null)
  const [captchaOk, setCaptchaOk] = useState(false)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  const handleGoogleLogin = () => {
    setAuthError(null)
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) { setAuthError("Falta configurar VITE_GOOGLE_CLIENT_ID en el archivo .env del frontend"); return }
    if (!window.google) { setAuthError("SDK de Google aún cargando, intenta en un momento"); return }
    window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: async (resp) => {
        if (resp.error) { setAuthError("Error al autenticar con Google"); return }
        try {
          const r = await axios.post(`${API}/auth/google`, { token: resp.access_token })
          onLogin(r.data)
        } catch (e) {
          setAuthError(e.response?.data?.detail || "Error al iniciar sesión con Google")
        }
      },
    }).requestAccessToken()
  }

  const handleAuth = async () => {
    setAuthError(null)
    if (authVista === "login" && !captchaOk) { setAuthError("Por favor verifica que no eres un robot"); return }
    if (authVista === "registro") {
      if (!authForm.nombre.trim() || !authForm.apellido.trim()) { setAuthError("Ingresa tu nombre y apellido"); return }
      if (!authForm.email.trim()) { setAuthError("Ingresa tu correo electrónico"); return }
      if (authForm.password.length < 6) { setAuthError("La contraseña debe tener al menos 6 caracteres"); return }
      if (authForm.password !== authForm.confirmar) { setAuthError("Las contraseñas no coinciden"); return }
    }
    try {
      if (authVista === "registro") {
        await axios.post(`${API}/registro`, { nombre: `${authForm.nombre.trim()} ${authForm.apellido.trim()}`, email: authForm.email, password: authForm.password })
        setAuthVista("login")
        setAuthForm({ nombre: "", apellido: "", email: "", password: "", confirmar: "" })
        setCaptchaOk(false)
        setAuthError("✅ Registrado correctamente, ahora inicia sesión")
      } else {
        const r = await axios.post(`${API}/login`, { email: authForm.email, password: authForm.password })
        onLogin(r.data)
      }
    } catch (e) { setAuthError(e.response?.data?.detail || "Error al conectar con el servidor") }
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-brand"><div className="auth-brand-dot" />aprende.ia</div>
        <div className="auth-tagline">Tu diario de aprendizaje inteligente.<br />Analiza, equilibra y potencia lo que sabes.</div>
        <div className="auth-features">
          <div className="auth-feat"><div className="auth-feat-icon"><Icon name="tecnico" size={16} color="#8B7FD4" /></div><div className="auth-feat-text">Clasifica tu aprendizaje en 5 nutrientes esenciales</div></div>
          <div className="auth-feat"><div className="auth-feat-icon"><Icon name="balance" size={16} color="#8B7FD4" /></div><div className="auth-feat-text">Visualiza tu balance con gráficos radar en tiempo real</div></div>
          <div className="auth-feat"><div className="auth-feat-icon"><Icon name="study" size={16} color="#8B7FD4" /></div><div className="auth-feat-text">Sube tus PDFs y chattea con la IA para entender mejor</div></div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-title">{authVista === "login" ? "Bienvenido de nuevo" : "Crear cuenta"}</div>
          <div className="auth-sub-text">{authVista === "login" ? "Inicia sesión para continuar" : "Completa tus datos para empezar"}</div>
          {authVista === "registro" && (
            <div className="input-row">
              <div className="inp-group">
                <label className="inp-label"><Icon name="user" size={12} color="rgba(26,24,22,0.6)" />Nombre</label>
                <div className="inp-wrap"><span className="inp-icon"><Icon name="user" size={14} color="rgba(26,24,22,0.5)" /></span><input className="auth-input" placeholder="Juan" value={authForm.nombre} onChange={e => setAuthForm({ ...authForm, nombre: e.target.value })} /></div>
              </div>
              <div className="inp-group">
                <label className="inp-label"><Icon name="user" size={12} color="rgba(26,24,22,0.6)" />Apellido</label>
                <div className="inp-wrap"><span className="inp-icon"><Icon name="user" size={14} color="rgba(26,24,22,0.5)" /></span><input className="auth-input" placeholder="Pérez" value={authForm.apellido} onChange={e => setAuthForm({ ...authForm, apellido: e.target.value })} /></div>
              </div>
            </div>
          )}
          <div className="inp-group">
            <label className="inp-label"><Icon name="mail" size={12} color="rgba(26,24,22,0.6)" />Correo electrónico</label>
            <div className="inp-wrap"><span className="inp-icon"><Icon name="mail" size={14} color="rgba(26,24,22,0.5)" /></span><input className="auth-input" type="email" placeholder="tu@correo.com" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} /></div>
          </div>
          <div className="inp-group">
            <label className="inp-label"><Icon name="lock" size={12} color="rgba(26,24,22,0.6)" />Contraseña</label>
            <div className="inp-wrap"><span className="inp-icon"><Icon name="lock" size={14} color="rgba(26,24,22,0.5)" /></span><input className="auth-input" type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} /></div>
            {authVista === "registro" && authForm.password && <div className="strength" style={{ width: authForm.password.length > 10 ? "100%" : authForm.password.length > 6 ? "60%" : "30%", background: authForm.password.length > 10 ? "#5DB896" : authForm.password.length > 6 ? "#DCA84A" : "#E07B6A" }} />}
          </div>
          {authVista === "registro" && (
            <div className="inp-group">
              <label className="inp-label"><Icon name="lock" size={12} color="rgba(26,24,22,0.6)" />Confirmar contraseña</label>
              <div className="inp-wrap"><span className="inp-icon"><Icon name="lock" size={14} color="rgba(26,24,22,0.5)" /></span><input className="auth-input" type="password" placeholder="••••••••" value={authForm.confirmar} onChange={e => setAuthForm({ ...authForm, confirmar: e.target.value })} /></div>
            </div>
          )}
          {authVista === "login" && (
            <>
              <div className="divider"><div className="div-line" /><div className="div-txt">VERIFICACIÓN</div><div className="div-line" /></div>
              <div className="captcha-box">
                <div className="cap-left">
                  <div className={`cap-check ${captchaOk ? "on" : ""}`} onClick={() => setCaptchaOk(!captchaOk)}>{captchaOk && <Icon name="check" size={13} color="#fff" />}</div>
                  <span className="cap-lbl">No soy un robot</span>
                </div>
                <div className="cap-logo"><Icon name="shield" size={18} color="rgba(26,24,22,0.45)" /><span>Verificado</span></div>
              </div>
            </>
          )}
          <button className="auth-btn" onClick={handleAuth}>{authVista === "login" ? "Entrar" : "Crear cuenta"}<Icon name="arrow_right" size={15} color="#fff" /></button>
          <div className="divider" style={{ margin: "12px 0" }}><div className="div-line" /><div className="div-txt">O CONTINÚA CON</div><div className="div-line" /></div>
          <button className="google-btn" onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
            Continuar con Google
          </button>
          {authError && (<div className={`msg ${authError.startsWith("✅") ? "ok" : "err"}`}><Icon name={authError.startsWith("✅") ? "checkCircle" : "warning"} size={14} color={authError.startsWith("✅") ? "#2D7A5B" : "#C0523F"} />{authError.replace("✅ ", "")}</div>)}
          <div className="auth-switch">
            {authVista === "login"
              ? <> ¿No tienes cuenta? <span onClick={() => { setAuthVista("registro"); setAuthError(null); setCaptchaOk(false) }}>Regístrate</span></>
              : <> ¿Ya tienes cuenta? <span onClick={() => { setAuthVista("login"); setAuthError(null) }}>Inicia sesión</span></>}
          </div>
        </div>
      </div>
    </div>
  )
}
