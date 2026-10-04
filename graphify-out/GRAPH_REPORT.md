# Graph Report - team  (2026-10-04)

## Corpus Check
- Corpus is ~33,870 words - fits in a single context window. You may not need a graph.

## Summary
- 296 nodes · 526 edges · 27 communities (7 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.86)
- Token cost: 1,200 input · 850 output

## Community Hubs (Navigation)
- React UI Components
- Backend Agent Runtime
- App Config & Dependencies
- Session & Memory Store
- Linux Flutter Desktop Engine
- Flutter Dart Client
- Web App Manifest
- Team AI Bot Personas
- Android Kotlin Runner
- UI Skeleton Loaders
- Flutter Web Plugins
- Startup Shell Script
- Shutdown Shell Script
- Android HDPI Icon
- Android MDPI Icon
- Android XHDPI Icon
- Android XXHDPI Icon
- Android XXXHDPI Icon
- Web PWA 192 Icon
- Web PWA 512 Icon
- Web Maskable 192 Icon
- Web Maskable 512 Icon

## God Nodes (most connected - your core abstractions)
1. `store` - 45 edges
2. `react` - 26 edges
3. `Button()` - 23 edges
4. `lucide-react` - 19 edges
5. `Badge()` - 19 edges
6. `memoryManager` - 12 edges
7. `App()` - 10 edges
8. `Team AI Autonomous Multi-Agent Platform` - 10 edges
9. `MessageItem()` - 9 edges
10. `ChatArea()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Flutter Music Player Pubspec` --references--> `MyApp`  [EXTRACTED]
  pubspec.yaml → lib/main.dart
- `Dart Analysis Options` --conceptually_related_to--> `Flutter Music Player Pubspec`  [INFERRED]
  analysis_options.yaml → pubspec.yaml
- `Flutter Web Entry HTML` --references--> `Flutter Music Player Pubspec`  [INFERRED]
  web/index.html → pubspec.yaml
- `Flutter Web Entry HTML` --references--> `Web Favicon`  [EXTRACTED]
  web/index.html → web/favicon.png
- `my_application_activate()` --calls--> `fl_register_plugins()`  [INFERRED]
  linux/runner/my_application.cc → linux/flutter/generated_plugin_registrant.cc

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Autonomous Bot Roles** — readme_asametlead, readme_asametfrontend, readme_asametbackend, readme_asametmobile, readme_asametdevops, readme_asametqa, readme_asametdesigner [EXTRACTED 0.95]
- **Flutter Linux Build Configuration** — linux_cmakelists_txt, linux_flutter_cmakelists_txt, linux_runner_cmakelists_txt [EXTRACTED 0.95]
- **Android Launcher Icons** — android_app_src_main_res_mipmap_hdpi_ic_launcher_png, android_app_src_main_res_mipmap_mdpi_ic_launcher_png, android_app_src_main_res_mipmap_xhdpi_ic_launcher_png, android_app_src_main_res_mipmap_xxhdpi_ic_launcher_png, android_app_src_main_res_mipmap_xxxhdpi_ic_launcher_png [EXTRACTED 1.00]

## Communities (27 total, 20 thin omitted)

### Community 0 - "React UI Components"
Cohesion: 0.15
Nodes (31): lucide-react, react, App(), BotModal(), ChatArea(), FileTreeNode(), FileTreeViewer(), COLUMNS (+23 more)

### Community 1 - "Backend Agent Runtime"
Cohesion: 0.08
Nodes (32): ref_node_child_process, ref_node_fs, ref_node_http, ref_node_path, compactToolHistory(), runAgentTurn(), defaultBots, defaultRooms (+24 more)

### Community 2 - "App Config & Dependencies"
Cohesion: 0.05
Nodes (40): Vite Web Entry HTML, bugs, url, dependencies, cors, express, lucide-react, marked (+32 more)

### Community 4 - "Linux Flutter Desktop Engine"
Cohesion: 0.07
Nodes (29): FlPluginRegistry, flutter_linux, FlView, GApplication, gboolean, gchar, gdkx, generated_plugin_registrant (+21 more)

### Community 5 - "Flutter Dart Client"
Cohesion: 0.10
Nodes (20): Dart Analysis Options, build, _counter, createState, _incrementCounter, main, MyApp, MyHomePage (+12 more)

### Community 6 - "Web App Manifest"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, prefer_related_applications, short_name (+2 more)

### Community 7 - "Team AI Bot Personas"
Cohesion: 0.22
Nodes (9): ASametBackend (API & Database), ASametDesigner (UI/UX & Design System), ASametDevOps (Infrastructure & CI/CD), ASametFrontend (Web & React), ASametLead (Tech Lead & Chief of Staff), ASametMobile (Flutter/Dart), ASametQA (Quality Assurance & Testing), Autonomous Bot Toolset (+1 more)

## Knowledge Gaps
- **83 isolated node(s):** `registerPlugins`, `title`, `_counter`, `main`, `build` (+78 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 133 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `store` connect `Session & Memory Store` to `Backend Agent Runtime`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Why does `Team AI Autonomous Multi-Agent Platform` connect `Team AI Bot Personas` to `React UI Components`, `Backend Agent Runtime`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Why does `react` connect `React UI Components` to `UI Card System`, `App Config & Dependencies`, `UI Skeleton Loaders`, `UI Tabs Component`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **What connects `registerPlugins`, `title`, `_counter` to the rest of the system?**
  _83 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `React UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.14658925979680695 - nodes in this community are weakly interconnected._
- **Should `Backend Agent Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.07890070921985816 - nodes in this community are weakly interconnected._
- **Should `App Config & Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.048726467331118496 - nodes in this community are weakly interconnected._