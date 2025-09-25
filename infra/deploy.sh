set -ev

cd "$(dirname "$0")/.."
npx wrangler deploy --config infra/wrangler.jsonc

echo "Deployment Succeeded!"