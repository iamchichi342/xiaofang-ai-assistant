const fs = require("fs");
const path = require("path");
const bestzip = require("bestzip");

async function zipWindowsFolder() {
  const releaseRoot = path.resolve(__dirname, "..", "release");
  const destination = "XiaofangAssistant-win32-x64.zip";
  fs.rmSync(path.join(releaseRoot, destination), { force: true });
  await bestzip({
    cwd: releaseRoot,
    source: "XiaofangAssistant-win32-x64",
    destination,
  });
  console.log(`Windows ZIP written to: ${path.join(releaseRoot, destination)}`);
}

const keepAlive = setInterval(() => {}, 1000);

zipWindowsFolder()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    clearInterval(keepAlive);
  });
