#!/bin/bash
# sync-to-icloud.sh
# Syncs SoulGainz project to iCloud Drive for backup.
# Run manually any time, or set up as a scheduled task.
#
# Usage:
#   bash ~/Desktop/Cowork/SoulGainz/sync-to-icloud.sh
#
# To run automatically every hour via launchd, see below.

set -e

SRC="$HOME/Desktop/Cowork/SoulGainz"
DEST="$HOME/Library/Mobile Documents/com~apple~CloudDocs/SoulGainz"

echo ""
echo "🔄 Syncing SoulGainz → iCloud Drive..."
echo "   From: $SRC"
echo "   To:   $DEST"
echo ""

mkdir -p "$DEST"

rsync -av --delete \
  --exclude=".DS_Store" \
  --exclude="*.log" \
  "$SRC/" "$DEST/"

echo ""
echo "✅ Sync complete — $(date '+%d %b %Y %H:%M')"
echo "   Your SoulGainz backup is live in iCloud Drive → SoulGainz"
echo ""

# Everything is backed up — full mirror including:
#   ✅ index.html (the whole app)
#   ✅ node_modules/
#   ✅ _mobile/ (android/, ios/, keystore, all config)
#   ✅ netlify/ functions
#   ✅ vendor/ JS libraries
#   ✅ All docs, assets, icons, splash screens
#   ✅ Financial model and all .md files
#   ✅ .git/ history

echo "💡 Tip: iCloud will upload changes in the background."
echo "   Check progress in Finder → iCloud Drive → SoulGainz"
echo ""
