import { execSync } from "child_process";
import fs from "fs";
import path from "path";

function findBinary(dir) {
  // Recursively search for the native binary (handles arch-specific subdirs)
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findBinary(filePath);
        if (found) return found;
      } else if (entry.isFile() && (entry.name === "devbox" || entry.name === "devbox.exe")) {
        return filePath;
      }
    }
  } catch (err) {
    // directory may not exist, ignore and continue
  }
  return null;
}

// search under src-tauri/target (not just target/release) to support
// arch-specific paths like target/x86_64-apple-darwin/release
const targetDir = path.join(".", "src-tauri", "target");
const binaryPath = findBinary(targetDir);

if (binaryPath) {
  // check if current OS is darwin

  let osname = process.platform;
  if (osname === "darwin") {
    console.log("OS is darwin, skipping UPX compression");
    process.exit(0);
  }
  console.log(`Found binary: ${binaryPath}`);
  try {
    execSync(`upx --best --lzma "${binaryPath}"`);
    console.log("UPX compression completed successfully.");
  } catch (error) {
    console.error("Error during UPX compression:", error);
    // process.exit(1);
  }
} else {
  console.error("Binary not found");
  process.exit(0);
}
