import Quiz from "./Quiz"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js"
import { Radar } from "react-chartjs-2"

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const API = "http://localhost:8000"
const NUTRIENTES = ["TECNICO", "CONCEPTUAL", "APLICADO", "SOFT_SKILLS", "CONTEXTO"]
const LABELS = ["Técnico", "Conceptual", "Aplicado", "Soft Skills", "Contexto"]
const COLORES = { TECNICO: "#6BAED4", CONCEPTUAL: "#8B7FD4", APLICADO: "#DCA84A", SOFT_SKILLS: "#5DB896", CONTEXTO: "#E07B6A" }
const COLORES_BG = { TECNICO: "#EBF4FA", CONCEPTUAL: "#F0EEF9", APLICADO: "#FBF4E3", SOFT_SKILLS: "#EBF7F2", CONTEXTO: "#FCF0EE" }
const METAS_DEFAULT = { TECNICO: 10, CONCEPTUAL: 10, APLICADO: 10, SOFT_SKILLS: 10, CONTEXTO: 10 }
const MOTIVACIONES = [
  "¡Excelente! Cada aprendizaje te hace más sabio",
  "¡Bien hecho! El conocimiento es tu superpoder",
  "¡Increíble! Sigue así, vas por buen camino",
  "¡Genial! Un paso más hacia tus metas",
  "¡Fantástico! El aprendizaje constante marca la diferencia",
]

// ── SVG ICONS ──────────────────────────────────────────────
const Icon = ({ name, size = 16, color = "currentColor", style = {} }) => {
  const s = { width: size, height: size, display: "block", flexShrink: 0, ...style }
  const paths = {
    tecnico: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>),
    conceptual: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
    aplicado: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>),
    soft_skills: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
    contexto: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>),
    home: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
    register: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>),
    balance: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
    history: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>),
    study: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>),
    logout: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
    flame: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>),
    calendar: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
    target: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>),
    zap: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
    books: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>),
    lightbulb: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>),
    trash: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>),
    user: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
    mail: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>),
    lock: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
    check: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="20 6 9 17 4 12"/></svg>),
    arrow_right: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>),
    shield: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
    edit: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
    warning: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>),
    checkCircle: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>),
    upload: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>),
    send: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
    quiz: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>),
    refresh: (<svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={s}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>),
  }
  return paths[name] || null
}

const NUTRIENTE_ICONS = { TECNICO: "tecnico", CONCEPTUAL: "conceptual", APLICADO: "aplicado", SOFT_SKILLS: "soft_skills", CONTEXTO: "contexto" }

const NAV = [
  { id: "inicio", icon: "home", label: "Inicio" },
  { id: "registro", icon: "register", label: "Registrar" },
  { id: "estudiar", icon: "study", label: "Estudiar PDF" },
  { id: "balance", icon: "balance", label: "Balance" },
  { id: "metas", icon: "target", label: "Metas Semanales" },
  { id: "historial", icon: "history", label: "Historial" },
  { id: "quiz", icon: "quiz", label: "Mi Quiz" },
  { id: "nivel", icon: "lightbulb", label: "Nivel de comprensión" },
]

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;width:100%}
body{font-family:'Figtree',sans-serif;background:#EDEAE3;color:#1A1816;overflow:hidden}
.shell{display:flex;height:100vh;width:100vw}
.sidebar{width:224px;min-width:224px;background:#1A1816;display:flex;flex-direction:column;padding:0;height:100vh;z-index:10}
.sb-top{padding:24px 20px 20px}
.sb-logo{font-family:'Figtree',sans-serif;font-style:italic;font-size:22px;font-weight:700;letter-spacing:-0.4px;color:#fff;display:flex;align-items:center;gap:8px;margin-bottom:4px}
.sb-logo-dot{width:7px;height:7px;background:#8B7FD4;border-radius:50%;flex-shrink:0;margin-bottom:2px}
.sb-logo-sub{font-size:9.5px;color:rgba(255,255,255,0.42);font-weight:500;letter-spacing:0.13em;text-transform:uppercase;padding-left:15px;font-family:'Figtree',sans-serif}
.sb-nav{padding:8px 0;flex:1}
.sb-section{font-size:9.5px;font-weight:600;color:rgba(255,255,255,0.38);letter-spacing:0.12em;text-transform:uppercase;padding:0 20px;margin:14px 0 5px;font-family:'Figtree',sans-serif}
.sb-btn{display:flex;align-items:center;gap:9px;padding:9px 20px;font-family:'Figtree',sans-serif;font-size:13px;font-weight:500;color:rgba(255,255,255,0.62);background:none;border:none;border-left:2px solid transparent;cursor:pointer;width:100%;text-align:left;transition:all .18s}
.sb-btn:hover{color:rgba(255,255,255,0.88);background:rgba(255,255,255,0.06)}
.sb-btn.active{color:#fff;background:rgba(139,127,212,0.14);border-left-color:#8B7FD4;font-weight:600}
.sb-btn svg{opacity:0.5;transition:opacity .18s}
.sb-btn:hover svg,.sb-btn.active svg{opacity:1}
.sb-bottom{padding:0 20px 20px;margin-top:auto}
.sb-divider{height:1px;background:rgba(255,255,255,0.07);margin-bottom:14px}
.sb-user{display:flex;align-items:center;gap:10px}
.sb-avatar{width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#8B7FD4,#6857B8);color:#fff;font-family:'Figtree',sans-serif;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.sb-userinfo{flex:1;min-width:0}
.sb-username{font-size:12px;font-weight:600;color:rgba(255,255,255,0.92);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.3}
.sb-userrole{font-size:10px;color:rgba(255,255,255,0.45)}
.sb-logout{background:none;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px;cursor:pointer;color:rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;transition:all .18s;flex-shrink:0}
.sb-logout:hover{background:rgba(224,123,106,0.15);border-color:rgba(224,123,106,0.3);color:#E07B6A}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{background:rgba(237,234,227,0.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(26,24,22,0.08);padding:0 28px;height:52px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.tb-left{display:flex;align-items:center;gap:10px}
.tb-title{font-family:'Figtree',sans-serif;font-style:italic;font-size:15px;font-weight:700;color:#1A1816}
.tb-right{display:flex;align-items:center;gap:10px}
.tb-date{font-size:11.5px;color:rgba(26,24,22,0.72);font-weight:500;display:flex;align-items:center;gap:5px}
.racha-pill{background:#1A1816;border-radius:20px;padding:4px 10px 4px 8px;font-size:11.5px;color:#DCA84A;font-weight:600;display:flex;align-items:center;gap:5px}
.content{flex:1;overflow-y:auto;padding:22px 26px 30px;scrollbar-width:thin;scrollbar-color:rgba(26,24,22,0.12) transparent}
.content::-webkit-scrollbar{width:4px}
.content::-webkit-scrollbar-thumb{background:rgba(26,24,22,0.12);border-radius:2px}
.page-hdr{margin-bottom:20px}
.page-greeting{font-family:'Figtree',sans-serif;font-style:italic;font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#1A1816;line-height:1.15;margin-bottom:4px}
.page-sub{font-size:13px;color:rgba(26,24,22,0.62)}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:14px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-bottom:14px}
.g2-1{display:grid;grid-template-columns:2fr 1fr;gap:13px;margin-bottom:14px}
.card{background:#fff;border:1px solid rgba(26,24,22,0.07);border-radius:16px;padding:18px}
.card-lbl{font-size:10.5px;font-weight:700;color:rgba(26,24,22,0.55);text-transform:uppercase;letter-spacing:0.09em;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}
.card-link{font-size:11px;color:#8B7FD4;font-weight:600;cursor:pointer;text-transform:none;letter-spacing:0;background:none;border:none;font-family:'Figtree',sans-serif;display:flex;align-items:center;gap:3px}
.card-link:hover{text-decoration:underline}
.stat-card{background:#fff;border:1px solid rgba(26,24,22,0.07);border-radius:16px;padding:16px 18px;transition:transform .2s,box-shadow .2s;cursor:default}
.stat-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(26,24,22,0.08)}
.stat-ico-wrap{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;margin-bottom:14px}
.stat-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px}
.stat-badge{font-size:10px;font-weight:600;padding:3px 8px;border-radius:20px}
.up{background:#EBF7F2;color:#2D7A5B}
.neutral{background:#F0EDE8;color:rgba(26,24,22,0.58)}
.warn{background:#FCF0EE;color:#C0523F}
.stat-val{font-family:'Figtree',sans-serif;font-size:30px;font-weight:700;color:#1A1816;line-height:1;margin-bottom:3px}
.stat-lbl{font-size:11px;color:rgba(26,24,22,0.6)}
.racha-card{background:#1A1816;border-radius:16px;padding:18px;display:flex;align-items:center;justify-content:space-between}
.racha-l{display:flex;align-items:center;gap:12px}
.racha-icon-wrap{width:40px;height:40px;background:rgba(220,168,74,0.15);border-radius:12px;display:flex;align-items:center;justify-content:center}
.racha-title{font-family:'Figtree',sans-serif;font-size:14px;font-weight:700;color:#fff;margin-bottom:2px}
.racha-sub{font-size:10.5px;color:rgba(255,255,255,0.5)}
.racha-num{font-family:'Figtree',sans-serif;font-size:44px;font-weight:700;color:#DCA84A;line-height:1;text-align:right}
.racha-unit{font-size:10px;color:rgba(255,255,255,0.48);text-transform:uppercase;letter-spacing:0.07em;text-align:right;margin-top:2px}
.week-row{display:flex;gap:7px}
.day-box{flex:1;height:72px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;transition:transform .2s,box-shadow .2s;position:relative;overflow:hidden}
.day-box:hover{transform:translateY(-1px)}
.day-box.active{background:#8B7FD4;box-shadow:0 4px 14px rgba(139,127,212,0.35)}
.day-box.today{background:#fff;border:1.5px solid #8B7FD4;box-shadow:0 2px 8px rgba(139,127,212,0.15)}
.day-box.empty{background:#F7F4EF}
.day-dot{width:5px;height:5px;border-radius:50%;margin-bottom:1px}
.day-box.active .day-dot{background:rgba(255,255,255,0.5)}
.day-box.today .day-dot{background:#8B7FD4}
.day-box.empty .day-dot{background:transparent}
.dl{font-family:'Figtree',sans-serif;font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase}
.day-box.active .dl{color:rgba(255,255,255,0.7)}
.day-box.today .dl{color:#8B7FD4}
.day-box.empty .dl{color:rgba(26,24,22,0.45)}
.dn{font-size:18px;font-weight:700;font-family:'Figtree',sans-serif;line-height:1}
.day-box.active .dn{color:#fff}
.day-box.today .dn{color:#1A1816}
.day-box.empty .dn{color:rgba(26,24,22,0.52)}
.nut-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(26,24,22,0.05)}
.nut-row:last-child{border-bottom:none;padding-bottom:0}
.nut-icon{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nut-info{flex:1;min-width:0}
.nut-name{font-size:12px;font-weight:600;color:#1A1816;margin-bottom:5px}
.bar-bg{background:#F7F4EF;border-radius:4px;height:4px}
.bar-fill{height:4px;border-radius:4px;transition:width .8s ease}
.nut-count{font-family:'Figtree',sans-serif;font-size:15px;font-weight:700;color:#1A1816;min-width:22px;text-align:right}
textarea{width:100%;background:#F7F4EF;border:1.5px solid rgba(26,24,22,0.09);border-radius:12px;padding:13px;font-size:14px;color:#1A1816;font-family:'Figtree',sans-serif;resize:none;outline:none;line-height:1.65;transition:border-color .2s,background .2s}
textarea:focus{border-color:#8B7FD4;background:#fff}
textarea::placeholder{color:rgba(26,24,22,0.28)}
.submit-btn{width:100%;margin-top:10px;padding:12px 16px;background:#1A1816;border:none;border-radius:12px;color:#fff;font-family:'Figtree',sans-serif;font-size:13.5px;font-weight:700;cursor:pointer;letter-spacing:-0.2px;transition:background .2s;display:flex;align-items:center;justify-content:center;gap:8px}
.submit-btn:hover:not(:disabled){background:#2E2C2A}
.submit-btn:disabled{opacity:0.4;cursor:not-allowed}
.resultado{background:#F7F4EF;border:1.5px solid rgba(26,24,22,0.07);border-radius:12px;padding:13px;margin-top:12px;animation:fadeUp .35s ease}
.resultado-lbl{font-size:10px;font-weight:600;color:rgba(26,24,22,0.52);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px}
.tags-row{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px}
.resumen{font-size:13px;color:rgba(26,24,22,0.68);line-height:1.6;font-style:italic}
.motivacion{background:#EBF7F2;border:1px solid rgba(93,184,150,0.28);border-radius:12px;padding:11px 15px;margin-top:10px;font-size:13px;color:#2D7A5B;font-weight:500;text-align:center;animation:fadeUp .4s ease;display:flex;align-items:center;gap:8px;justify-content:center}
.error-box{background:#FCF0EE;border:1.5px solid rgba(224,123,106,0.28);border-radius:12px;padding:10px 13px;font-size:13px;color:#C0523F;margin-top:10px;display:flex;align-items:center;gap:8px}
.tag{font-size:10px;padding:3px 8px;border-radius:20px;font-weight:600;border:1.5px solid;display:inline-flex;align-items:center;gap:4px}
.entry{padding:12px 0;border-bottom:1px solid rgba(26,24,22,0.06)}
.entry:last-child{border-bottom:none;padding-bottom:0}
.entry-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;gap:8px}
.entry-date{font-size:11px;color:rgba(26,24,22,0.55);flex-shrink:0;display:flex;align-items:center;gap:4px}
.entry-tags{display:flex;gap:4px;flex-wrap:wrap}
.entry-text{font-size:12px;color:rgba(26,24,22,0.65);line-height:1.55;font-style:italic}
.del-btn{background:none;border:1px solid rgba(26,24,22,0.09);border-radius:7px;padding:5px;cursor:pointer;color:rgba(26,24,22,0.3);display:flex;align-items:center;transition:all .18s;flex-shrink:0}
.del-btn:hover{border-color:#E07B6A;color:#E07B6A;background:#FCF0EE}
.recom{background:#F0EEF9;border:1.5px solid rgba(139,127,212,0.18);border-radius:16px;padding:15px 17px;margin-bottom:14px;display:flex;gap:12px;align-items:flex-start}
.recom-icon{background:#8B7FD4;border-radius:10px;padding:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.recom-title{font-size:10px;font-weight:700;color:#6857B8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px}
.recom-text{font-size:13px;color:#4A4278;line-height:1.6}
.meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-bottom:14px}
.meta-item{background:#fff;border:1px solid rgba(26,24,22,0.07);border-radius:16px;padding:16px;transition:transform .2s,box-shadow .2s}
.meta-item:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(26,24,22,0.08)}
.meta-top{display:flex;align-items:center;gap:7px;margin-bottom:5px}
.meta-icon{width:24px;height:24px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.meta-name{font-size:11px;font-weight:600;color:rgba(26,24,22,0.75);flex:1}
.meta-count{font-family:'Figtree',sans-serif;font-size:18px;font-weight:700;color:#1A1816}
.meta-inp{width:44px;background:#fff;border:1.5px solid #8B7FD4;border-radius:6px;padding:3px 5px;font-size:12px;color:#1A1816;outline:none;text-align:center;font-family:'Figtree',sans-serif}
.bar-bg2{background:rgba(26,24,22,0.07);border-radius:4px;height:4px}
.meta-bar{height:4px;border-radius:4px;transition:width .6s ease}
.meta-foot{font-size:10px;color:rgba(26,24,22,0.5);margin-top:3px}
.metas-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.edit-btn{font-size:12px;color:#8B7FD4;cursor:pointer;font-weight:600;background:none;border:none;font-family:'Figtree',sans-serif;display:flex;align-items:center;gap:4px}
.filtros{display:flex;gap:6px;margin-bottom:14px}
.fil-btn{padding:5px 14px;border-radius:20px;border:1.5px solid rgba(26,24,22,0.09);background:#fff;color:rgba(26,24,22,0.45);font-size:12px;font-family:'Figtree',sans-serif;font-weight:500;cursor:pointer;transition:all .2s}
.fil-btn.active{background:#1A1816;border-color:#1A1816;color:#fff}
.radar-wrap{padding:4px 0 10px}
.empty{text-align:center;color:rgba(26,24,22,0.45);font-size:14px;padding:2.5rem 0}
.sec-title{font-family:'Figtree',sans-serif;font-style:italic;font-size:22px;font-weight:700;margin-bottom:4px}
.sec-sub{font-size:13px;color:rgba(26,24,22,0.58);margin-bottom:20px}
.reg-layout{display:grid;grid-template-columns:1fr 300px;gap:13px}
.reg-footer{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
.char-count{font-size:11px;font-weight:500}
.reg-hint-card{background:#1A1816;border-radius:16px;padding:16px;display:flex;gap:11px;align-items:flex-start}
.reg-hint-icon{background:rgba(139,127,212,0.25);border-radius:9px;padding:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.reg-hint-title{font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px}
.reg-hint-text{font-size:12px;color:rgba(255,255,255,0.6);line-height:1.55}
.hist-toolbar{display:flex;align-items:center;justify-content:space-between}
.hist-count{font-size:12px;color:rgba(26,24,22,0.55);font-weight:600}
.entry-resumen{font-size:11.5px;color:rgba(26,24,22,0.58);margin-top:4px;font-weight:500;line-height:1.5}

/* ── ESTUDIAR PDF ── */
.pdf-drop{border:2px dashed rgba(139,127,212,0.35);border-radius:18px;padding:44px 28px;text-align:center;background:#F7F4EF;cursor:pointer;transition:all .2s;position:relative}
.pdf-drop:hover,.pdf-drop.over{border-color:#8B7FD4;background:#F0EEF9}
.pdf-drop input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
.pdf-drop-icon{width:52px;height:52px;background:rgba(139,127,212,0.12);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
.pdf-drop-title{font-family:'Figtree',sans-serif;font-size:16px;font-weight:700;color:#1A1816;margin-bottom:5px}
.pdf-drop-sub{font-size:13px;color:rgba(26,24,22,0.42)}
.pdf-tabs{display:flex;gap:6px;margin-bottom:18px;border-bottom:1px solid rgba(26,24,22,0.08);padding-bottom:14px}
.pdf-tab{padding:7px 16px;border-radius:20px;border:none;background:none;font-family:'Figtree',sans-serif;font-size:13px;font-weight:500;color:rgba(26,24,22,0.4);cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .2s}
.pdf-tab.active{background:#1A1816;color:#fff}
.pdf-tab:hover:not(.active){background:rgba(26,24,22,0.06);color:#1A1816}
.pdf-resumen-box{background:#F0EEF9;border:1.5px solid rgba(139,127,212,0.2);border-radius:14px;padding:16px;margin-bottom:14px}
.pdf-resumen-label{font-size:10px;font-weight:700;color:#6857B8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px}
.pdf-resumen-text{font-size:14px;color:#3D3566;line-height:1.7}
.pdf-puntos{list-style:none;display:flex;flex-direction:column;gap:8px;margin-bottom:14px}
.pdf-punto{display:flex;align-items:flex-start;gap:10px;background:#fff;border:1px solid rgba(26,24,22,0.07);border-radius:11px;padding:12px 14px}
.pdf-punto-num{width:22px;height:22px;border-radius:7px;background:#8B7FD4;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
.pdf-punto-text{font-size:13px;color:#1A1816;line-height:1.6}
.pdf-consejo{background:#EBF7F2;border:1px solid rgba(93,184,150,0.28);border-radius:12px;padding:13px 16px;display:flex;gap:10px;align-items:flex-start;margin-bottom:14px}
.pdf-consejo-text{font-size:13px;color:#2D7A5B;line-height:1.6}
/* Chat */
.chat-wrap{display:flex;flex-direction:column;height:420px}
.chat-msgs{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px 0 12px;scrollbar-width:thin;scrollbar-color:rgba(26,24,22,0.1) transparent}
.chat-msg{max-width:82%;padding:11px 14px;border-radius:14px;font-size:13.5px;line-height:1.65;animation:fadeUp .25s ease}
.chat-msg.user{background:#1A1816;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
.chat-msg.bot{background:#F0EEF9;color:#3D3566;align-self:flex-start;border-bottom-left-radius:4px}
.chat-msg.bot.loading{opacity:0.6}
.chat-input-row{display:flex;gap:8px;margin-top:8px}
.chat-input{flex:1;background:#F7F4EF;border:1.5px solid rgba(26,24,22,0.09);border-radius:12px;padding:11px 14px;font-size:14px;color:#1A1816;font-family:'Figtree',sans-serif;outline:none;transition:border-color .2s}
.chat-input:focus{border-color:#8B7FD4;background:#fff}
.chat-send{background:#8B7FD4;border:none;border-radius:12px;padding:11px 14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s;flex-shrink:0}
.chat-send:hover:not(:disabled){background:#7668C0}
.chat-send:disabled{opacity:0.4;cursor:not-allowed}
/* Quiz */
.quiz-q{background:#fff;border:1px solid rgba(26,24,22,0.07);border-radius:14px;padding:18px;margin-bottom:12px}
.quiz-q-num{font-size:10px;font-weight:700;color:rgba(26,24,22,0.52);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px}
.quiz-q-text{font-size:14px;font-weight:600;color:#1A1816;margin-bottom:14px;line-height:1.5}
.quiz-opts{display:flex;flex-direction:column;gap:7px}
.quiz-opt{background:#F7F4EF;border:1.5px solid rgba(26,24,22,0.08);border-radius:10px;padding:10px 14px;font-size:13px;color:#1A1816;cursor:pointer;text-align:left;font-family:'Figtree',sans-serif;transition:all .18s;width:100%}
.quiz-opt:hover:not(:disabled){background:#F0EEF9;border-color:#8B7FD4}
.quiz-opt.correct{background:#EBF7F2;border-color:#5DB896;color:#2D7A5B;font-weight:600}
.quiz-opt.wrong{background:#FCF0EE;border-color:#E07B6A;color:#C0523F}
.quiz-opt:disabled{cursor:default}
.quiz-exp{margin-top:10px;font-size:12.5px;color:rgba(26,24,22,0.55);line-height:1.6;padding:10px;background:#F7F4EF;border-radius:9px}
.quiz-score{background:#1A1816;border-radius:16px;padding:24px;text-align:center;margin-bottom:14px}
.quiz-score-num{font-family:'Figtree',sans-serif;font-size:52px;font-weight:700;color:#DCA84A;line-height:1}
.quiz-score-label{font-size:13px;color:rgba(255,255,255,0.4);margin-top:4px}

@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

/* ── AUTH ── */
.auth-shell{min-height:100vh;width:100vw;display:flex;background:#EDEAE3}
.auth-left{width:380px;min-width:380px;background:#1A1816;display:flex;flex-direction:column;justify-content:center;padding:56px 44px;position:relative;overflow:hidden}
.auth-left::before{content:'';position:absolute;top:-80px;right:-80px;width:280px;height:280px;border-radius:50%;background:rgba(139,127,212,0.09)}
.auth-left::after{content:'';position:absolute;bottom:-60px;left:-60px;width:200px;height:200px;border-radius:50%;background:rgba(139,127,212,0.05)}
.auth-brand{font-family:'Figtree',sans-serif;font-style:italic;font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#fff;margin-bottom:8px;position:relative;z-index:1;display:flex;align-items:center;gap:8px}
.auth-brand-dot{width:10px;height:10px;background:#8B7FD4;border-radius:50%}
.auth-tagline{font-size:13px;color:rgba(255,255,255,0.65);line-height:1.75;position:relative;z-index:1;margin-bottom:44px}
.auth-features{display:flex;flex-direction:column;gap:14px;position:relative;z-index:1}
.auth-feat{display:flex;align-items:center;gap:12px}
.auth-feat-icon{width:34px;height:34px;border-radius:10px;background:rgba(139,127,212,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.auth-feat-text{font-size:12px;color:rgba(255,255,255,0.72);line-height:1.5}
.auth-right{flex:1;display:flex;align-items:center;justify-content:center;padding:36px}
.auth-card{background:#fff;border:1px solid rgba(26,24,22,0.07);border-radius:22px;padding:36px;width:100%;max-width:400px}
.auth-title{font-family:'Figtree',sans-serif;font-style:italic;font-size:22px;font-weight:700;color:#1A1816;margin-bottom:4px}
.auth-sub-text{font-size:13px;color:rgba(26,24,22,0.62);margin-bottom:24px}
.input-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.inp-group{margin-bottom:12px}
.inp-label{font-size:11.5px;color:rgba(26,24,22,0.72);display:flex;align-items:center;gap:5px;margin-bottom:5px;font-weight:600}
.inp-wrap{position:relative}
.inp-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);pointer-events:none;display:flex;align-items:center}
.auth-input{width:100%;background:#F7F4EF;border:1.5px solid rgba(26,24,22,0.12);border-radius:10px;padding:10px 13px 10px 36px;color:#1A1816;font-family:'Figtree',sans-serif;font-size:14px;outline:none;transition:border-color .2s}
.auth-input:focus{border-color:#8B7FD4;background:#fff}
.auth-input::placeholder{color:rgba(26,24,22,0.38)}
.strength{height:4px;border-radius:2px;margin-top:5px;transition:all .3s}
.auth-btn{width:100%;padding:12px 16px;background:#1A1816;border:none;border-radius:12px;color:#fff;font-family:'Figtree',sans-serif;font-size:14px;font-weight:700;cursor:pointer;margin-top:6px;transition:background .2s;letter-spacing:-0.2px;display:flex;align-items:center;justify-content:center;gap:8px}
.auth-btn:hover{background:#2E2C2A}
.google-btn{width:100%;padding:11px 16px;background:#fff;border:1.5px solid rgba(26,24,22,0.15);border-radius:12px;color:#1A1816;font-family:'Figtree',sans-serif;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px;transition:all .2s;letter-spacing:-0.1px;display:flex;align-items:center;justify-content:center;gap:10px}
.google-btn:hover{background:#F7F4EF;border-color:rgba(26,24,22,0.25);box-shadow:0 2px 8px rgba(26,24,22,0.08)}
.auth-switch{text-align:center;font-size:13px;color:rgba(26,24,22,0.58);margin-top:14px}
.auth-switch span{color:#8B7FD4;cursor:pointer;font-weight:600}
.msg{font-size:13px;padding:9px 13px;border-radius:10px;margin-top:9px;text-align:center;display:flex;align-items:center;justify-content:center;gap:7px}
.msg.err{background:#FCF0EE;border:1px solid rgba(224,123,106,0.28);color:#C0523F}
.msg.ok{background:#EBF7F2;border:1px solid rgba(93,184,150,0.28);color:#2D7A5B}
.divider{display:flex;align-items:center;gap:10px;margin:14px 0}
.div-line{flex:1;height:1px;background:rgba(26,24,22,0.12)}
.div-txt{font-size:11px;color:rgba(26,24,22,0.48);letter-spacing:0.06em;font-weight:600}
.captcha-box{background:#F7F4EF;border:1.5px solid rgba(26,24,22,0.12);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;margin-bottom:11px}
.cap-left{display:flex;align-items:center;gap:9px}
.cap-check{width:21px;height:21px;border:2px solid rgba(26,24,22,0.25);border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;background:#fff;flex-shrink:0}
.cap-check.on{background:#5DB896;border-color:#5DB896}
.cap-lbl{font-size:13px;color:rgba(26,24,22,0.75);font-weight:500}
.cap-logo{font-size:10px;color:rgba(26,24,22,0.45);text-align:right;line-height:1.4;display:flex;flex-direction:column;align-items:center;gap:3px}
`

function initials(n = "") { return n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() }
function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"
}
function weekDays() {
  const days = ["L","M","X","J","V","S","D"]
  const hoy = new Date(); const dow = hoy.getDay()
  const lun = new Date(hoy); lun.setDate(hoy.getDate() - ((dow + 6) % 7))
  return days.map((l, i) => { const d = new Date(lun); d.setDate(lun.getDate() + i); return { letter: l, num: d.getDate(), date: d } })
}

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem("usuario_session")) || null }
    catch { return null }
  })
  const [authVista, setAuthVista] = useState("login")
  const [authForm, setAuthForm] = useState({ nombre: "", apellido: "", email: "", password: "", confirmar: "" })
  const [authError, setAuthError] = useState(null)
  const [captchaOk, setCaptchaOk] = useState(false)
  const [tema, setTema] = useState("")
  const [texto, setTexto] = useState("")
  const [resultado, setResultado] = useState(null)
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(false)
  const [vista, setVista] = useState("inicio")
  const [error, setError] = useState(null)
  const [motivacion, setMotivacion] = useState(null)
  const [filtro, setFiltro] = useState("todo")
  const [metas, setMetas] = useState(() => {
    try { return JSON.parse(localStorage.getItem("metas_aprendizaje")) || METAS_DEFAULT }
    catch { return METAS_DEFAULT }
  })
  const [editandoMetas, setEditandoMetas] = useState(false)

  // Estado Nivel de Comprension
  const [ncPaso, setNcPaso] = useState("seleccionar")
  const [ncTemaSeleccionado, setNcTemaSeleccionado] = useState(null)
  const [ncMsgs, setNcMsgs] = useState([])
  const [ncInput, setNcInput] = useState("")
  const [ncCargando, setNcCargando] = useState(false)

  // ── Estado Estudiar PDF ──
  const [pdfDatos, setPdfDatos] = useState(null)       // resultado del análisis
  const [pdfTab, setPdfTab] = useState("resumen")      // resumen | chat | quiz
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

  // ── Estado Metas Semanales ──
  const [metasData, setMetasData] = useState(null)
  const [metasEditando, setMetasEditando] = useState(false)
  const [metasForm, setMetasForm] = useState({ tecnico: 5, conceptual: 5, aplicado: 5, soft_skills: 5, contexto: 5 })
  const [badges, setBadges] = useState([])
  const [metasCargando, setMetasCargando] = useState(false)

  useEffect(() => {
    // Cargar el SDK de Google Identity Services
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
    if (!clientId) {
      setAuthError("Falta configurar VITE_GOOGLE_CLIENT_ID en el archivo .env del frontend")
      return
    }
    if (!window.google) {
      setAuthError("SDK de Google aún cargando, intenta en un momento")
      return
    }
    window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: async (resp) => {
        if (resp.error) { setAuthError("Error al autenticar con Google"); return }
        try {
          const r = await axios.post(`${API}/auth/google`, { token: resp.access_token })
          setUsuario(r.data)
        } catch (e) {
          setAuthError(e.response?.data?.detail || "Error al iniciar sesión con Google")
        }
      },
    }).requestAccessToken()
  }

  useEffect(() => {
    if (usuario) localStorage.setItem("usuario_session", JSON.stringify(usuario))
    else localStorage.removeItem("usuario_session")
  }, [usuario])

  useEffect(() => {
    localStorage.setItem("metas_aprendizaje", JSON.stringify(metas))
  }, [metas])

  useEffect(() => { if (usuario) { cargarRegistros(); cargarMetas(); cargarBadges(); } }, [usuario])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMsgs])

  const cargarRegistros = async () => {
    try { const r = await axios.get(`${API}/registros/${usuario.id}`); setRegistros(r.data) }
    catch (e) { console.error(e) }
  }

  const cargarMetas = async () => {
    if (!usuario) return
    setMetasCargando(true)
    try {
      const r = await axios.get(`${API}/metas/semana/${usuario.id}`)
      setMetasData(r.data)
      setMetasForm({
        tecnico: r.data.metas.tecnico || 5,
        conceptual: r.data.metas.conceptual || 5,
        aplicado: r.data.metas.aplicado || 5,
        soft_skills: r.data.metas.soft_skills || 5,
        contexto: r.data.metas.contexto || 5,
      })
    } catch (e) { console.error(e) }
    setMetasCargando(false)
  }

  const guardarMetas = async () => {
    if (!usuario) return
    setMetasCargando(true)
    try {
      await axios.post(`${API}/metas/semana/actualizar`, { usuario_id: usuario.id, ...metasForm })
      await cargarMetas()
      setMetasEditando(false)
    } catch (e) { console.error(e) }
    setMetasCargando(false)
  }

  const cargarBadges = async () => {
    if (!usuario) return
    try { const r = await axios.get(`${API}/badges/${usuario.id}`); setBadges(r.data) }
    catch (e) { console.error(e) }
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
        setAuthVista("login"); setAuthForm({ nombre: "", apellido: "", email: "", password: "", confirmar: "" })
        setCaptchaOk(false); setAuthError("✅ Registrado correctamente, ahora inicia sesión")
      } else {
        const r = await axios.post(`${API}/login`, { email: authForm.email, password: authForm.password })
        setUsuario(r.data)
      }
    } catch (e) { setAuthError(e.response?.data?.detail || "Error al conectar con el servidor") }
  }

  const clasificar = async () => {
    if (!texto.trim()) return
    setCargando(true); setError(null); setMotivacion(null)
    try {
      const r = await axios.post(`${API}/clasificar`, { texto, tema, usuario_id: usuario.id })
      setResultado(r.data); await cargarRegistros(); setTexto(""); setTema("")
      setMotivacion(MOTIVACIONES[Math.floor(Math.random() * MOTIVACIONES.length)])
    } catch (e) {
      const msg = e?.response?.data?.detail || e.message || "Error al conectar con el servidor"
      setError(msg)
    }
    setCargando(false)
  }

  const eliminar = async (id) => {
    try { await axios.delete(`${API}/registros/${id}`); await cargarRegistros() }
    catch (e) { console.error(e) }
  }

  // ── PDF handlers ──
  const subirPDF = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setPdfError("Solo se aceptan archivos PDF"); return
    }
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
      const r = await axios.post(`${API}/pdf/chat`, {
        pregunta,
        contexto: pdfDatos?.texto_completo || "",
        historial: chatMsgs.slice(-6)
      })
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

  const calcularBalance = () => {
    const c = {}; NUTRIENTES.forEach(n => c[n] = 0)
    registros.forEach(r => { if (r.nutrientes) r.nutrientes.split(",").forEach(n => { if (c[n] !== undefined) c[n]++ }) })
    return c
  }

  const registrosFiltrados = () => {
    const hoy = new Date()
    return registros.filter(r => {
      if (filtro === "todo") return true
      if (!r.fecha) return false
      const f = new Date(r.fecha)
      if (filtro === "semana") { const h7 = new Date(hoy); h7.setDate(hoy.getDate() - 7); return f >= h7 }
      if (filtro === "mes") return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
      return true
    })
  }

  const balance = calcularBalance()
  const racha = calcularRacha()
  const masDebil = NUTRIENTES.reduce((a, b) => balance[a] <= balance[b] ? a : b)
  const metasCumplidas = NUTRIENTES.filter(n => balance[n] >= (metas[n] || 1)).length
  const balancePct = Math.round((NUTRIENTES.reduce((s, n) => s + Math.min(balance[n] / (metas[n] || 1), 1), 0) / 5) * 100)
  const dias = weekDays()
  const fechasSet = new Set(registros.map(r => r.fecha))

  const radarData = {
    labels: LABELS,
    datasets: [{ label: "Tu balance", data: NUTRIENTES.map(n => balance[n]), backgroundColor: "rgba(139,127,212,0.1)", borderColor: "#8B7FD4", borderWidth: 2, pointBackgroundColor: "#8B7FD4", pointRadius: 4 }]
  }
  const radarOpts = {
    scales: { r: { beginAtZero: true, ticks: { stepSize: 1, color: "#9CA3AF", font: { size: 10 } }, grid: { color: "rgba(26,24,22,0.07)" }, angleLines: { color: "rgba(26,24,22,0.07)" }, pointLabels: { color: "#6B7280", font: { size: 11, family: "Figtree" } } } },
    plugins: { legend: { display: false } }
  }

  const pageTitle = { inicio: "Dashboard", registro: "Registrar aprendizaje", estudiar: "Estudiar con PDF", balance: "Balance de nutrientes", historial: "Historial", quiz: "Mi Quiz", metas: "Metas Semanales", nivel: "Nivel de comprensión" }

  // ── AUTH ──
  if (!usuario) return (
    <>
      <style>{CSS}</style>
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
            <button className="google-btn" id="google-signin-btn" onClick={handleGoogleLogin}>
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
    </>
  )

  // ── APP PRINCIPAL ──
  return (
    <>
      <style>{CSS}</style>
      <div className="shell">
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
              <button className="sb-logout" title="Cerrar sesión" onClick={() => { setUsuario(null); setCaptchaOk(false); setResultado(null); setTexto(""); setPdfDatos(null) }}>
                <Icon name="logout" size={14} color="currentColor" />
              </button>
            </div>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div className="tb-left"><span className="tb-title">{pageTitle[vista]}</span></div>
            <div className="tb-right">
              <span className="tb-date"><Icon name="calendar" size={13} color="rgba(26,24,22,0.35)" />{new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}</span>
              {racha > 1 && (<div className="racha-pill"><Icon name="flame" size={13} color="#DCA84A" />{racha} días seguidos</div>)}
            </div>
          </div>

          <div className="content">

            {/* ── INICIO ── */}
            {vista === "inicio" && (
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
            )}

            {/* ── REGISTRO ── */}
            {vista === "registro" && (
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
            )}

            {/* ── ESTUDIAR PDF ── */}
            {vista === "estudiar" && (
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
                    {/* Header del PDF */}
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

                    {/* Tabs */}
                    <div className="pdf-tabs">
                      <button className={`pdf-tab ${pdfTab === "resumen" ? "active" : ""}`} onClick={() => setPdfTab("resumen")}><Icon name="lightbulb" size={14} color="currentColor" />Resumen</button>
                      <button className={`pdf-tab ${pdfTab === "chat" ? "active" : ""}`} onClick={() => setPdfTab("chat")}><Icon name="send" size={14} color="currentColor" />Preguntarle a la IA</button>
                      <button className={`pdf-tab ${pdfTab === "quiz" ? "active" : ""}`} onClick={() => { setPdfTab("quiz"); if (!quiz && !quizCargando) generarQuiz() }}><Icon name="quiz" size={14} color="currentColor" />Ponerte a prueba</button>
                    </div>

                    {/* Tab: Resumen */}
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

                    {/* Tab: Chat */}
                    {pdfTab === "chat" && (
                      <div className="card">
                        <div className="card-lbl">Chat con tu PDF</div>
                        <div className="chat-wrap">
                          <div className="chat-msgs">
                            {chatMsgs.map((m, i) => (
                              <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>
                            ))}
                            {chatCargando && <div className="chat-msg bot loading">Pensando…</div>}
                            <div ref={chatEndRef} />
                          </div>
                          <div className="chat-input-row">
                            <input
                              className="chat-input"
                              placeholder="Preguntá lo que quieras sobre el tema…"
                              value={chatInput}
                              onChange={e => setChatInput(e.target.value)}
                              onKeyDown={e => e.key === "Enter" && enviarChat()}
                              disabled={chatCargando}
                            />
                            <button className="chat-send" onClick={enviarChat} disabled={!chatInput.trim() || chatCargando}>
                              <Icon name="send" size={16} color="#fff" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab: Quiz */}
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
            )}

            {/* ── BALANCE ── */}
            {vista === "balance" && (
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
            )}

            {/* ── HISTORIAL ── */}
            {vista === "historial" && (
              <>
                <div className="page-hdr"><div className="page-greeting">Historial de aprendizajes</div><div className="page-sub">{registros.length} registro{registros.length !== 1 ? "s" : ""} en total · ordenados por fecha</div></div>
                <div className="hist-toolbar">
                  <div className="filtros" style={{ marginBottom: 0 }}>{[["todo", "Todos"], ["semana", "Esta semana"], ["mes", "Este mes"]].map(([v, l]) => (<button key={v} className={`fil-btn ${filtro === v ? "active" : ""}`} onClick={() => setFiltro(v)}>{l}</button>))}</div>
                  <span className="hist-count">{registrosFiltrados().length} resultado{registrosFiltrados().length !== 1 ? "s" : ""}</span>
                </div>
                <div className="card" style={{ marginTop: 13 }}>
                  {registrosFiltrados().length === 0 ? <div className="empty">No hay registros para este período</div> : registrosFiltrados().map((r, i) => (<div className="entry" key={i}><div className="entry-top"><span className="entry-date"><Icon name="calendar" size={11} color="rgba(26,24,22,0.55)" />{r.fecha || "Hoy"}</span><div style={{ display: "flex", gap: 8, alignItems: "center" }}><div className="entry-tags">{r.nutrientes && r.nutrientes.split(",").map(n => (<span key={n} className="tag" style={{ color: COLORES[n], borderColor: COLORES[n] + "66", background: COLORES_BG[n] }}><Icon name={NUTRIENTE_ICONS[n]} size={9} color={COLORES[n]} />{n.replace("_", " ")}</span>))}</div><button className="del-btn" onClick={() => eliminar(r.id)} title="Eliminar"><Icon name="trash" size={13} color="currentColor" /></button></div></div><div className="entry-text">"{r.texto}"</div>{r.resumen && <div className="entry-resumen">{r.resumen}</div>}</div>))}
                </div>
              </>
            )}

            
            {/* ── METAS SEMANALES ── */}
            {vista === "metas" && (
              <>
                <div className="page-hdr">
                  <div className="page-greeting">Metas Semanales</div>
                  <div className="page-sub">Define cuántos registros por nutriente quieres lograr esta semana.</div>
                </div>

                {/* Encabezado de semana + acciones */}
                <div className="card" style={{ marginBottom: 13 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontFamily: "'Figtree',sans-serif", fontWeight: 700, fontSize: 15, color: "#1A1816" }}>
                        {metasData ? `${metasData.semana_inicio} — ${metasData.semana_fin}` : "Semana actual"}
                      </div>
                      {metasData && (
                        <div style={{ fontSize: 12, color: "rgba(26,24,22,0.42)", marginTop: 2 }}>
                          Progreso total: {Object.values(metasData.progreso).reduce((a, b) => a + b, 0)} / {Object.values(metasData.metas).reduce((a, b) => a + b, 0)} registros
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button className="edit-btn" onClick={() => {
                        if (!metasEditando && metasData) setMetasForm({ tecnico: metasData.metas.tecnico || 5, conceptual: metasData.metas.conceptual || 5, aplicado: metasData.metas.aplicado || 5, soft_skills: metasData.metas.soft_skills || 5, contexto: metasData.metas.contexto || 5 })
                        setMetasEditando(!metasEditando)
                      }}>
                        <Icon name="edit" size={13} color="#8B7FD4" />{metasEditando ? "Cancelar" : "Editar metas"}
                      </button>
                      <button className="submit-btn" style={{ width: "auto", marginTop: 0, padding: "8px 16px", fontSize: 12 }} onClick={cargarMetas} disabled={metasCargando}>
                        {metasCargando ? "Cargando…" : "Actualizar"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grid de nutrientes */}
                <div className="meta-grid">
                  {NUTRIENTES.map((n, i) => {
                    const keyLow = n.toLowerCase()
                    const prog = metasData ? (metasData.progreso[keyLow] ?? metasData.progreso[n] ?? 0) : 0
                    const target = metasEditando
                      ? (metasForm[keyLow] || 1)
                      : (metasData ? (metasData.metas[keyLow] ?? metasData.metas[n] ?? METAS_DEFAULT[n]) : METAS_DEFAULT[n])
                    const pct = Math.min((prog / (target || 1)) * 100, 100)
                    const cumplida = prog >= target
                    return (
                      <div key={n} className="meta-item">
                        <div className="meta-top">
                          <div className="meta-icon" style={{ background: COLORES_BG[n] }}>
                            <Icon name={NUTRIENTE_ICONS[n]} size={14} color={COLORES[n]} />
                          </div>
                          <span className="meta-name">{LABELS[i]}</span>
                          {cumplida && !metasEditando && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#2D7A5B", background: "#EBF7F2", borderRadius: 20, padding: "2px 8px" }}>✓ meta</span>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div className="meta-count">{prog}</div>
                          <div style={{ fontSize: 12, color: "rgba(26,24,22,0.35)", fontWeight: 500 }}>
                            {metasEditando ? "de" : `/ ${target}`}
                          </div>
                          {metasEditando && (
                            <input
                              type="number"
                              min={1}
                              max={50}
                              className="meta-inp"
                              value={metasForm[keyLow] || ""}
                              onChange={e => setMetasForm({ ...metasForm, [keyLow]: parseInt(e.target.value) || 1 })}
                            />
                          )}
                        </div>

                        <div className="bar-bg2">
                          <div className="meta-bar" style={{ width: `${pct}%`, background: cumplida ? "#5DB896" : COLORES[n] }} />
                        </div>
                        <div className="meta-foot">{Math.round(pct)}% completado</div>
                      </div>
                    )
                  })}
                </div>

                {/* Botón guardar */}
                {metasEditando && (
                  <div style={{ display: "flex", gap: 8, marginTop: 4, justifyContent: "flex-end" }}>
                    <button className="submit-btn" style={{ width: "auto", padding: "10px 24px" }} onClick={guardarMetas} disabled={metasCargando}>
                      {metasCargando ? "Guardando…" : <><Icon name="check" size={14} color="#fff" />Guardar metas</>}
                    </button>
                  </div>
                )}

                {/* Badges */}
                <div className="card" style={{ marginTop: 13 }}>
                  <div className="card-lbl">Logros obtenidos</div>
                  {badges && badges.length > 0 ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {badges.map((b, i) => (
                        <div key={i} style={{ background: "#F0EEF9", border: "1.5px solid rgba(139,127,212,0.2)", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600, color: "#6857B8", display: "flex", alignItems: "center", gap: 6 }}>
                          <span>🏅</span>{b.nombre}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty">Completa tus metas semanales para ganar badges 🎯</div>
                  )}
                </div>
              </>
            )}

            {/* ── NIVEL DE COMPRENSIÓN ── */}
            {vista === "nivel" && (
              <>
                <div className="page-hdr">
                  <div className="page-greeting">Nivel de comprensión</div>
                  <div className="page-sub">Selecciona un tema registrado y la IA te explicará un resumen para que puedas reforzarlo.</div>
                </div>

                {ncPaso === "seleccionar" && (
                  <div className="card" style={{ maxWidth: 560 }}>
                    <div className="card-lbl">Selecciona el tema que quieres reforzar</div>
                    {registros.filter(r => r.tema && r.tema.trim()).length === 0 ? (
                      <div className="empty">Aún no tienes registros con tema. Ve a Registrar y escribe el nombre del tema.</div>
                    ) : (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                          {[...new Map(registros.filter(r => r.tema && r.tema.trim()).map(r => [r.tema.trim().toLowerCase(), r])).values()].map((r, i) => (
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
                        <button className="submit-btn" disabled={!ncTemaSeleccionado || ncCargando}
                          onClick={async () => {
                            if (!ncTemaSeleccionado) return
                            setNcCargando(true)
                            const primerMsg = { rol: "assistant", texto: "⏳ Generando tu resumen personalizado…" }
                            setNcMsgs([primerMsg])
                            setNcPaso("chat")
                            try {
                              const r = await axios.post(`${API}/nivel/resumen`, {
                                tema: ncTemaSeleccionado.tema,
                                descripcion: ncTemaSeleccionado.texto,
                              })
                              setNcMsgs([{ rol: "assistant", texto: r.data.respuesta }])
                            } catch {
                              setNcMsgs([{ rol: "assistant", texto: "Hubo un error al conectar con la IA. Intenta de nuevo." }])
                            }
                            setNcCargando(false)
                          }}>
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
                          padding: "11px 15px",
                          fontSize: 14,
                          lineHeight: 1.6,
                          fontFamily: "'Figtree',sans-serif",
                          whiteSpace: "pre-wrap"
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
                        onKeyDown={async e => {
                          if (e.key === "Enter" && ncInput.trim() && !ncCargando) {
                            const pregunta = ncInput.trim()
                            setNcInput("")
                            const historial = [...ncMsgs, { rol: "user", texto: pregunta }]
                            setNcMsgs(historial)
                            setNcCargando(true)
                            try {
                              const r = await axios.post(`${API}/nivel/chat`, {
                                tema: ncTemaSeleccionado?.tema || "",
                                historial,
                              })
                              setNcMsgs([...historial, { rol: "assistant", texto: r.data.respuesta }])
                            } catch {
                              setNcMsgs([...historial, { rol: "assistant", texto: "Error al conectar. Intenta de nuevo." }])
                            }
                            setNcCargando(false)
                          }
                        }}
                      />
                      <button className="submit-btn" style={{ width: "auto", marginTop: 0, paddingLeft: 16, paddingRight: 16, flexShrink: 0 }}
                        disabled={!ncInput.trim() || ncCargando}
                        onClick={async () => {
                          const pregunta = ncInput.trim()
                          if (!pregunta || ncCargando) return
                          setNcInput("")
                          const historial = [...ncMsgs, { rol: "user", texto: pregunta }]
                          setNcMsgs(historial)
                          setNcCargando(true)
                          try {
                            const r = await axios.post(`${API}/nivel/chat`, {
                              tema: ncTemaSeleccionado?.tema || "",
                              historial,
                            })
                            setNcMsgs([...historial, { rol: "assistant", texto: r.data.respuesta }])
                          } catch {
                            setNcMsgs([...historial, { rol: "assistant", texto: "Error al conectar. Intenta de nuevo." }])
                          }
                          setNcCargando(false)
                        }}>
                        <Icon name="send" size={14} color="#fff" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}


            {vista === "quiz" && <Quiz usuario={usuario} />}

          </div>
        </div>
      </div>
    </>
  )
}