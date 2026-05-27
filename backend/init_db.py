"""
Ejecutar UNA VEZ para crear las tablas si no existen.
No borra datos existentes (usa CREATE TABLE IF NOT EXISTS).
"""
from database import get_connection

conn = get_connection()
cursor = conn.cursor()

# BUGFIX: el original solo creaba 'usuarios' y hacia DROP.
# Ahora crea ambas tablas de forma segura.

cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        nombre     VARCHAR(100) NOT NULL,
        email      VARCHAR(100) UNIQUE NOT NULL,
        password   VARCHAR(255) NOT NULL,
        creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
print("✅ Tabla 'usuarios' lista")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS registros (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        texto      TEXT NOT NULL,
        resumen    VARCHAR(500),
        nutrientes VARCHAR(200),
        fecha      DATE,
        usuario_id INT,
        tema       VARCHAR(200),
        creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
""")
print("✅ Tabla 'registros' lista")

cursor.execute("""
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'registros'
      AND COLUMN_NAME = 'tema'
""")
if cursor.fetchone()[0] == 0:
    cursor.execute("ALTER TABLE registros ADD COLUMN tema VARCHAR(200)")
print("✅ Columna 'tema' en registros comprobada")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS metas_semanales (
      id INT PRIMARY KEY AUTO_INCREMENT,
      usuario_id INT NOT NULL,
      semana_inicio DATE NOT NULL,
      tecnico INT DEFAULT 5,
      conceptual INT DEFAULT 5,
      aplicado INT DEFAULT 5,
      soft_skills INT DEFAULT 5,
      contexto INT DEFAULT 5,
      completada BOOLEAN DEFAULT FALSE,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_week (usuario_id, semana_inicio)
    )
""")
print("✅ Tabla 'metas_semanales' lista")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS badges (
      id INT PRIMARY KEY AUTO_INCREMENT,
      usuario_id INT NOT NULL,
      tipo VARCHAR(50),
      nombre VARCHAR(100),
      descripcion TEXT,
      fecha_obtenido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
""")
print("✅ Tabla 'badges' lista")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_resultados (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        puntaje    INT NOT NULL,
        total      INT NOT NULL,
        porcentaje INT NOT NULL,
        fecha      DATE,
        creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
""")
print("✅ Tabla 'quiz_resultados' lista")

conn.commit()
cursor.close()
conn.close()
print("\n✅ Base de datos inicializada correctamente")