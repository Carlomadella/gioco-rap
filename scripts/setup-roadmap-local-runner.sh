#!/usr/bin/env bash
set -euo pipefail

REPO="${ADF_RUNNER_REPO:-Carlomadella/gioco-rap}"
RUNNER_DIR="${ADF_RUNNER_DIR:-$HOME/actions-runner-anni-di-fame}"
RUNNER_NAME="${ADF_RUNNER_NAME:-anni-di-fame-local-$(hostname)}"
RUNNER_LABEL="${ADF_RUNNER_LABEL:-anni-di-fame-local}"

for cmd in gh curl tar python3; do
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "Manca '$cmd' nel WSL." >&2
    exit 1
  }
done

gh auth status >/dev/null

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [ ! -f ./run.sh ]; then
  DOWNLOAD_URL="$(
    gh api "repos/$REPO/actions/runners/downloads" |
      python3 -c 'import json,sys; rows=json.load(sys.stdin); xs=[r["download_url"] for r in rows if r.get("os")=="linux" and r.get("architecture")=="x64"]; print(xs[0] if xs else "")'
  )"
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
  TOKEN="$(gh api -X POST "repos/$REPO/actions/runners/registration-token" --jq .token)"
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
