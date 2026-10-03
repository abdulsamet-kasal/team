import { spawn } from "node:child_process";

const activeProcesses = new Set();

export function killAllActiveCommands() {
  let count = 0;
  for (const child of activeProcesses) {
    try {
      child.kill("SIGKILL");
      count++;
    } catch (e) {
      console.error("Process kill error:", e);
    }
  }
  activeProcesses.clear();
  return count;
}

export function truncateOutput(str, maxChars = 30000) {
  if (!str || typeof str !== "string" || str.length <= maxChars) return str || "";
  const half = Math.floor(maxChars / 2);
  const head = str.slice(0, half);
  const tail = str.slice(-half);
  const truncatedCount = str.length - maxChars;
  return `${head}\n\n... [⚠️ ÇIKTI ÇOK UZUN OLDUĞU İÇİN ORTA KISIM KIRPILDI (${truncatedCount.toLocaleString()} karakter) ...] \n\n${tail}`;
}

export function executeCommand(command, { cwd, onOutput, timeoutMs = 120000 } = {}) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let isSettled = false;

    const homeDir = process.env.HOME || "/home/samet";
    const customPaths = [
      `${homeDir}/development/flutter/bin`,
      `${homeDir}/.local/bin`,
      `${homeDir}/Android/Sdk/platform-tools`,
      `${homeDir}/Android/Sdk/cmdline-tools/latest/bin`,
      `${homeDir}/Android/Sdk/emulator`
    ];
    const envPath = `${customPaths.join(":")}:${process.env.PATH || ""}`;

    const child = spawn("bash", ["-c", command], {
      cwd: cwd || process.cwd(),
      env: {
        ...process.env,
        PATH: envPath,
        ANDROID_HOME: `${homeDir}/Android/Sdk`,
        TERM: "xterm-256color"
      }
    });

    activeProcesses.add(child);

    const cleanup = () => {
      activeProcesses.delete(child);
    };

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        cleanup();
        try {
          child.kill("SIGTERM");
        } catch (e) {}
        const msg = "\n[Zaman aşımı: Komut 60 saniyeden uzun sürdüğü için sonlandırıldı]\n";
        stderr += msg;
        if (onOutput) onOutput({ type: "stderr", chunk: msg });
        resolve({
          exitCode: 124,
          stdout,
          stderr,
          durationMs: Date.now() - startTime
        });
      }
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      const text = data.toString("utf8");
      if (stdout.length < 100000) {
        stdout += text;
      }
      if (onOutput) onOutput({ type: "stdout", chunk: text.length > 5000 ? text.slice(0, 5000) + "..." : text });
    });

    child.stderr.on("data", (data) => {
      const text = data.toString("utf8");
      if (stderr.length < 100000) {
        stderr += text;
      }
      if (onOutput) onOutput({ type: "stderr", chunk: text.length > 5000 ? text.slice(0, 5000) + "..." : text });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      cleanup();
      if (!isSettled) {
        isSettled = true;
        const msg = `Hata: ${err.message}\n`;
        stderr += msg;
        if (onOutput) onOutput({ type: "stderr", chunk: msg });
        resolve({
          exitCode: 1,
          stdout: truncateOutput(stdout),
          stderr: truncateOutput(stderr),
          durationMs: Date.now() - startTime
        });
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      cleanup();
      if (!isSettled) {
        isSettled = true;
        resolve({
          exitCode: code ?? 0,
          stdout: truncateOutput(stdout),
          stderr: truncateOutput(stderr),
          durationMs: Date.now() - startTime
        });
      }
    });
  });
}
