const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const asar = require("@electron/asar");
const extractZip = require("extract-zip");
const { downloadArtifact } = require("@electron/get");

const electronVersion = require("electron/package.json").version;

async function extractRuntime(zipPath, outputPath) {
  if (process.platform === "darwin" || process.platform === "linux") {
    childProcess.execFileSync("unzip", ["-q", zipPath, "-d", outputPath], {
      stdio: "inherit",
    });
    return;
  }

  await extractZip(zipPath, { dir: outputPath });
}

function copyApplicationFiles(root, stage) {
  const entries = ["package.json", "index.html", "src", "styles", "desktop"];
  for (const entry of entries) {
    fs.cpSync(path.join(root, entry), path.join(stage, entry), {
      recursive: true,
    });
  }
}

async function buildWindowsFolder() {
  const root = path.resolve(__dirname, "..");
  const releaseRoot = path.join(root, "release");
  const outputPath = path.join(releaseRoot, "XiaofangAssistant-win32-x64");
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), "xiaofang-win-"));

  fs.mkdirSync(releaseRoot, { recursive: true });
  fs.rmSync(outputPath, { recursive: true, force: true });
  fs.mkdirSync(outputPath, { recursive: true });

  console.log(`Downloading Electron ${electronVersion} for Windows x64...`);
  const runtimeZip = await downloadArtifact({
    version: electronVersion,
    artifactName: "electron",
    platform: "win32",
    arch: "x64",
  });

  console.log("Extracting Windows runtime...");
  await extractRuntime(runtimeZip, outputPath);

  const resourcesPath = path.join(outputPath, "resources");
  fs.rmSync(path.join(resourcesPath, "default_app.asar"), { force: true });
  fs.renameSync(
    path.join(outputPath, "electron.exe"),
    path.join(outputPath, "XiaofangAssistant.exe"),
  );

  console.log("Packing application files...");
  copyApplicationFiles(root, stage);
  await asar.createPackage(stage, path.join(resourcesPath, "app.asar"));
  fs.rmSync(stage, { recursive: true, force: true });

  console.log(`Windows app written to: ${outputPath}`);
}

const keepAlive = setInterval(() => {}, 1000);

buildWindowsFolder()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    clearInterval(keepAlive);
  });
