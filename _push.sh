#!/bin/bash
# _push.sh — safe git push for SoulGainz
# Clears stale lock files (left by sandbox) then commits and pushes.
# Usage: ./_push.sh "optional commit message"

REPO="/Users/dejanzerafa/Desktop/Cowork/MEAL PREP APP"
MSG="${1:-Update}"

cd "$REPO" || exit 1

echo "🧹 Clearing stale git locks..."
find .git -name "*.lock" -delete 2>/dev/null

echo "📦 Staging all changes..."
git add -A

# Only commit if there's something to commit
if git diff --cached --quiet; then
  echo "✅ Nothing new to commit — pushing current HEAD..."
else
  git commit -m "$MSG"
fi

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Done."
