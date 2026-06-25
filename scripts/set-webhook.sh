#!/usr/bin/env bash
# Register your deployed telegram-webhook function with Telegram.
#
# Usage:
#   scripts/set-webhook.sh https://<project-ref>.functions.supabase.co/telegram-webhook
#
# Reads TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET from .env. The secret is
# sent to Telegram as `secret_token`; Telegram then echoes it back in the
# X-Telegram-Bot-Api-Secret-Token header on every webhook call, and the function
# rejects anything that doesn't match.

set -euo pipefail

WEBHOOK_URL="${1:-}"
if [[ -z "${WEBHOOK_URL}" ]]; then
  echo "usage: $0 <public-webhook-url>" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  echo "error: ${ENV_FILE} not found (copy .env.example to .env first)" >&2
  exit 2
fi

set -a
# shellcheck disable=SC1090
source <(grep -Ev '^\s*(#|$)' "${ENV_FILE}")
set +a

: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN missing in .env}"
: "${TELEGRAM_WEBHOOK_SECRET:?TELEGRAM_WEBHOOK_SECRET missing in .env}"

echo "Registering webhook: ${WEBHOOK_URL}"
curl -fsS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "$(printf '{"url":"%s","secret_token":"%s"}' "${WEBHOOK_URL}" "${TELEGRAM_WEBHOOK_SECRET}")"
echo
echo "Done. Check status with:"
echo "  curl -s https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
