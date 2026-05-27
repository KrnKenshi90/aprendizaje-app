-- Tabla para metas semanales
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
);

-- Tabla para badges/logros
CREATE TABLE IF NOT EXISTS badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuario_id INT NOT NULL,
  tipo VARCHAR(50),
  nombre VARCHAR(100),
  descripcion TEXT,
  fecha_obtenido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
