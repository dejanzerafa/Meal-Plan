#!/bin/bash
# generate-keystore.sh — creates the signing keystore for Google Play
# Run ONCE. Back up the output file somewhere safe.

set -e

KEYSTORE="soulgainz-release.keystore"
ALIAS="soulgainz"

if [ -f "$KEYSTORE" ]; then
  echo "⚠️  $KEYSTORE already exists — skipping generation."
  echo "   If you want to regenerate, delete it first (NOT recommended if already on Play Store)."
  exit 0
fi

echo ""
echo "🔐 Generating SoulGainz release keystore..."
echo "   You'll be asked for a password (use something strong, save it in your password manager)"
echo ""

keytool -genkeypair \
  -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=SoulGainz, OU=Mobile, O=SoulGainz, L=Melbourne, ST=Victoria, C=AU"

echo ""
echo "✅ Keystore created: $KEYSTORE"
echo ""
echo "⚠️  IMPORTANT — back this file up NOW:"
echo "   cp $KEYSTORE ~/Library/CloudStorage/iCloudDrive/soulgainz-release.keystore"
echo ""
echo "   You need this file + password for EVERY future update to the Play Store."
echo "   Losing it means you cannot update your app. Ever."
echo ""
