const fs = require("fs");
const path = require("path");
const bestzip = require("bestzip");

async function zipSource() {
  const root = path.resolve(__dirname, "..");
  const releaseRoot = path.join(root, "release");
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  const destination = `XiaofangAssistant-source-v${packageJson.version}.zip`;
  fs.mkdirSync(releaseRoot, { recursive: true });
  fs.rmSync(path.join(releaseRoot, destination), { force: true });

  await bestzip.nodeZip({
    cwd: root,
    source: [
      ".github",
      "desktop",
      "docs",
      "src",
      "styles",
      ".gitignore",
      "CHANGELOG.md",
      "LICENSE",
      "README.md",
      "index.html",
      "package-lock.json",
      "package.json"
    ],
    destination: path.join("release", destination),
    level: 9,
  });

  console.log(`Source ZIP written to: ${path.join(releaseRoot, destination)}`);
}

const keepAlive = setInterval(() => {}, 1000);

zipSource()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => clearInterval(keepAlive));
