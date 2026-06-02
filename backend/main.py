from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv
from database import guardar_registro, obtener_registros, get_connection
import os, json, re
import bcrypt
import hashlib

load_dotenv()
app = FastAPI()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Contraseñas ────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    if hashed.startswith("$2b$") or hashed.startswith("$2a$"):
        return bcrypt.checkpw(password.encode(), hashed.encode())
    else:
        return hashlib.sha256(password.encode()).hexdigest() == hashed

def _migrar_hash(usuario_id: int, password: str, hashed: str):
    if not (hashed.startswith("$2b$") or hashed.startswith("$2a$")):
        nuevo = hash_password(password)
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("UPDATE usuarios SET password = %s WHERE id = %s", (nuevo, usuario_id))
        conn.commit()
        cur.close()
        conn.close()


# ── Health check ───────────────────────────────────────────
@app.get("/")
def root():
    return {"mensaje": "Backend funcionando ✓"}


# ── Auth ───────────────────────────────────────────────────
@app.post("/registro")
def registro(data: dict):
    nombre   = (data.get("nombre") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not nombre or not email or not password:
        raise HTTPException(status_code=422, detail="Faltan campos requeridos")
    if len(password) < 6:
        raise HTTPException(status_code=422, detail="La contraseña debe tener al menos 6 caracteres")

    hashed = hash_password(password)
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO usuarios (nombre, email, password) VALUES (%s, %s, %s)",
            (nombre, email, hashed),
        )
        conn.commit()
        return {"mensaje": "Usuario registrado correctamente"}
    except Exception:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    finally:
        cursor.close()
        conn.close()


@app.post("/login")
def login(data: dict):
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, nombre, password FROM usuarios WHERE email = %s",
        (email,),
    )
    usuario = cursor.fetchone()
    cursor.close()
    conn.close()

    if not usuario or not verify_password(password, usuario["password"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    _migrar_hash(usuario["id"], password, usuario["password"])
    return {"id": usuario["id"], "nombre": usuario["nombre"]}


# ── Google OAuth ────────────────────────────────────────────
import requests as http_requests

@app.post("/auth/google")
def auth_google(data: dict):
    """Recibe el token de Google del frontend y verifica con Google."""
    token = data.get("token") or ""
    if not token:
        raise HTTPException(status_code=422, detail="Token de Google requerido")

    # Verificar el token con la API de Google
    try:
        resp = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"},
            timeout=8,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Token de Google inválido")
        info = resp.json()
    except Exception:
        raise HTTPException(status_code=401, detail="No se pudo verificar el token de Google")

    google_id = info.get("sub")
    email     = (info.get("email") or "").lower()
    nombre    = info.get("name") or email.split("@")[0]

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="No se pudo obtener datos del perfil de Google")

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Buscar usuario por google_id o por email
    cursor.execute(
        "SELECT id, nombre FROM usuarios WHERE google_id = %s OR email = %s LIMIT 1",
        (google_id, email),
    )
    usuario = cursor.fetchone()

    if usuario:
        # Si existe pero no tiene google_id guardado, actualizarlo
        cursor.execute(
            "UPDATE usuarios SET google_id = %s WHERE id = %s AND google_id IS NULL",
            (google_id, usuario["id"]),
        )
        conn.commit()
        cursor.close()
        conn.close()
        return {"id": usuario["id"], "nombre": usuario["nombre"]}
    else:
        # Crear nuevo usuario con Google
        cursor.execute(
            "INSERT INTO usuarios (nombre, email, password, google_id) VALUES (%s, %s, %s, %s)",
            (nombre, email, "", google_id),
        )
        conn.commit()
        nuevo_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return {"id": nuevo_id, "nombre": nombre}


# ── Clasificación IA ───────────────────────────────────────
def _extraer_json(texto: str) -> dict:
    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", texto, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError("No se pudo parsear la respuesta de la IA")


NUTRIENTES_VALIDOS = {"TECNICO", "CONCEPTUAL", "APLICADO", "SOFT_SKILLS", "CONTEXTO"}

@app.post("/clasificar")
async def clasificar(data: dict):
    texto      = (data.get("texto") or "").strip()
    usuario_id = data.get("usuario_id")
    tema       = (data.get("tema") or "").strip() or None

    if not texto:
        raise HTTPException(status_code=422, detail="El texto no puede estar vacío")

    respuesta = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "Eres un clasificador de aprendizaje para estudiantes.\n"
                    "Dado el texto clasifícalo en nutrientes del conocimiento.\n"
                    "Responde SOLO con JSON sin texto extra ni bloques de codigo:\n"
                    '{"nutrientes": ["TECNICO"], "resumen": "descripcion breve"}\n'
                    "Nutrientes posibles: TECNICO, CONCEPTUAL, APLICADO, SOFT_SKILLS, CONTEXTO"
                ),
            },
            {"role": "user", "content": texto},
        ],
        temperature=0.1,
    )

    raw = respuesta.choices[0].message.content
    try:
        resultado = _extraer_json(raw)
    except Exception:
        raise HTTPException(status_code=502, detail="La IA devolvio una respuesta inesperada")

    nutrientes = [n for n in resultado.get("nutrientes", []) if n in NUTRIENTES_VALIDOS]
    if not nutrientes:
        nutrientes = ["CONCEPTUAL"]

    resumen = resultado.get("resumen", "Sin resumen")
    guardar_registro(texto, resumen, nutrientes, usuario_id, tema)
    return {"nutrientes": nutrientes, "resumen": resumen}


# ── Registros ──────────────────────────────────────────────
@app.get("/registros/{usuario_id}")
def get_registros(usuario_id: int):
    return obtener_registros(usuario_id)


@app.delete("/registros/{registro_id}")
def eliminar_registro(registro_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM registros WHERE id = %s", (registro_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensaje": "Registro eliminado"}


# ── PDF: Subir y analizar ───────────────────────────────────
@app.post("/pdf/analizar")
async def analizar_pdf(file: UploadFile = File(...)):
    """Recibe un PDF, extrae el texto y devuelve resumen + puntos clave."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=422, detail="Solo se aceptan archivos PDF")

    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise HTTPException(status_code=500, detail="PyMuPDF no instalado. Ejecuta: pip install pymupdf")

    contenido = await file.read()
    try:
        doc = fitz.open(stream=contenido, filetype="pdf")
        texto_pdf = ""
        for pagina in doc:
            texto_pdf += pagina.get_text()
        doc.close()
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"No se pudo leer el PDF: {str(e)}")

    if not texto_pdf.strip():
        raise HTTPException(status_code=422, detail="El PDF no tiene texto legible (puede ser una imagen escaneada)")

    # Limitar texto para no exceder tokens del modelo
    texto_recortado = texto_pdf[:8000]

    respuesta = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "Sos un tutor amigo de adolescentes. Hablás de forma relajada, clara y directa, "
                    "como si le explicaras a un amigo. Usás ejemplos del día a día. "
                    "Nunca usás lenguaje técnico difícil sin explicarlo. "
                    "Responde SOLO con JSON sin texto extra:\n"
                    '{"resumen": "explicacion corta y clara del tema principal", '
                    '"puntos_clave": ["punto 1", "punto 2", "punto 3", "punto 4", "punto 5"], '
                    '"consejo": "un consejo amigable para entender mejor este tema", '
                    '"titulo": "titulo corto del documento"}'
                ),
            },
            {
                "role": "user",
                "content": f"Analizá este texto de estudio y explicámelo:\n\n{texto_recortado}"
            },
        ],
        temperature=0.3,
    )

    raw = respuesta.choices[0].message.content
    try:
        resultado = _extraer_json(raw)
    except Exception:
        raise HTTPException(status_code=502, detail="La IA no pudo analizar el PDF")

    return {
        "titulo": resultado.get("titulo", file.filename),
        "resumen": resultado.get("resumen", ""),
        "puntos_clave": resultado.get("puntos_clave", []),
        "consejo": resultado.get("consejo", ""),
        "texto_completo": texto_pdf[:12000],  # guardamos para el chat
    }


# ── PDF: Chat ───────────────────────────────────────────────
@app.post("/pdf/chat")
async def chat_pdf(data: dict):
    """Responde preguntas sobre el contenido del PDF cargado."""
    pregunta   = (data.get("pregunta") or "").strip()
    contexto   = (data.get("contexto") or "").strip()
    historial  = data.get("historial") or []

    if not pregunta:
        raise HTTPException(status_code=422, detail="La pregunta no puede estar vacía")
    if not contexto:
        raise HTTPException(status_code=422, detail="No hay PDF cargado")

    mensajes = [
        {
            "role": "system",
            "content": (
                "Sos un tutor copado que ayuda a estudiantes adolescentes. "
                "Tenés acceso al contenido de un documento de estudio. "
                "Respondé siempre de forma clara, amigable y con ejemplos del día a día. "
                "Si la pregunta no tiene que ver con el documento, responde ÚNICAMENTE: 'Esa pregunta no está relacionada con el documento. ¿Tenés alguna duda sobre el tema de estudio?' y no agregues nada más. "
                "Hablá en español, informal pero respetuoso. Sé conciso.\n\n"
                f"CONTENIDO DEL DOCUMENTO:\n{contexto[:6000]}"
            ),
        }
    ]

    # Agregar historial previo de la conversación
    for msg in historial[-6:]: # últimos 6 mensajes para no pasarse de tokens
        role = msg.get("role") or msg.get("rol")
        content = msg.get("content") or msg.get("contenido") or msg.get("texto", "")
        if role in ("user", "assistant") and content:
            mensajes.append({"role": role, "content": content})

    mensajes.append({"role": "user", "content": pregunta})

    respuesta = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=mensajes,
        temperature=0.5,
    )

    return {"respuesta": respuesta.choices[0].message.content}


# ── PDF: Quiz ───────────────────────────────────────────────
@app.post("/pdf/quiz")
async def generar_quiz(data: dict):
    """Genera preguntas de práctica basadas en el PDF."""
    contexto = (data.get("contexto") or "").strip()

    if not contexto:
        raise HTTPException(status_code=422, detail="No hay PDF cargado")

    respuesta = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "Generás preguntas de práctica para adolescentes basadas en un texto. "
                    "Las preguntas deben ser claras, con 4 opciones y una sola respuesta correcta. "
                    "Responde SOLO con JSON sin texto extra:\n"
                    '{"preguntas": ['
                    '{"pregunta": "texto", "opciones": ["A", "B", "C", "D"], "correcta": 0, "explicacion": "por que es correcta"}'
                    ']}'
                    "\nGenera exactamente 5 preguntas variadas del tema."
                ),
            },
            {
                "role": "user",
                "content": f"Generá 5 preguntas de práctica sobre este texto:\n\n{contexto[:6000]}"
            },
        ],
        temperature=0.4,
    )

    raw = respuesta.choices[0].message.content
    try:
        resultado = _extraer_json(raw)
    except Exception:
        raise HTTPException(status_code=502, detail="La IA no pudo generar el quiz")

    return resultado

@app.post("/quiz/generar")
async def generar_quiz_historial(data: dict):
    usuario_id = data.get("usuario_id")
    cantidad = data.get("cantidad", 10)

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT texto, resumen, nutrientes FROM registros 
        WHERE usuario_id = %s ORDER BY fecha DESC LIMIT 20
    """, (usuario_id,))
    registros = cursor.fetchall()
    cursor.close()
    conn.close()

    if registros:
        contexto = "\n".join([f"- {r['texto']}" for r in registros])
        prompt_contexto = f"El estudiante ha aprendido sobre los siguientes temas:\n{contexto}"
        nivel = "basado en sus aprendizajes registrados"
    else:
        prompt_contexto = "El estudiante es nuevo y no tiene registros previos."
        nivel = "nivel básico general para evaluar conocimientos previos"

    respuesta = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    f"Eres un evaluador educativo experto que crea exámenes de alta calidad.\n"
                    f"Genera exactamente {cantidad} preguntas mezclando DOS tipos:\n"
                    "- 'opcion_multiple': 4 opciones, una correcta, con explicación detallada\n"
                    "- 'completar': frase con ___, 4 opciones de respuesta, una correcta\n\n"
                    "Las preguntas deben ser desafiantes, precisas y educativas.\n"
                    "Responde SOLO con JSON sin texto extra:\n"
                    '{"preguntas": ['
                    '{"tipo": "opcion_multiple", "pregunta": "texto", "opciones": ["A","B","C","D"], "correcta": 0, "explicacion": "explicacion detallada"},'
                    '{"tipo": "completar", "pregunta": "El ___ es el proceso por el cual...", "opciones": ["termino1","termino2","termino3","termino4"], "correcta": 0, "explicacion": "explicacion detallada"}'
                    ']}'
                )
            },
            {
                "role": "user",
                "content": f"{prompt_contexto}\n\nGenera exactamente {cantidad} preguntas variadas ({nivel}). Mezcla opcion multiple y completar. Asegurate que sean desafiantes y educativas."
            }
        ],
        temperature=0.6,
    )

    raw = respuesta.choices[0].message.content
    try:
        resultado = _extraer_json(raw)
    except Exception:
        raise HTTPException(status_code=502, detail="Error generando el quiz")

    return resultado


@app.post("/quiz/guardar")
async def guardar_resultado_quiz(data: dict):
    usuario_id = data.get("usuario_id")
    puntaje = data.get("puntaje")
    total = data.get("total")

    if usuario_id is None or puntaje is None or total is None:
        raise HTTPException(status_code=422, detail="Faltan campos requeridos: usuario_id, puntaje, total")
    if not isinstance(total, (int, float)) or total <= 0:
        raise HTTPException(status_code=422, detail="El campo total debe ser un número positivo")

    porcentaje = round((puntaje / total) * 100)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO quiz_resultados (usuario_id, puntaje, total, porcentaje, fecha)
        VALUES (%s, %s, %s, %s, CURDATE())
    """, (usuario_id, puntaje, total, porcentaje))
    conn.commit()
    cursor.close()
    conn.close()
    return {"mensaje": "Resultado guardado", "porcentaje": porcentaje}


@app.get("/quiz/historial/{usuario_id}")
async def historial_quiz(usuario_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT puntaje, total, porcentaje, 
               DATE_FORMAT(fecha, '%Y-%m-%d') as fecha
        FROM quiz_resultados 
        WHERE usuario_id = %s 
        ORDER BY fecha DESC, id DESC
        LIMIT 30
    """, (usuario_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


# ── Metas Semanales ────────────────────────────────────────
from datetime import datetime, timedelta

def obtener_lunes_actual():
    """Retorna la fecha del lunes de esta semana"""
    hoy = datetime.now().date()
    return hoy - timedelta(days=hoy.weekday())

@app.get("/metas/semana/{usuario_id}")
def obtener_metas_semana(usuario_id: int):
    """Obtiene las metas de esta semana y el progreso actual"""
    lunes = obtener_lunes_actual()
    
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Obtener metas de esta semana
    cursor.execute("""
        SELECT tecnico, conceptual, aplicado, soft_skills, contexto 
        FROM metas_semanales 
        WHERE usuario_id = %s AND semana_inicio = %s
    """, (usuario_id, lunes))
    metas_row = cursor.fetchone()
    
    # Si no existen, crear con defaults
    if not metas_row:
        cursor.execute("""
            INSERT INTO metas_semanales 
            (usuario_id, semana_inicio, tecnico, conceptual, aplicado, soft_skills, contexto)
            VALUES (%s, %s, 5, 5, 5, 5, 5)
        """, (usuario_id, lunes))
        conn.commit()
        metas_row = {
            "tecnico": 5, "conceptual": 5, "aplicado": 5, 
            "soft_skills": 5, "contexto": 5
        }
    
    # Obtener progreso de registros esta semana
    cursor.execute("""
        SELECT nutrientes FROM registros 
        WHERE usuario_id = %s AND fecha >= %s AND fecha < DATE_ADD(%s, INTERVAL 7 DAY)
    """, (usuario_id, lunes, lunes))
    registros = cursor.fetchall()
    
    progreso = {"TECNICO": 0, "CONCEPTUAL": 0, "APLICADO": 0, "SOFT_SKILLS": 0, "CONTEXTO": 0}
    for reg in registros:
        if reg["nutrientes"]:
            nutrientes = reg["nutrientes"].split(",")
            for n in nutrientes:
                n = n.strip()
                if n in progreso:
                    progreso[n] += 1
    
    cursor.close()
    conn.close()
    
    return {
        "semana_inicio": str(lunes),
        "semana_fin": str(lunes + timedelta(days=6)),
        "metas": metas_row,
        "progreso": progreso,
        "completada": all(
            progreso[k] >= int(metas_row[k.lower()] or 0)
            for k in progreso.keys()
        )
    }

@app.post("/metas/semana/actualizar")
def actualizar_metas_semana(data: dict):
    """Actualiza las metas de esta semana"""
    usuario_id = data.get("usuario_id")
    lunes = obtener_lunes_actual()
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE metas_semanales SET 
        tecnico = %s, conceptual = %s, aplicado = %s, 
        soft_skills = %s, contexto = %s
        WHERE usuario_id = %s AND semana_inicio = %s
    """, (
        data.get("tecnico", 5),
        data.get("conceptual", 5),
        data.get("aplicado", 5),
        data.get("soft_skills", 5),
        data.get("contexto", 5),
        usuario_id,
        lunes
    ))
    conn.commit()
    cursor.close()
    conn.close()
    
    return {"mensaje": "Metas actualizadas"}

@app.get("/metas/historial/{usuario_id}")
def historial_metas(usuario_id: int):
    """Retorna historial de metas de las últimas 8 semanas"""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT semana_inicio, tecnico, conceptual, aplicado, soft_skills, 
               contexto, completada
        FROM metas_semanales 
        WHERE usuario_id = %s 
        ORDER BY semana_inicio DESC LIMIT 8
    """, (usuario_id,))
    metas = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return metas

@app.get("/badges/{usuario_id}")
def obtener_badges(usuario_id: int):
    """Obtiene los badges del usuario"""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT tipo, nombre, descripcion, fecha_obtenido 
        FROM badges 
        WHERE usuario_id = %s 
        ORDER BY fecha_obtenido DESC
    """, (usuario_id,))
    badges = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return badges

@app.post("/badges/otorgar")
def otorgar_badge(data: dict):
    """Otorga un badge al usuario (uso interno)"""
    usuario_id = data.get("usuario_id")
    tipo = data.get("tipo")  # "consistencia", "primeros_pasos", etc
    nombre = data.get("nombre")
    descripcion = data.get("descripcion", "")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO badges (usuario_id, tipo, nombre, descripcion)
            VALUES (%s, %s, %s, %s)
        """, (usuario_id, tipo, nombre, descripcion))
        conn.commit()
        cursor.close()
        conn.close()
        return {"mensaje": "Badge otorgado"}
    except Exception as e:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Error otorgando badge")


# ── Nivel de comprensión ───────────────────────────────────

@app.post("/nivel/resumen")
async def nivel_resumen(data: dict):
    """Genera el resumen inicial del tema seleccionado."""
    tema = (data.get("tema") or "").strip()
    descripcion = (data.get("descripcion") or "").strip()

    if not tema:
        raise HTTPException(status_code=422, detail="Falta el tema")

    respuesta = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": f"""Eres un tutor amigable y claro. El estudiante registró este aprendizaje:

TEMA: "{tema}"
DESCRIPCIÓN: "{descripcion}"

Haz un resumen explicativo del tema en máximo 5 puntos clave, usando lenguaje simple y motivador. Al final invita al estudiante a hacerte preguntas sobre el tema."""
            }
        ],
        max_tokens=1000,
        temperature=0.5,
    )
    texto = respuesta.choices[0].message.content or "No pude generar el resumen."
    return {"respuesta": texto}


@app.post("/nivel/chat")
async def nivel_chat(data: dict):
    """Responde preguntas del estudiante sobre el tema."""
    historial = data.get("historial") or []
    tema = (data.get("tema") or "").strip()

    if not historial:
        raise HTTPException(status_code=422, detail="Falta el historial")

    messages = [
        {
            "role": "system",
            "content": (
                f"Eres un tutor educativo estricto. Tu ÚNICO rol es ayudar al estudiante a entender el tema: '{tema}'. "
                f"REGLAS ABSOLUTAS que debes cumplir siempre:\n"
                f"1. Solo puedes hablar sobre '{tema}' y conceptos directamente relacionados.\n"
                f"2. Si el estudiante pregunta algo que NO tiene relación con '{tema}', responde exactamente: "
                f"'Esa pregunta está fuera del tema. Estamos estudiando \"{tema}\". ¿Tienes alguna duda sobre ese tema?'\n"
                f"3. No hagas excepciones aunque el estudiante insista o diga que es parte del tema.\n"
                f"4. Responde de forma simple, clara y con ejemplos relacionados a '{tema}'."
            )
        }
    ]
    for m in historial:
        role = "user" if m.get("rol") == "user" else "assistant"
        messages.append({"role": role, "content": m.get("texto", "")})

    respuesta = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1000,
        temperature=0.3,
    )
    texto = respuesta.choices[0].message.content or "No pude responder."
    return {"respuesta": texto}


if __name__ == "__main__":
    pass