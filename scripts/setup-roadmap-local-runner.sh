#!/usr/bin/env bash
set -euo pipefail

REPO="${ADF_RUNNER_REPO:-Carlomadella/gioco-rap}"
RUNNER_DIR="${ADF_RUNNER_DIR:-$HOME/actions-runner-anni-di-fame}"
RUNNER_NAME="${ADF_RUNNER_NAME:-anni-di-fame-local-$(hostname)}"
RUNNER_LABEL="${ADF_RUNNER_LABEL:-anni-di-fame-local}"

for cmd in curl tar python3; do
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Manca '$cmd' nel WSL." >&2
    exit 1
  }
done

if command -v gh >/dev/null 2>&1; then
  GH=(gh)
elif command -v gh.exe >/dev/null 2>&1; then
  GH=(gh.exe)
elif [ -x "/mnt/c/Program Files/GitHub CLI/gh.exe" ]; then
  GH=("/mnt/c/Program Files/GitHub CLI/gh.exe")
else
  echo "GitHub CLI non trovato né in WSL né su Windows." >&2
  echo "Apri PowerShell e verifica che 'gh auth status' funzioni, poi rilancia." >&2
  exit 1
fi

"${GH[@]}" auth status >/dev/null

detect_ollama() {
  local candidates=()
  if [ -n "${ADF_LOCAL_AI_BASE_URL:-}" ]; then
    candidates+=("$ADF_LOCAL_AI_BASE_URL")
  fi
  candidates+=("http://127.0.0.1:11434/v1")
  local host_ip
  host_ip="$(ip route show default 2>/dev/null | awk '/default/ {print $3; exit}')"
  if [ -n "$host_ip" ]; then
    candidates+=("http://$host_ip:11434/v1")
  fi

  local url
  for url in "${candidates[@]}"; do
    if curl -fsS --max-time 3 "$url/models" >/dev/null 2>&1; then
      printf '%s' "$url"
      return 0
    fi
  done
  return 1
}

OLLAMA_URL="$(detect_ollama || true)"
if [ -z "$OLLAMA_URL" ]; then
  echo "Ollama non è raggiungibile dal WSL sulla porta 11434." >&2
  echo "Avvia Ollama e rendilo raggiungibile dal WSL, poi rilancia questo script." >&2
  exit 1
fi

echo "Ollama rilevato: $OLLAMA_URL"
"${GH[@]}" variable set ADF_LOCAL_AI_BASE_URL --repo "$REPO" --body "$OLLAMA_URL"
"${GH[@]}" variable set ADF_LOCAL_AI_MODEL --repo "$REPO" --body "${ADF_LOCAL_AI_MODEL:-gpt-oss:20b}"

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [ ! -f ./run.sh ]; then
  DOWNLOADS_JSON="$(mktemp)"
  if ! "${GH[@]}" api "repos/$REPO/actions/runners/downloads" > "$DOWNLOADS_JSON"; then
    echo "GitHub CLI non ha i permessi necessari per leggere i pacchetti self-hosted runner." >&2
    echo "Da PowerShell esegui: gh auth refresh -h github.com -s repo" >&2
    rm -f "$DOWNLOADS_JSON"
    exit 1
  fi

  DOWNLOAD_URL="$(
    python3 -c 'import json,sys; rows=json.load(open(sys.argv[1])); xs=[r["download_url"] for r in rows if isinstance(r,dict) and r.get("os")=="linux" and r.get("architecture")=="x64"]; print(xs[0] if xs else "")' "$DOWNLOADS_JSON"
  )"
  rm -f "$DOWNLOADS_JSON"
  if [ -z "$DOWNLOAD_URL" ]; then
    echo "Pacchetto GitHub Actions runner Linux x64 non trovato." >&2
    exit 1
  fi

  echo "Scarico GitHub Actions runner..."
  curl -fL "$DOWNLOAD_URL" -o actions-runner.tar.gz
  tar xzf actions-runner.tar.gz
  rm actions-runner.tar.gz
fi

if [ ! -f .runner ]; then
  if ! TOKEN="$("${GH[@]}" api -X POST "repos/$REPO/actions/runners/registration-token" --jq .token)"; then
    echo "GitHub CLI non ha i permessi necessari per registrare un self-hosted runner." >&2
    echo "Da PowerShell esegui: gh auth refresh -h github.com -s repo" >&2
    exit 1
  fi
  echo "Registro il runner '$RUNNER_NAME' su $REPO con label '$RUNNER_LABEL'..."
  ./config.sh --unattended \
    --url "https://github.com/$REPO" \
    --token "$TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "$RUNNER_LABEL" \
    --work "_work" \
    --replace
fi

echo
echo "Runner Anni di Fame attivo. Lascia questa finestra aperta."
echo "Repo:   $REPO"
echo "Nome:   $RUNNER_NAME"
echo "Label:  $RUNNER_LABEL"
echo
exec ./run.sh
