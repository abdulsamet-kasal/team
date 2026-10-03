import { spawn } from "node:child_process";

export function executeCommand(command, { cwd, onOutput, timeoutMs = 60000 } = {}) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let isSettled = false;

    const child = spawn("bash", ["-c", command], {
      cwd: cwd || process.cwd(),
      env: { ...process.env, TERM: "xterm-256color" }
    });

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        child.kill("SIGTERM");
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
      stdout += text;
      if (onOutput) onOutput({ type: "stdout", chunk: text });
    });

    child.stderr.on("data", (data) => {
      const text = data.toString("utf8");
      stderr += text;
      if (onOutput) onOutput({ type: "stderr", chunk: text });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      if (!isSettled) {
        isSettled = true;
        const msg = `Hata: ${err.message}\n`;
        stderr += msg;
        if (onOutput) onOutput({ type: "stderr", chunk: msg });
        resolve({
          exitCode: 1,
          stdout,
          stderr,
          durationMs: Date.now() - startTime
        });
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (!isSettled) {
        isSettled = true;
        resolve({
          exitCode: code ?? 0,
          stdout,
          stderr,
          durationMs: Date.now() - startTime
        });
      }
    });
  });
}
