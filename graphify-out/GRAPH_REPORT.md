# Graph Report - team  (2026-10-04)

## Corpus Check
- 70 files · ~38,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 310 nodes · 516 edges · 28 communities (8 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Team AI Agents & System Specs
- React App Main Shell & Navigation
- Team AI State Store & Event Bus
- Project Manifest & Configuration
- Linux Desktop Flutter Runner
- Flutter Mobile App Core (Dart)
- Web App Manifest & Metadata
- Chat UI & Interactive Tool Cards
- NPM Dependencies & External Libs
- UI Design System (Card Components)
- UI Design System (Skeleton Loaders)
- Dartpad Web Plugin Registration
- Server Startup Shell Script
- Server Shutdown Shell Script
- Android App Gradle Build Script
- Android MDPI Launcher Icon
- Android XHDPI Launcher Icon
- Android XXHDPI Launcher Icon
- Android XXXHDPI Launcher Icon
- Android Root Gradle Configuration
- Web App Icon (512px)
- Web Maskable Icon (192px)
- Web Maskable Icon (512px)
- Community 27

## God Nodes (most connected - your core abstractions)
1. `Store` - 49 edges
2. `react` - 27 edges
3. `lucide-react` - 20 edges
4. `Button()` - 17 edges
5. `memoryManager` - 12 edges
6. `Team AI Autonomous Multi-Agent Platform` - 10 edges
7. `MessageItem()` - 9 edges
8. `Badge()` - 8 edges
9. `_MyApplication` - 7 edges
10. `executeCommand()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Flutter Music Player Pubspec` --references--> `MyApp`  [EXTRACTED]
  pubspec.yaml → lib/main.dart
- `Dart Analysis Options` --conceptually_related_to--> `Flutter Music Player Pubspec`  [INFERRED]
  analysis_options.yaml → pubspec.yaml
- `Flutter Web Entry HTML` --references--> `Flutter Music Player Pubspec`  [INFERRED]
  web/index.html → pubspec.yaml
- `Flutter Web Entry HTML` --references--> `Web Favicon`  [EXTRACTED]
  web/index.html → web/favicon.png
- `BotModal()` --calls--> `Button()`  [EXTRACTED]
  src/components/BotModal.jsx → src/components/ui/Button.jsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Autonomous Bot Roles** — readme_asametlead, readme_asametfrontend, readme_asametbackend, readme_asametmobile, readme_asametdevops, readme_asametqa, readme_asametdesigner [EXTRACTED 0.95]
- **Flutter Linux Build Configuration** — linux_cmakelists_txt, linux_flutter_cmakelists_txt, linux_runner_cmakelists_txt [EXTRACTED 0.95]
- **Android Launcher Icons** — android_app_src_main_res_mipmap_hdpi_ic_launcher_png, android_app_src_main_res_mipmap_mdpi_ic_launcher_png, android_app_src_main_res_mipmap_xhdpi_ic_launcher_png, android_app_src_main_res_mipmap_xxhdpi_ic_launcher_png, android_app_src_main_res_mipmap_xxxhdpi_ic_launcher_png [EXTRACTED 1.00]

## Communities (28 total, 20 thin omitted)

### Community 0 - "Team AI Agents & System Specs"
Cohesion: 0.06
Nodes (46): ASametBackend (API & Database), ASametDesigner (UI/UX & Design System), ASametDevOps (Infrastructure & CI/CD), ASametFrontend (Web & React), ASametLead (Tech Lead & Chief of Staff), ASametMobile (Flutter/Dart), ASametQA (Quality Assurance & Testing), Autonomous Bot Toolset (+38 more)

### Community 1 - "React App Main Shell & Navigation"
Cohesion: 0.12
Nodes (25): lucide-react, react, App(), BotModal(), ChatArea(), FileTreeNode(), FileTreeViewer(), COLUMNS (+17 more)

### Community 3 - "Project Manifest & Configuration"
Cohesion: 0.06
Nodes (32): Vite Web Entry HTML, bugs, url, description, devDependencies, tailwindcss, @tailwindcss/vite, vite (+24 more)

### Community 4 - "Linux Desktop Flutter Runner"
Cohesion: 0.07
Nodes (29): FlPluginRegistry, flutter_linux, FlView, GApplication, gboolean, gchar, gdkx, generated_plugin_registrant (+21 more)

### Community 5 - "Flutter Mobile App Core (Dart)"
Cohesion: 0.10
Nodes (20): Dart Analysis Options, build, _counter, createState, _incrementCounter, main, MyApp, MyHomePage (+12 more)

### Community 6 - "Web App Manifest & Metadata"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, prefer_related_applications, short_name (+2 more)

### Community 7 - "Chat UI & Interactive Tool Cards"
Cohesion: 0.53
Nodes (8): MessageItem(), BashToolCard(), DelegationToolCard(), FileToolCard(), GraphToolCard(), KanbanToolCard(), SpecialResultCard(), useCopy()

### Community 9 - "UI Design System (Card Components)"
Cohesion: 0.25
Nodes (8): dependencies, cors, express, lucide-react, marked, react, react-dom, ws

## Knowledge Gaps
- **83 isolated node(s):** `activeProcesses`, `DATA_DIR`, `initialRules`, `MEMORY_FILE`, `COLUMNS` (+78 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 135 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Store` connect `Team AI State Store & Event Bus` to `Team AI Agents & System Specs`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **Why does `Team AI Autonomous Multi-Agent Platform` connect `Team AI Agents & System Specs` to `React App Main Shell & Navigation`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `react` connect `React App Main Shell & Navigation` to `Android Native MainActivity & Bridge`, `Project Manifest & Configuration`, `Dartpad Web Plugin Registration`, `Chat UI & Interactive Tool Cards`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **What connects `activeProcesses`, `DATA_DIR`, `initialRules` to the rest of the system?**
  _83 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Team AI Agents & System Specs` be split into smaller, more focused modules?**
  _Cohesion score 0.06289308176100629 - nodes in this community are weakly interconnected._
- **Should `React App Main Shell & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.11819727891156463 - nodes in this community are weakly interconnected._
- **Should `Team AI State Store & Event Bus` be split into smaller, more focused modules?**
  _Cohesion score 0.07729468599033816 - nodes in this community are weakly interconnected._