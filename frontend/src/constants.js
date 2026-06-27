export const API = import.meta.env.VITE_API_URL || "http://localhost:8000"
export const NUTRIENTES = ["TECNICO", "CONCEPTUAL", "APLICADO", "SOFT_SKILLS", "CONTEXTO"]
export const LABELS = ["Técnico", "Conceptual", "Aplicado", "Soft Skills", "Contexto"]
export const COLORES = { TECNICO: "#6BAED4", CONCEPTUAL: "#8B7FD4", APLICADO: "#DCA84A", SOFT_SKILLS: "#5DB896", CONTEXTO: "#E07B6A" }
export const COLORES_BG = { TECNICO: "#EBF4FA", CONCEPTUAL: "#F0EEF9", APLICADO: "#FBF4E3", SOFT_SKILLS: "#EBF7F2", CONTEXTO: "#FCF0EE" }
export const METAS_DEFAULT = { TECNICO: 10, CONCEPTUAL: 10, APLICADO: 10, SOFT_SKILLS: 10, CONTEXTO: 10 }
export const MOTIVACIONES = [
  "¡Excelente! Cada aprendizaje te hace más sabio",
  "¡Bien hecho! El conocimiento es tu superpoder",
  "¡Increíble! Sigue así, vas por buen camino",
  "¡Genial! Un paso más hacia tus metas",
  "¡Fantástico! El aprendizaje constante marca la diferencia",
]
export const NAV = [
  { id: "inicio", icon: "home", label: "Inicio" },
  { id: "registro", icon: "register", label: "Registrar" },
  { id: "estudiar", icon: "study", label: "Estudiar PDF" },
  { id: "balance", icon: "balance", label: "Balance" },
  { id: "metas", icon: "target", label: "Metas Semanales" },
  { id: "historial", icon: "history", label: "Historial" },
  { id: "quiz", icon: "quiz", label: "Mi Quiz" },
  { id: "nivel", icon: "lightbulb", label: "Nivel de comprensión" },
]
