import mysql.connector
from dotenv import load_dotenv
import os
from datetime import date, timedelta

load_dotenv()

def get_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "aprendizaje_db"),
        port=int(os.getenv("MYSQL_PORT", 3306)),
    )

def guardar_registro(texto, resumen, nutrientes, usuario_id=None, tema=None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO registros (texto, resumen, nutrientes, fecha, usuario_id, tema)
        VALUES (%s, %s, %s, CURDATE(), %s, %s)
        """,
        (texto, resumen, ",".join(nutrientes), usuario_id, tema),
    )
    conn.commit()
    # Después de guardar, comprobar metas semanales y otorgar badges si corresponde
    try:
        _check_and_award_badges(conn, usuario_id)
    except Exception:
        # No interrumpir el guardado si la lógica de badges falla
        pass
    cursor.close()
    conn.close()


def _get_lunes_actual():
    hoy = date.today()
    return hoy - timedelta(days=hoy.weekday())


def _check_and_award_badges(conn, usuario_id):
    """Comprueba el progreso de la semana actual y otorga badges por metas alcanzadas.
    Usa la conexión `conn` abierta para ejecutar las consultas.
    """
    if not usuario_id:
        return
    cursor = conn.cursor(dictionary=True)
    lunes = _get_lunes_actual()

    # Asegurar que existan metas para la semana (mismos defaults que backend)
    cursor.execute("""
        SELECT tecnico, conceptual, aplicado, soft_skills, contexto
        FROM metas_semanales
        WHERE usuario_id = %s AND semana_inicio = %s
    """, (usuario_id, lunes))
    metas = cursor.fetchone()
    if not metas:
        cursor.execute("""
            INSERT INTO metas_semanales (usuario_id, semana_inicio, tecnico, conceptual, aplicado, soft_skills, contexto)
            VALUES (%s, %s, 5, 5, 5, 5, 5)
        """, (usuario_id, lunes))
        conn.commit()
        metas = {"tecnico": 5, "conceptual": 5, "aplicado": 5, "soft_skills": 5, "contexto": 5}

    # Contar registros de la semana por usuario
    cursor.execute("""
        SELECT nutrientes FROM registros
        WHERE usuario_id = %s AND fecha >= %s AND fecha < DATE_ADD(%s, INTERVAL 7 DAY)
    """, (usuario_id, lunes, lunes))
    rows = cursor.fetchall()

    progreso = {"TECNICO": 0, "CONCEPTUAL": 0, "APLICADO": 0, "SOFT_SKILLS": 0, "CONTEXTO": 0}
    for r in rows:
        vals = r.get("nutrientes") or ""
        for n in [x.strip() for x in vals.split(",") if x.strip()]:
            if n in progreso:
                progreso[n] += 1

    # Para cada nutriente que alcanzó la meta, insertar badge si no existe
    for nutriente, conteo in progreso.items():
        key = nutriente
        objetivo = metas.get(key.lower(), 0)
        if objetivo and conteo >= objetivo:
            # Construir un nombre único por usuario/semana/nutriente
            nombre_badge = f"Meta alcanzada: {key} {lunes.isoformat()}"
            cursor.execute("""
                SELECT id FROM badges WHERE usuario_id = %s AND tipo = %s AND nombre = %s
            """, (usuario_id, 'meta', nombre_badge))
            existe = cursor.fetchone()
            if not existe:
                cursor.execute("""
                    INSERT INTO badges (usuario_id, tipo, nombre, descripcion)
                    VALUES (%s, %s, %s, %s)
                """, (usuario_id, 'meta', nombre_badge, f"Alcanzó la meta de {key} para la semana {lunes.isoformat()}"))
                conn.commit()

    # Si todas las metas están cumplidas, marcar la fila como completada
    todas = True
    for k, v in progreso.items():
        objetivo = metas.get(k.lower(), 0)
        if v < (objetivo or 0):
            todas = False
            break
    if todas:
        cursor.execute("""
            UPDATE metas_semanales SET completada = TRUE WHERE usuario_id = %s AND semana_inicio = %s
        """, (usuario_id, lunes))
        conn.commit()

    cursor.close()

def obtener_registros(usuario_id=None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    if usuario_id:
        cursor.execute("""
            SELECT id, texto, resumen, nutrientes,
                   DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
                   usuario_id, tema
            FROM registros
            WHERE usuario_id = %s
            ORDER BY fecha DESC, id DESC
            LIMIT 100
            """,
            (usuario_id,),
        )
    else:
        cursor.execute("""
            SELECT id, texto, resumen, nutrientes,
                   DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha,
                   usuario_id, tema
            FROM registros
            ORDER BY fecha DESC, id DESC
            LIMIT 100
            """
        )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows