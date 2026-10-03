import fs from "node:fs";
import path from "node:path";
import { executeCommand } from "./executor.js";
import { store } from "./store.js";
import { memoryManager } from "./memory.js";

export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "execute_bash",
      description: "Sistemde gerçek terminal bash komutları çalıştırır (örn: npm, git, gh, python, curl, flutter, vs.). Çıktıyı doğrudan alır.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "Çalıştırılacak tam bash komutu."
          }
        },
        required: ["command"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Belirtilen dosyanın içeriğini okur.",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "Okunacak dosyanın göreli veya mutlak yolu."
          }
        },
        required: ["filePath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Yeni bir dosya oluşturur veya var olan dosyanın içeriğini günceller.",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "Yazılacak dosyanın dosya yolu."
          },
          content: {
            type: "string",
            description: "Dosyaya yazılacak içerik."
          }
        },
        required: ["filePath", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_directory",
      description: "Belirtilen klasördeki dosyaları ve alt dizinleri listeler.",
      parameters: {
        type: "object",
        properties: {
          dirPath: {
            type: "string",
            description: "Listelenecek klasör yolu (boş bırakılırsa çalışma dizini)."
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_github_repo",
      description: "Kullanıcının bağlı GitHub hesabında (abdulsamet-kasal) doğrudan yeni bir repository oluşturur ve yerel projeyi bağlayıp push eder.",
      parameters: {
        type: "object",
        properties: {
          repoName: {
            type: "string",
            description: "Oluşturulacak repository adı (örn: 'my-project')."
          },
          isPublic: {
            type: "boolean",
            description: "Depo herkese açık mı olsun (varsayılan true)."
          },
          description: {
            type: "string",
            description: "Depo açıklaması."
          }
        },
        required: ["repoName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delegate_to_bot",
      description: "Görevin belirli bir kısmını uzman bir ekip arkadaşına (Frontend, Backend, Mobile, DevOps, QA, Designer) delege eder ve yanıtını alır.",
      parameters: {
        type: "object",
        properties: {
          targetBotId: {
            type: "string",
            description: "Görevin iletileceği botun kimliği (örn: bot-frontend, bot-backend, bot-mobile, bot-devops, bot-qa, bot-designer)."
          },
          task: {
            type: "string",
            description: "Uzmana iletilecek net görev açıklaması ve gereksinimler."
          }
        },
        required: ["targetBotId", "task"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "save_memory",
      description: "Kalıcı hafızaya ve proje bilgisine yeni bir önemli kural veya bilgi kaydeder (MEMORY.md).",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["rule", "fact"],
            description: "Kaydedilecek öğenin türü: 'rule' (kural) veya 'fact' (proje bilgisi/hafıza)."
          },
          content: {
            type: "string",
            description: "Hafızaya eklenecek bilgi veya kural metni."
          }
        },
        required: ["type", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_memory",
      description: "Sistemde kayıtlı kalıcı hafızayı ve 7 sabit çalışma kuralını okur.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

export async function executeToolCall(toolCall, { cwd, onOutput, runSubagent } = {}) {
  const { name, arguments: argsJson } = toolCall.function;
  let args = {};
  try {
    args = JSON.parse(argsJson);
  } catch (err) {
    return { error: `Geçersiz argüman JSON'u: ${err.message}` };
  }

  const workDir = cwd || store.getSettings().defaultCwd || process.cwd();

  switch (name) {
    case "execute_bash": {
      if (onOutput) onOutput({ status: "running", tool: "execute_bash", command: args.command });
      const result = await executeCommand(args.command, { cwd: workDir, onOutput });
      return {
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
        durationMs: result.durationMs
      };
    }

    case "read_file": {
      try {
        const fullPath = path.isAbsolute(args.filePath) ? args.filePath : path.join(workDir, args.filePath);
        if (!fs.existsSync(fullPath)) {
          return { error: `Dosya bulunamadı: ${args.filePath}` };
        }
        const content = fs.readFileSync(fullPath, "utf8");
        return { filePath: args.filePath, content };
      } catch (err) {
        return { error: `Dosya okuma hatası: ${err.message}` };
      }
    }

    case "write_file": {
      try {
        const fullPath = path.isAbsolute(args.filePath) ? args.filePath : path.join(workDir, args.filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, args.content, "utf8");
        return { success: true, filePath: args.filePath, bytesWritten: Buffer.byteLength(args.content) };
      } catch (err) {
        return { error: `Dosya yazma hatası: ${err.message}` };
      }
    }

    case "list_directory": {
      try {
        const targetDir = args.dirPath
          ? (path.isAbsolute(args.dirPath) ? args.dirPath : path.join(workDir, args.dirPath))
          : workDir;
        if (!fs.existsSync(targetDir)) {
          return { error: `Dizin bulunamadı: ${targetDir}` };
        }
        const entries = fs.readdirSync(targetDir, { withFileTypes: true });
        const list = entries.map(e => ({
          name: e.name,
          type: e.isDirectory() ? "directory" : "file"
        }));
        return { directory: targetDir, entries: list };
      } catch (err) {
        return { error: `Dizin listeleme hatası: ${err.message}` };
      }
    }

    case "create_github_repo": {
      try {
        const visibility = args.isPublic !== false ? "--public" : "--private";
        const descArg = args.description ? `--description "${args.description.replace(/"/g, '\\"')}"` : "";
        const cmd = `git init && git add . && git commit -m "Initial commit by Team AI" || true && gh repo create ${args.repoName} ${visibility} ${descArg} --source=. --remote=origin --push`;
        if (onOutput) onOutput({ status: "running", tool: "create_github_repo", command: cmd });
        const result = await executeCommand(cmd, { cwd: workDir, onOutput });
        return {
          repo: args.repoName,
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
          url: `https://github.com/abdulsamet-kasal/${args.repoName}`
        };
      } catch (err) {
        return { error: `GitHub repo oluşturma hatası: ${err.message}` };
      }
    }

    case "delegate_to_bot": {
      if (!runSubagent) {
        return { error: "Alt ajan koordinasyonu bu oturumda başlatılamadı." };
      }
      const targetBot = store.getBot(args.targetBotId);
      if (!targetBot) {
        return { error: `Bot bulunamadı: ${args.targetBotId}` };
      }
      if (onOutput) onOutput({ status: "delegating", targetBot: targetBot.name, task: args.task });
      const subResult = await runSubagent(args.targetBotId, args.task);
      return {
        bot: targetBot.name,
        result: subResult
      };
    }

    case "save_memory": {
      try {
        if (args.type === "rule") {
          memoryManager.addRule(args.content);
          return { success: true, message: `Yeni kural kalıcı hafızaya eklendi: "${args.content}"` };
        } else {
          memoryManager.addFact(args.content);
          return { success: true, message: `Yeni proje hafızası kaydedildi: "${args.content}"` };
        }
      } catch (err) {
        return { error: `Hafıza kaydetme hatası: ${err.message}` };
      }
    }

    case "read_memory": {
      try {
        return {
          rules: memoryManager.rules,
          facts: memoryManager.facts
        };
      } catch (err) {
        return { error: `Hafıza okuma hatası: ${err.message}` };
      }
    }

    default:
      return { error: `Tanınmayan araç: ${name}` };
  }
}
