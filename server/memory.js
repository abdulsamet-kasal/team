import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve("./data");
const MEMORY_FILE = path.join(DATA_DIR, "MEMORY.md");

export const initialRules = [
  "İletişim daima Türkçe olacak.",
  "Kodlamada her zaman Clean Code ve modern mimari prensipleri kullanılacak.",
  "Yeni projeler /home/samet/Projeler/ dizininde başlatılacak ve anında GitHub reposu olarak (abdulsamet-kasal hesabında) açılacak.",
  "Mevcut projelere Samet'in ileteceği GitHub linki klonlanarak devam edilecek.",
  "Projelerde sürekli 'graphify' kullanılarak projenin bilgi grafiği çıkarılacak ve mimari/ilerleme bu grafik üzerinden takip edilecek.",
  "API anahtarları ve secret'lar asla commit edilmeyecek veya pushlanmayacak, sadece yerel bilgisayarda (.gitignore ve .env ile) korunacak.",
  "Samet ekibe tam yetki ve inisiyatif vermiştir (Full Otonom & YOLO): Tüm teknik kararlar, görev dağılımları ve geliştirmeler Samet'ten manuel onay beklenmeden, otonom ve kesintisiz şekilde yürütülecektir."
];

class MemoryManager {
  constructor() {
    this.rules = [...initialRules];
    this.facts = [
      "Kullanıcının adı Samet Kasal (GitHub: abdulsamet-kasal).",
      "Sistem: CachyOS Linux (Arch tabanlı), AMD Ryzen 3 5300U, 8 GB RAM.",
      "Gradle / Java JVM sınırı maksimum 1.5 GB (-Xmx1536M).",
      "Flutter standartları: CardThemeData, .withValues(alpha: ...), Riverpod NotifierProvider."
    ];
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(MEMORY_FILE)) {
        const raw = fs.readFileSync(MEMORY_FILE, "utf8");
        this.parseMemoryFile(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.error("MemoryManager init error:", err);
    }
  }

  parseMemoryFile(content) {
    const lines = content.split("\n");
    const rules = [];
    const facts = [];
    let currentSection = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("## Sabit İş Akışı Kuralları") || trimmed.startsWith("## Kurallar")) {
        currentSection = "rules";
      } else if (trimmed.startsWith("## Proje Hafızası") || trimmed.startsWith("## Hafıza")) {
        currentSection = "facts";
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const item = trimmed.substring(2).trim();
        if (currentSection === "rules") rules.push(item);
        else if (currentSection === "facts") facts.push(item);
      }
    }

    if (rules.length) this.rules = rules;
    if (facts.length) this.facts = facts;
  }

  save() {
    try {
      const content = [
        "# Team AI — Kalıcı Hafıza ve Çalışma Kuralları",
        "",
        "## Sabit İş Akışı Kuralları",
        ...this.rules.map(r => `- ${r}`),
        "",
        "## Proje Hafızası ve Bilgiler",
        ...this.facts.map(f => `- ${f}`),
        ""
      ].join("\n");

      fs.writeFileSync(MEMORY_FILE, content, "utf8");
    } catch (err) {
      console.error("MemoryManager save error:", err);
    }
  }

  getMemoryPrompt() {
    return [
      "<team-memory>",
      "Aşağıdaki 7 sabit kural ve proje hafızası Samet tarafından zorunlu kılınmıştır. Her eylemde bu kurallara kesinlikle uyacaksınız:",
      "SABİT İŞ AKIŞI KURALLARI:",
      ...this.rules.map((r, i) => `${i + 1}. ${r}`),
      "",
      "PROJE BİLGİLERİ:",
      ...this.facts.map(f => `• ${f}`),
      "</team-memory>"
    ].join("\n");
  }

  addFact(fact) {
    if (!this.facts.includes(fact)) {
      this.facts.push(fact);
      this.save();
    }
    return fact;
  }

  addRule(rule) {
    if (!this.rules.includes(rule)) {
      this.rules.push(rule);
      this.save();
    }
    return rule;
  }

  deleteItem(type, index) {
    if (type === "rule" && this.rules[index]) {
      this.rules.splice(index, 1);
      this.save();
    } else if (type === "fact" && this.facts[index]) {
      this.facts.splice(index, 1);
      this.save();
    }
  }
}

export const memoryManager = new MemoryManager();
