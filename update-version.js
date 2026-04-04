const fs = require("fs");
const p = "src-tauri/Cargo.toml";
const tauriConf = "src-tauri/tauri.conf.json";
let v = (process.env.GITHUB_REF_NAME || "").replace(/^v/, "");
if (!v) {
  console.log("No GITHUB_REF_NAME set, skipping");
  process.exit(0);
}
let s = fs.readFileSync(p, "utf8");
s = s.replace(/^version\s*=\s*\".*\"/m, `version = "${v}"`);
fs.writeFileSync(p, s);
console.log("Set src-tauri/Cargo.toml version to", v);

// update src-tauri/tauri.conf.json
try {
  let t = fs.readFileSync(tauriConf, "utf8");
  let j = JSON.parse(t);
  if (j.version !== v) {
    j.version = v;
    fs.writeFileSync(tauriConf, JSON.stringify(j, null, 2) + "\n");
    console.log("Set src-tauri/tauri.conf.json version to", v);
  } else {
    console.log("src-tauri/tauri.conf.json already at version", v);
  }
} catch (e) {
  console.error("Failed to update src-tauri/tauri.conf.json:", e.message);
  process.exit(1);
}
