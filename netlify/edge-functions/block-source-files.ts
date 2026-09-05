// netlify/edge-functions/block-source-files.ts
//
// Blocks source, documentation and tooling files by EXTENSION.
//
// Why this exists rather than a redirect rule: netlify.toml redirects match the
// splat `*` only at the end of a path, so `from = "/*.sql"` matches nothing at
// all — it looks like a rule and does nothing, which is the same failure mode
// that left .netlifyignore silently ineffective. Edge function `pattern` is a
// real regex and can match on the extension.
//
// Covers ~27 root-level .md files (including AUDIT_REPORT.md, a written
// inventory of this app's weak points), ~15 .sql files including the security
// fix scripts, and the deploy shell scripts.
//
// Deliberately NOT blocked: .json (manifest.json is required for PWA install;
// package.json and package-lock.json are blocked individually in netlify.toml)
// and .js/.html/.css, which are the app itself.

export default async (): Promise<Response> => {
  return new Response("Not Found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // Do not let a 404 get cached as long as the old 200 was.
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
};

export const config = {
  // Any path ending in one of these extensions, at any depth.
  pattern: "^/.*\\.(sql|md|sh|yml|yaml|toml|lock|bak|backup|env)$",
};
