#!/bin/bash
# _push.sh — SoulGainz push via GitHub API (no git lock issues)
# Token is read from the git remote URL — no secrets in this file.
# Usage: ./_push.sh "commit message" [file1 file2 ...]

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
MSG="${1:-Update}"
shift || true   # remaining args = specific files to push (optional)

cd "$REPO_DIR" || exit 1

# Parse token + repo slug from git remote URL
REMOTE_URL="$(git remote get-url origin 2>/dev/null)"
GH_TOKEN="$(echo "$REMOTE_URL" | sed -n 's|https://[^:]*:\([^@]*\)@github.com/.*|\1|p')"
GH_REPO="$(echo "$REMOTE_URL"  | sed -n 's|https://[^@]*@github.com/\(.*\)\.git|\1|p')"

if [ -z "$GH_TOKEN" ] || [ -z "$GH_REPO" ]; then
  echo "❌ Could not parse token/repo from remote URL: $REMOTE_URL"
  exit 1
fi

# If specific files passed, use those; otherwise detect changed files
if [ "$#" -gt 0 ]; then
  FILES=("$@")
else
  mapfile -t FILES < <(git diff --name-only HEAD 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null)
  if [ "${#FILES[@]}" -eq 0 ]; then
    mapfile -t FILES < <(git ls-files 2>/dev/null)
  fi
fi

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "✅ Nothing to push."
  exit 0
fi

echo "🚀 Pushing ${#FILES[@]} file(s) → github.com/$GH_REPO"

python3 - "$GH_TOKEN" "$GH_REPO" "$MSG" "$REPO_DIR" "${FILES[@]}" << 'PYEOF'
import sys, urllib.request, urllib.error, json, base64, os

token, repo, msg, repo_dir = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
files = sys.argv[5:]
headers = {"Authorization": f"token {token}", "Content-Type": "application/json"}

def api(url, data=None):
    method = "PUT" if data else "GET"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read()), None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}: {e.read().decode()[:300]}"

ok, fail = 0, 0
for rel in files:
    path = os.path.join(repo_dir, rel)
    if not os.path.isfile(path):
        continue
    info, _ = api(f"https://api.github.com/repos/{repo}/contents/{rel}")
    sha = info["sha"] if info and "sha" in info else None
    with open(path, "rb") as f:
        content = base64.b64encode(f.read()).decode()
    body = {"message": msg, "content": content}
    if sha:
        body["sha"] = sha
    result, err = api(f"https://api.github.com/repos/{repo}/contents/{rel}",
                      data=json.dumps(body).encode())
    if err:
        print(f"  ❌ {rel}: {err}")
        fail += 1
    else:
        print(f"  ✅ {rel} → {result['commit']['sha'][:8]}")
        ok += 1

print(f"\n{'✅' if fail == 0 else '⚠️'} {ok} pushed, {fail} failed.")
sys.exit(0 if fail == 0 else 1)
PYEOF
