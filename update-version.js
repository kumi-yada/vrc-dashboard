const fs = require("fs");

function updateFile(path, label, replacer) {
  const content = fs.readFileSync(path, "utf8");
  const updated = replacer(content);
  if (updated !== content) {
    fs.writeFileSync(path, updated);
    console.log(`Set ${label} version to`, v);
  } else {
    console.log(`${label} already at version`, v);
  }
}

let v = (process.env.GITHUB_REF_NAME || "").replace(/^v/, "");
if (!v) {
  console.log("No GITHUB_REF_NAME set, skipping");
  process.exit(0);
}

updateFile("src-tauri/Cargo.toml", "src-tauri/Cargo.toml", (s) =>
  s.replace(/^version\s*=\s*\".*\"/m, `version = "${v}"`),
);

updateFile("package.json", "package.json", (s) =>
  s.replace(/"version"\s*:\s*"[^"]*"/, `"version": "${v}"`),
);

updateFile("src-tauri/tauri.conf.json", "src-tauri/tauri.conf.json", (s) => {
  let j = JSON.parse(s);
  if (j.version !== v) {
    j.version = v;
    return JSON.stringify(j, null, 2) + "\n";
  }
  return s;
});
