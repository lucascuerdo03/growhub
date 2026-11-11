#!/bin/bash
# Arranca GrowHub en macOS con doble clic: abre la Terminal con dos pestañas en
# la carpeta del proyecto, una con la app (npm run dev) y otra con el puente del
# nodo (npm run bridge:serial), con caffeinate para que el Mac no se duerma
# mientras el puente está en marcha. No contiene claves: la configuración está
# en .env y bridge/.env, que no se suben al repositorio.
#
# Para pararlo, Ctrl+C en cada pestaña.

PROYECTO="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

if [ ! -f "$PROYECTO/bridge/.env" ]; then
  echo "Falta bridge/.env: copia bridge/.env.example y rellénalo (ver bridge/README.md)."
fi

# Segunda pestaña con el puente. Abrir una pestaña exige que la Terminal tenga
# permiso de Accesibilidad (Ajustes del Sistema > Privacidad y seguridad >
# Accesibilidad); si no lo tiene, el puente se abre en una ventana aparte.
osascript - "$PROYECTO" <<'APPLESCRIPT'
on run argv
  set proyecto to item 1 of argv
  set orden to "cd " & quoted form of proyecto & " && caffeinate -i npm run bridge:serial"
  tell application "Terminal" to activate
  try
    tell application "System Events" to keystroke "t" using command down
    delay 0.6
    tell application "Terminal" to do script orden in front window
  on error
    tell application "Terminal" to do script orden
  end try
end run
APPLESCRIPT

# Esta pestaña: la app.
cd "$PROYECTO" || exit 1
echo "GrowHub: arrancando la app en $PROYECTO"
exec npm run dev
