#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SoulGainz — Launch Day CTA Swap
# Run this on launch day to flip landing.html from waitlist to live app.
#
# Usage:
#   chmod +x scripts/launch-swap.sh
#   ./scripts/launch-swap.sh
#
# What it does:
#   1. Replaces all /waitlist CTA links → https://soulgainz.app
#   2. Updates CTA button text to "Open the app →" / "Get started →"
#   3. Commits the change with a launch tag
# ─────────────────────────────────────────────────────────────────────────────

set -e

LANDING="landing.html"
APP_URL="https://soulgainz.app"

echo "🚀 SoulGainz Launch Swap"
echo "────────────────────────"

# ── Backup ───────────────────────────────────────────────────────────────────
cp "$LANDING" "${LANDING}.pre-launch-backup"
echo "✅ Backup saved: ${LANDING}.pre-launch-backup"

# ── 1. Replace waitlist hrefs → live app URL ─────────────────────────────────
# Hero CTA
sed -i '' 's|href="/waitlist?utm_source=landing&utm_medium=hero&utm_content=cta"|href="'"$APP_URL"'"|g' "$LANDING"

# Pricing CTAs (keep them pointing to app, remove utm since they go to app now)
sed -i '' 's|href="/waitlist?utm_source=landing&utm_medium=pricing&utm_content=monthly"|href="'"$APP_URL"'"|g' "$LANDING"
sed -i '' 's|href="/waitlist?utm_source=landing&utm_medium=pricing&utm_content=quarterly"|href="'"$APP_URL"'"|g' "$LANDING"
sed -i '' 's|href="/waitlist?utm_source=landing&utm_medium=pricing&utm_content=lifetime"|href="'"$APP_URL"'"|g' "$LANDING"

echo "✅ Waitlist links → $APP_URL"

# ── 2. Update CTA text ────────────────────────────────────────────────────────
sed -i '' 's|>Join the waitlist →<|>Open the app →<|g' "$LANDING"
sed -i '' 's|>Join waitlist →<|>Get started →<|g' "$LANDING"

echo "✅ CTA text updated"

# ── 3. Verify ─────────────────────────────────────────────────────────────────
REMAINING=$(grep -c "waitlist" "$LANDING" || true)
echo ""
echo "Remaining 'waitlist' references in landing.html: $REMAINING"
if [ "$REMAINING" -gt 0 ]; then
  echo "⚠️  Check these manually:"
  grep -n "waitlist" "$LANDING"
fi

# ── 4. Commit ─────────────────────────────────────────────────────────────────
echo ""
read -p "Commit and push? (y/N) " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
  git add "$LANDING"
  git commit -m "🚀 launch: swap waitlist CTAs → live app"
  git push
  echo ""
  echo "🔥 Done. Landing page is live with app CTAs."
  echo "   Don't forget to run: send-launch-email"
else
  echo "Changes staged but not committed. Run 'git add landing.html && git commit' when ready."
fi
