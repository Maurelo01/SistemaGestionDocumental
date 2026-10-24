#!/usr/bin/env bash
set -e

echo "SISTEMA DE GESTIÓN DOCUMENTAL - Inicio"

RUTA_RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v systemctl >/dev/null 2>&1; then
  if ! systemctl is-active --quiet mongod 2>/dev/null; then
    echo "[1/5] Iniciando servicio MongoDB (mongod)..."
    sudo systemctl start mongod || true
  else
    echo "[1/5] Servicio MongoDB detectado y activo."
  fi
fi

echo "[2/5] Configurando entorno del Backend..."
cd "$RUTA_RAIZ/backend"

if [ ! -f ".env" ]; then
  cat <<EOF > .env
PUERTO=3000
MONGODB_URI=mongodb://127.0.0.1:27017/gestor_documentos
JWT_SECRETO=1234
JWT_EXPIRACION=24h
EOF
  echo "      Archivo backend/.env generado automáticamente."
fi

echo "[3/5] Instalando dependencias del Backend..."
npm install

echo "[4/5] Inicializando Base de Datos MongoDB (Seed Inicial)..."
npm run seed

echo "[5/5] Instalando dependencias del Frontend (Angular 21)..."
cd "$RUTA_RAIZ/frontend"
npm install

limpiar_procesos() {
  echo ""
  echo "Deteniendo servidores Backend y Frontend..."
  kill $PID_BACKEND $PID_FRONTEND 2>/dev/null || true
  exit 0
}
trap limpiar_procesos SIGINT SIGTERM

echo "  LEVANTANDO SERVIDORES..."
echo "  -> Backend: http://localhost:3000/api/v1"
echo "  -> Frontend: http://localhost:4200"

cd "$RUTA_RAIZ/backend"
npm start &
PID_BACKEND=$!

cd "$RUTA_RAIZ/frontend"
npx ng serve --open &
PID_FRONTEND=$!

wait
