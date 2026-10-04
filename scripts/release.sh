#!/usr/bin/env bash
# Usage: pnpm release <version>
# Bumps the version, signs via AMO (unlisted), publishes the XPI as a GitHub
# Release, and points updates.json at it so installed copies auto-update.
set -euo pipefail

VERSION="${1:?usage: pnpm release <version>}"
REPO="andhikapraa/freedium-extension"
ID="freedium@extension"
XPI_NAME="freedium-$VERSION.xpi"

cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean; commit or stash first." >&2
  exit 1
fi

npm pkg set version="$VERSION"
pnpm sign:firefox

XPI="$(ls -t web-ext-artifacts/*-"$VERSION".xpi | head -1)"
cp "$XPI" "web-ext-artifacts/$XPI_NAME"

cat > updates.json <<EOF
{
  "addons": {
    "$ID": {
      "updates": [
        {
          "version": "$VERSION",
          "update_link": "https://github.com/$REPO/releases/download/v$VERSION/$XPI_NAME"
        }
      ]
    }
  }
}
EOF

git add package.json updates.json
git commit -m "Release $VERSION"
git tag "v$VERSION"
git push origin HEAD "v$VERSION"

gh release create "v$VERSION" "web-ext-artifacts/$XPI_NAME" \
  --repo "$REPO" --title "v$VERSION" --notes "Signed Firefox/Zen build $VERSION."
