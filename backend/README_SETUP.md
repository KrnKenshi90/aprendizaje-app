Pasos para configurar el entorno backend (Windows PowerShell):

1. Abrir PowerShell en la carpeta `backend`.
2. Ejecutar el script de setup (requiere permisos de ejecución):

   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\setup_env.ps1

3. Seleccionar el intérprete de Python en VSCode: "Python: Select Interpreter" → elegir `./backend/.venv`.
4. Reiniciar VSCode (o recargar ventana) para que Pylance detecte las dependencias instaladas.

Comandos manuales alternativos:

python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

Luego iniciar backend:

python run.py

