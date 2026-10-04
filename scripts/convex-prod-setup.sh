#!/usr/bin/env bash
# One-time production setup for Beer Seeker's Convex backend.
# Run with `bash scripts/convex-prod-setup.sh`. Generates a fresh signing key pair for prod
# (never reuse dev's), sets it on the production deployment, then deploys.
# SITE_URL is not needed: Convex Auth only reads it for OAuth/magic-link redirects.
set -euo pipefail

cd "$(dirname "$0")/.."

KEYS=$(node --input-type=module -e '
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
const keys = await generateKeyPair("RS256", { extractable: true });
const priv = (await exportPKCS8(keys.privateKey)).trimEnd().replace(/\n/g, " ");
const jwks = JSON.stringify({ keys: [{ use: "sig", ...(await exportJWK(keys.publicKey)) }] });
console.log(JSON.stringify({ priv, jwks }));
')

npx convex deploy -y
npx convex env set --prod JWT_PRIVATE_KEY -- "$(node -e 'console.log(JSON.parse(process.argv[1]).priv)' "$KEYS")"
npx convex env set --prod JWKS -- "$(node -e 'console.log(JSON.parse(process.argv[1]).jwks)' "$KEYS")"

echo
echo "Production env vars:"
npx convex env list --prod | sed 's/=.*/=<set>/'
echo
echo "Now copy the prod URL from the dashboard (Production → Settings → URL & Deploy Key)."
