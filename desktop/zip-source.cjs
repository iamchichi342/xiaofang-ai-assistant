const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");
const bestzip = require("bestzip");

async function zipSource() {
  const root = path.resolve(__dirname, "..");
  const releaseRoot = path.join(root, "release");
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  const destination = `XiaofangAssistant-source-v${packageJson.version}.zip`;
  const source = childProcess
    .execFileSync("git", ["ls-files", "-z"], { cwd: root })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
  fs.mkdirSync(releaseRoot, { recursive: true });
  fs.rmSync(path.join(releaseRoot, destination), { force: true });

  await bestzip.nodeZip({
    cwd: root,
    source,
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
