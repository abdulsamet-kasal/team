import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
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
      name: "edit_file",
      description: "Var olan bir dosyanın belirli bir kısmını (hedef metni) yenisiyle değiştirir. Tüm dosyayı baştan yazmak yerine sadece değişen kısmı hedef alarak büyük token tasarrufu sağlar.",
      parameters: {
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "Düzenlenecek dosyanın dosya yolu."
          },
          targetText: {
            type: "string",
            description: "Değiştirilecek mevcut tam metin bloğu (birebir eşleşmelidir)."
          },
          replacementText: {
            type: "string",
            description: "Hedef metnin yerine konulacak yeni metin."
          },
          replaceAll: {
            type: "boolean",
            description: "Birden fazla eşleşme varsa tümünü değiştir (varsayılan: false)."
          }
        },
        required: ["filePath", "targetText", "replacementText"]
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
  },
  {
    type: "function",
    function: {
      name: "create_kanban_task",
      description: "Görev Panosuna (Kanban) yeni bir görev kartı ekler ve ilgili alan uzmanına (bot-frontend, bot-backend, bot-mobile, bot-devops, bot-qa, bot-tester, bot-designer) atar.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Görevin kısa ve net başlığı."
          },
          description: {
            type: "string",
            description: "Görevin detaylı açıklaması, beklenen çıktılar ve isterler."
          },
          assignedTo: {
            type: "string",
            description: "Görevin atanacağı bot ID (örn: bot-frontend, bot-backend, bot-mobile, bot-devops, bot-qa, bot-tester, bot-designer, bot-lead)."
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Öncelik seviyesi (varsayılan: medium)."
          }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_kanban_task",
      description: "Görev Panosundaki (Kanban) bir görevin durumunu ve açıklamasını günceller. Ajanlar işe başlarken 'in_progress', test aşamasında 'test', tamamlandığında 'done' durumuna getirmelidir.",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "Güncellenecek görevin ID'si (örn: kb-xxxx) veya başlığı."
          },
          status: {
            type: "string",
            enum: ["todo", "in_progress", "test", "done"],
            description: "Yeni durum: 'todo' (Yapılacak), 'in_progress' (Sürüyor), 'test' (Test & Doğrulama), 'done' (Bitti)."
          },
          note: {
            type: "string",
            description: "Yapılan işlem veya sonuç hakkında kısa bilgi notu."
          }
        },
        required: ["taskId", "status"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_kanban_tasks",
      description: "Görev Panosundaki mevcut tüm görevleri ve durumlarını listeler.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "todo", "in_progress", "test", "done"],
            description: "Filtrelenecek durum (varsayılan: all)."
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "query_codebase_graph",
      description: "Projenin Graphify bilgi grafiğini (AST sembolleri, fonksiyon çağrıları, dosya bağımlılıkları, modül toplulukları ve mimari merkezler) doğrudan sorgular. Dosyaları tek tek okumak yerine bağımlılıkları ve mimariyi anında gösterir.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Aranacak sembol, fonksiyon, sınıf veya kavram adı (örn: 'Store', 'execute_bash', 'KanbanBoard', 'MessageItem', 'Flutter')."
          },
          mode: {
            type: "string",
            enum: ["search", "neighbors", "community", "god_nodes"],
            description: "Sorgu modu: 'search' (sembol/dosya ara), 'neighbors' (ilgili sembole gelen ve giden çağrılar/bağlantılar), 'community' (aynı mimari topluluktaki bileşenler), 'god_nodes' (projenin en kritik omurga düğümleri). Varsayılan: search."
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "complete_goal",
      description: "GOAL MODUNDA: Kullanıcının belirlediği hedef ve isterler EKSİKSİZ, ÇALIŞIR ve TEST EDİLMİŞ şekilde tamamlandığında çağrılır. Goal modunu başarıyla sonlandırır.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Hedefin başarıyla nasıl tamamlandığına, yapılan geliştirmelere ve doğrulama sonuçlarına dair detaylı özet."
          }
        },
        required: ["summary"]
      }
    }
  }
];

// Helper: İki metin arasındaki satır farklarını ve diff çıktısını hesapla
function generateSimpleDiff(oldText, newText) {
  if (!oldText) {
    const lines = newText.split("\n");
    const count = lines.length;
    return {
      additions: count,
      deletions: 0,
      diff: lines.slice(0, 100).map(l => `+ ${l}`).join("\n") + (count > 100 ? `\n... (+${count - 100} satır daha)` : "")
    };
  }

  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  let additions = 0;
  let deletions = 0;
  const diffLines = [];

  let i = 0, j = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      i++;
      j++;
    } else {
      if (i < oldLines.length && (j >= newLines.length || !newLines.slice(j, j + 5).includes(oldLines[i]))) {
        diffLines.push(`- ${oldLines[i]}`);
        deletions++;
        i++;
      } else if (j < newLines.length) {
        diffLines.push(`+ ${newLines[j]}`);
        additions++;
        j++;
      }
    }
  }

  return {
    additions,
    deletions,
    diff: diffLines.slice(0, 120).join("\n") + (diffLines.length > 120 ? `\n... (+${diffLines.length - 120} satır daha)` : "")
  };
}

// Helper: Hızlı sözdizimi doğrulaması (Auto-Heal / Syntax Check)
function validateSyntax(fullPath, content) {
  const ext = path.extname(fullPath).toLowerCase();
  try {
    if (ext === ".json") {
      JSON.parse(content);
      return { isValid: true };
    }
    if (ext === ".js" || ext === ".mjs" || ext === ".cjs") {
      const res = spawnSync("node", ["--check", fullPath], { encoding: "utf8", timeout: 2000 });
      if (res.status !== 0) {
        return { isValid: false, error: (res.stderr || "Sözdizimi (syntax) hatası").trim() };
      }
      return { isValid: true };
    }
    if (ext === ".py") {
      const res = spawnSync("python3", ["-m", "py_compile", fullPath], { encoding: "utf8", timeout: 2000 });
      if (res.status !== 0) {
        return { isValid: false, error: (res.stderr || "Python sözdizimi hatası").trim() };
      }
      return { isValid: true };
    }
  } catch (e) {
    return { isValid: false, error: e.message };
  }
  return { isValid: true };
}

// Helper: Graphify Bilgi Grafiği Sorgulama (GraphRAG)
let cachedGraph = null;
let lastGraphMtime = 0;

function queryCodebaseGraph({ query = "", mode = "search" }, workDir) {
  const graphPath = path.resolve(workDir, "graphify-out", "graph.json");
  if (!fs.existsSync(graphPath)) {
    return {
      error: "Graphify bilgi grafiği bulunamadı (graphify-out/graph.json). 'graphify .' komutuyla grafiği oluşturabilirsiniz."
    };
  }

  try {
    const stat = fs.statSync(graphPath);
    if (!cachedGraph || stat.mtimeMs !== lastGraphMtime) {
      cachedGraph = JSON.parse(fs.readFileSync(graphPath, "utf8"));
      lastGraphMtime = stat.mtimeMs;
    }
  } catch (err) {
    return { error: `graph.json okunamadı: ${err.message}` };
  }

  const { nodes = [], links = [] } = cachedGraph;
  const qLower = (query || "").toLowerCase().trim();

  // 1. God Nodes Modu: En çok bağlantıya sahip çekirdek düğümler
  if (mode === "god_nodes") {
    const degrees = new Map();
    links.forEach(l => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      degrees.set(s, (degrees.get(s) || 0) + 1);
      degrees.set(t, (degrees.get(t) || 0) + 1);
    });

    const sortedNodes = [...nodes]
      .map(n => ({
        id: n.id,
        label: n.label,
        file: n.source_file,
        community: n.community_name,
        connections: degrees.get(n.id) || 0
      }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 10);

    return {
      mode: "god_nodes",
      total_nodes: nodes.length,
      total_edges: links.length,
      top_hubs: sortedNodes
    };
  }

  // 2. Neighbors Modu: İlgili düğüme gelen ve giden çağrılar/referanslar
  if (mode === "neighbors") {
    const matchedNode = nodes.find(n =>
      n.id.toLowerCase() === qLower || (n.label && n.label.toLowerCase() === qLower)
    ) || nodes.find(n =>
      n.id.toLowerCase().includes(qLower) || (n.label && n.label.toLowerCase().includes(qLower))
    );

    if (!matchedNode) {
      return {
        mode: "neighbors",
        query,
        message: `'${query}' ile eşleşen bir düğüm bulunamadı. 'search' modu ile benzer düğümleri arayabilirsiniz.`
      };
    }

    const nodeId = matchedNode.id;
    const incoming = [];
    const outgoing = [];

    links.forEach(l => {
      const s = typeof l.source === "object" ? l.source.id : l.source;
      const t = typeof l.target === "object" ? l.target.id : l.target;
      if (s === nodeId) {
        const targetNode = nodes.find(n => n.id === t);
        outgoing.push({
          relation: l.relation || "calls",
          target: targetNode?.label || t,
          file: targetNode?.source_file || l.source_file,
          location: l.source_location
        });
      }
      if (t === nodeId) {
        const sourceNode = nodes.find(n => n.id === s);
        incoming.push({
          relation: l.relation || "calls",
          caller: sourceNode?.label || s,
          file: sourceNode?.source_file || l.source_file,
          location: l.source_location
        });
      }
    });

    return {
      mode: "neighbors",
      node: {
        id: matchedNode.id,
        label: matchedNode.label,
        file: matchedNode.source_file,
        location: matchedNode.source_location,
        community: matchedNode.community_name
      },
      outgoing_calls: outgoing.slice(0, 20),
      incoming_calls: incoming.slice(0, 20)
    };
  }

  // 3. Community Modu: İlgili topluluktaki bileşenler
  if (mode === "community") {
    const matches = nodes.filter(n =>
      (n.community_name && n.community_name.toLowerCase().includes(qLower)) ||
      String(n.community) === qLower
    );

    return {
      mode: "community",
      query,
      count: matches.length,
      members: matches.slice(0, 25).map(m => ({
        label: m.label,
        id: m.id,
        file: m.source_file,
        community: m.community_name
      }))
    };
  }

  // 4. Search Modu (Varsayılan): Sembol, dosya ve kavram arama
  const results = nodes
    .filter(n => {
      const label = (n.label || "").toLowerCase();
      const id = (n.id || "").toLowerCase();
      const file = (n.source_file || "").toLowerCase();
      const comm = (n.community_name || "").toLowerCase();
      return label.includes(qLower) || id.includes(qLower) || file.includes(qLower) || comm.includes(qLower);
    })
    .slice(0, 15)
    .map(n => ({
      label: n.label,
      id: n.id,
      file: n.source_file,
      location: n.source_location,
      community: n.community_name,
      file_type: n.file_type
    }));

  return {
    mode: "search",
    query,
    count: results.length,
    results
  };
}

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
        let content = fs.readFileSync(fullPath, "utf8");
        if (content.length > 50000) {
          const originalLen = content.length;
          content = content.slice(0, 50000) + `\n\n... [⚠️ Dosya çok büyük olduğu için ilk 50.000 karakter okundu. Toplam: ${originalLen.toLocaleString()} karakter]`;
        }
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
        let oldContent = null;
        if (fs.existsSync(fullPath)) {
          oldContent = fs.readFileSync(fullPath, "utf8");
        }
        fs.writeFileSync(fullPath, args.content, "utf8");

        const diffResult = generateSimpleDiff(oldContent, args.content);
        const syntaxCheck = validateSyntax(fullPath, args.content);

        const response = {
          success: true,
          filePath: args.filePath,
          bytesWritten: Buffer.byteLength(args.content),
          additions: diffResult.additions,
          deletions: diffResult.deletions,
          diff: diffResult.diff,
          isNewFile: !oldContent
        };

        if (!syntaxCheck.isValid) {
          response.syntaxError = syntaxCheck.error;
          response.warning = `⚠️ SENTAKS HATASI TESPİT EDİLDİ: ${syntaxCheck.error}. Lütfen bir sonraki adımda bu sentaks hatasını hemen düzelt!`;
        }

        return response;
      } catch (err) {
        return { error: `Dosya yazma hatası: ${err.message}` };
      }
    }

    case "edit_file": {
      try {
        const fullPath = path.isAbsolute(args.filePath) ? args.filePath : path.join(workDir, args.filePath);
        if (!fs.existsSync(fullPath)) {
          return { error: `Dosya bulunamadı: ${args.filePath}` };
        }
        const oldContent = fs.readFileSync(fullPath, "utf8");
        const targetText = args.targetText;
        const replacementText = args.replacementText;

        if (!oldContent.includes(targetText)) {
          return { 
            error: `Hedef metin dosyada bulunamadı: "${targetText.slice(0, 80)}...". Lütfen satır sonları ve girintilerin (indentation) birebir eşleştiğinden emin olun.` 
          };
        }

        let newContent;
        if (args.replaceAll) {
          newContent = oldContent.split(targetText).join(replacementText);
        } else {
          newContent = oldContent.replace(targetText, replacementText);
        }

        fs.writeFileSync(fullPath, newContent, "utf8");

        const diffResult = generateSimpleDiff(oldContent, newContent);
        const syntaxCheck = validateSyntax(fullPath, newContent);

        const response = {
          success: true,
          filePath: args.filePath,
          additions: diffResult.additions,
          deletions: diffResult.deletions,
          diff: diffResult.diff,
          note: `Dosya hedef parça güncellenerek düzenlendi (${diffResult.additions} satır eklendi, ${diffResult.deletions} satır silindi).`
        };

        if (!syntaxCheck.isValid) {
          response.syntaxError = syntaxCheck.error;
          response.warning = `⚠️ SENTAKS HATASI TESPİT EDİLDİ: ${syntaxCheck.error}. Lütfen bir sonraki adımda bu sentaks hatasını hemen düzelt!`;
        }

        return response;
      } catch (err) {
        return { error: `Dosya düzenleme hatası: ${err.message}` };
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
        let list = entries.map(e => ({
          name: e.name,
          type: e.isDirectory() ? "directory" : "file"
        }));
        if (list.length > 250) {
          const total = list.length;
          list = list.slice(0, 250);
          return { directory: targetDir, entries: list, note: `Dizinde toplam ${total} öğe var, ilk 250 tanesi listelendi.` };
        }
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

    case "create_kanban_task": {
      try {
        const newTask = store.saveKanbanTask({
          title: args.title,
          description: args.description || "",
          assignedTo: args.assignedTo || "bot-lead",
          priority: args.priority || "medium",
          status: "todo"
        });
        const assignedBot = store.getBot(newTask.assignedTo);
        return {
          success: true,
          message: `Görev Panosuna eklendi: "${newTask.title}" [${newTask.id}] (Atanan: ${assignedBot?.name || newTask.assignedTo})`,
          task: newTask
        };
      } catch (err) {
        return { error: `Görev kartı oluşturma hatası: ${err.message}` };
      }
    }

    case "update_kanban_task": {
      try {
        const updated = store.updateKanbanTask(args.taskId, {
          status: args.status,
          ...(args.note ? { note: args.note } : {})
        });
        if (!updated) {
          return { error: `Güncellenecek görev bulunamadı: "${args.taskId}". 'list_kanban_tasks' ile mevcut görevleri listeleyebilirsiniz.` };
        }
        return {
          success: true,
          message: `Görev güncellendi: "${updated.title}" -> [${updated.status.toUpperCase()}]`,
          task: updated
        };
      } catch (err) {
        return { error: `Görev güncelleme hatası: ${err.message}` };
      }
    }

    case "list_kanban_tasks": {
      try {
        let tasks = store.getKanbanTasks();
        if (args.status && args.status !== "all") {
          tasks = tasks.filter(t => t.status === args.status);
        }
        return {
          total: tasks.length,
          tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            assignedTo: t.assignedTo,
            priority: t.priority
          }))
        };
      } catch (err) {
        return { error: `Görev listeleme hatası: ${err.message}` };
      }
    }

    case "query_codebase_graph": {
      return queryCodebaseGraph({ query: args.query, mode: args.mode }, workDir);
    }

    case "complete_goal": {
      return {
        isGoalCompleted: true,
        summary: args.summary || "Hedef başarıyla tamamlandı!"
      };
    }

    default:
      return { error: `Tanınmayan araç: ${name}` };
  }
}
