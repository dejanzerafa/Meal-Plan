/**
 * sync.js — copies index.html from the root webapp into _mobile/www/
 * Run: node sync.js (or via `npm run sync`)
 *
 * This keeps the mobile build always in sync with the latest webapp
 * without any manual copying.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WWW  = path.resolve(__dirname, "www");

if (!fs.existsSync(WWW)) fs.mkdirSync(WWW, { recursive: true });

// Files to copy from root into www/
const FILES = ["index.html", "manifest.json", "sw.js", "icon-192.png", "icon-512.png"];

let copied = 0;
for (const file of FILES) {
    const src  = path.join(ROOT, file);
    const dest = path.join(WWW,  file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`  ✅ ${file} → www/${file}`);
        copied++;
    } else {
        console.log(`  ⚠️  ${file} not found — skipping`);
    }
}

// Inject Capacitor bridge into index.html
const indexPath = path.join(WWW, "index.html");
if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, "utf8");
    const bridgeTag = '<script src="capacitor.js"></script>';
    if (!html.includes(bridgeTag)) {
        // Inject right before </body>
        html = html.replace("</body>", `  ${bridgeTag}\n</body>`);
        fs.writeFileSync(indexPath, html);
        console.log("  ✅ Capacitor bridge injected into www/index.html");
    } else {
        console.log("  ✓  Capacitor bridge already present");
    }
}

console.log(`\n✅ Sync complete — ${copied} file(s) copied to www/`);
console.log("   Next: npx cap sync  (or npm run sync which does both)\n");
