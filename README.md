# 🚀 Team AI — Kendi Otonom Yazılım Ekibin (Sıfır Kısıtlama)

**Team AI**, Telegram/Slack tarzı modern bir sohbet arayüzünde çalışan, sisteminizde **gerçek terminal komutları çalıştırabilen**, dosyalar oluşturup düzenleyebilen ve GitHub'da otomatik repolar açabilen **sınırsız, otonom çoklu-ajan (multi-agent) yazılım ekibi platformudur**.

Inspired by OpenMausBot & Grok Bot — ama hiçbir platform kısıtlaması, donma veya onay engeli olmadan, tamamen sizin kontrolünüzde.

---

## 🌟 Neden Team AI? (OpenMausBot'tan Farkları)

| Özellik | OpenMausBot | **Team AI** |
|---|---|---|
| **Linux / Wayland Yetkisi** | Güvenlik kısıtlaması nedeniyle kapalı (Issue #345) | **Tam Yetkili & Sınırsız:** Gerçek bash/terminal komutları çalıştırabilir |
| **Terminal Komutları** | Onay kartlarıyla sınırlandırılmış | **Canlı Akışlı Terminal:** Çıktılar gerçek zamanlı akar, Full-Auto (YOLO) desteği |
| **GitHub Entegrasyonu** | Harici servisler veya manuel ayar | **Doğrudan Yerel `gh` CLI:** Yeni projede otomatik repo oluşturur ve push eder |
| **Bellek Tüketimi** | Ağır Electron/harness paketi (~300-500 MB) | **Ultra Hafif:** Node.js + Vite/React (~80 MB RAM dostu) |
| **Model Sağlayıcı** | Karmaşık sürücü yapılandırmaları | **9Router & OpenAI Uyumlu:** Yerel 9Router (`http://localhost:20128/v1`) hazır |
| **Kendi Ekibini Kurma** | Sınırlı özelleştirme | **Tamamen Özgür:** Yeni bot ekle, rolünü, rengini, araçlarını ve sistem talimatını belirle |

---

## 👥 Hazır Yazılım Ekibi Kadrosu

1. 👑 **ASametLead (Tech Lead & Chief of Staff):**
   - Sizin tek muhatabınız. Projenizi dinler, analiz eder, görevleri böler, ekibe paslar ve sonuçları derler.
2. 💻 **ASametFrontend (Web & React):**
   - React 19, Next.js 15, TypeScript ve Tailwind CSS ile arayüzleri geliştirir.
3. ⚙️ **ASametBackend (API & Veritabanı):**
   - Node.js, Go, Python, PostgreSQL ve Supabase ile API ve veritabanı mimarisini kurar.
4. 📱 **ASametMobile (Mobil - Flutter/Dart):**
   - Flutter 3.47+, modern `NotifierProvider`, `.withValues(alpha: ...)` standartlarıyla Android & iOS uygulamaları kodlar.
5. 🚀 **ASametDevOps (Altyapı & CI/CD):**
   - Docker, CI/CD, Linux (CachyOS) optimizasyonu ve `gh` CLI ile repo oluşturma işlemlerini yönetir.
6. 🛡️ **ASametQA (Test & Kalite Güvence):**
   - Kod incelemeleri yapar, birim ve entegrasyon testleri yazar, hataları yakalar.
7. 🎨 **ASametDesigner (UI/UX & Design System):**
   - Kullanıcı deneyimi, renk paletleri ve bileşen standartlarını kurgular.
8. 👥 **Yazılım Ekibi (Tüm Ekip Odası):**
   - Tüm ekibin aynı anda canlı tartıştığı ortak çalışma kanalı (`@everyone` veya `@botadı` ile etiketleme).

---

## 🛠️ Botların Sahip Olduğu Gerçek Araçlar (Tools)
- `execute_bash(command)`: Gerçek terminal komutlarını çalıştırır ve çıktısını canlı gösterir.
- `read_file(filePath)`: Dosyaları okur.
- `write_file(filePath, content)`: Dosyaları oluşturur ve günceller.
- `list_directory(dirPath)`: Proje klasöründeki dosyaları listeler.
- `create_github_repo(repoName)`: GitHub'da (`abdulsamet-kasal`) tek komutla yeni repo açıp projeyi push eder.
- `delegate_to_bot(targetBotId, task)`: Takım Liderinin işi diğer uzmanlara paslamasını sağlar.

---

## 🚀 Hızlı Başlangıç

### 1. Kurulum ve Çalıştırma
```bash
git clone https://github.com/abdulsamet-kasal/team.git
cd team
npm install
npm run build
./start.sh
```

Tarayıcınızda otomatik olarak açılır:
👉 **[http://localhost:3000](http://localhost:3000)**

### 2. Arka Planda Sürekli Çalıştırma (Terminal Kapansa Bile)
```bash
nohup ./start.sh > app.log 2>&1 &
```

### 3. Durdurma
```bash
./stop.sh
```

---

## ⌨️ Klavye Kısayolları
- `Enter`: Mesajı gönder
- `Shift + Enter`: Yeni satır
- `Ctrl + \``: Canlı Sistem Terminalini Aç/Kapat

---

## 📄 Lisans
MIT © 2026 Abdulsamet Kasal
