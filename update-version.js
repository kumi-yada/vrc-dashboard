const fs = require("fs");
const p = "src-tauri/Cargo.toml";
let v = (process.env.GITHUB_REF_NAME || "").replace(/^v/, "");
if (!v) {
  console.log("No GITHUB_REF_NAME set, skipping");
  process.exit(0);
}
let s = fs.readFileSync(p, "utf8");
s = s.replace(/^version\s*=\s*\".*\"/m, `version = "${v}"`);
fs.writeFileSync(p, s);
console.log("Set src-tauri/Cargo.toml version to", v);
