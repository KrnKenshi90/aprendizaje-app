# Crea un virtualenv en .venv e instala dependencias (Windows PowerShell)
python -m venv .venv

# Ruta al ejecutable de python del venv
$venvPython = Join-Path -Path $PSScriptRoot -ChildPath ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
	Write-Error "No se encontró el intérprete en .venv. Comprueba que python está instalado y vuelve a intentarlo."
	exit 1
}

Write-Output "Instalando dependencias usando: $venvPython"
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $PSScriptRoot 'requirements.txt')

Write-Output "Instalación completada. Para activar el entorno en tu sesión actual ejecuta: .\\.venv\\Scripts\\Activate.ps1"
Write-Output "Selecciona el intérprete .venv en VSCode (Command Palette → Python: Select Interpreter) y recarga la ventana para que Pylance detecte las librerías instaladas."