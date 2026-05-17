# Local Agile Sprint Management Ecosystem (MCP)

An advanced full-stack task management application featuring a **React/TypeScript dashboard** paired with a **Node.js/TypeScript backend** configured as a custom **Model Context Protocol (MCP)** server. This architecture allows an LLM client (like Claude Desktop) to act as an autonomous agentic teammate capable of reading, mutating, and auditing a localized sprint database via structured JSON-RPC transaction streams.

---

## 🏗️ System Architecture

The application is built on a decoupled, three-tier architecture designed for low-latency state synchronization:

1. **Client UI Layer (React/TypeScript):** A modern, atomic dashboard that polls the localized database engine every 3 seconds, offering immediate operational feedback of project updates.
2. **AI Agentic Layer (Claude Desktop Client):** Processes natural language instructions from the engineer, mapping user intent into structured JSON-RPC protocol requests.
3. **Storage & Protocol Layer (Node.js/Express/MCP Server):** Acts as the atomic state broker. It exposes a declarative tool and prompt schema to the LLM engine while safeguarding the local file system.

---

## 🛠️ Key Technical Features

### 1. Unified Real-Time Sync Pipeline
Bypasses traditional browser caching layers using a combination of server-side HTTP header injection (`Cache-Control: no-store`) and client-side timestamp cache-busting strings (`?_=${Date.now()}`). This guarantees atomic reads straight from the disk layout on every poll heartbeat.

### 2. Context-Isolated File Systems
Utilizes explicit ES Module URL-to-path parsing definitions (`fileURLToPath(import.meta.url)`) rather than volatile execution contexts (`process.cwd()`). This ensures predictable absolute path compilation even when spawned by third-party execution clients inside restricted operating system directories (like Windows `System32`).

### 3. Decoupled JSON-RPC Core Tooling
Exposes strongly typed structural execution routes to the LLM layer:
* `add_sprint_task`: Automated, schema-validated ticket insertion.
* `update_sprint_task`: High-granularity mutations of existing data payloads.
* `get_sprint_task`: Real-time isolated item disk lookup to minimize LLM token overhead.

### 4. Native Protocol Injected Prompts
Features custom-designed workflow templates (`audit-sprint-health` and `tasks-by-status`) mapped directly to the official MCP Specification. These endpoints inject live database data into the prompt context at the protocol layer, allowing the LLM to act as an automated Scrum Master.

---

## 💻 Tech Stack

* **Frontend:** React, TypeScript, Vite, TailwindCSS (Optional)
* **Backend Runtime:** Node.js, TypeScript Compiler (`tsc`)
* **Protocol Standard:** Anthropic Model Context Protocol (MCP) SDK
* **Data Storage:** Flat-File JSON Database System (`tasks.json`)

---

## 🚀 Getting Started & Local Installation

### Prerequisites
* **Node.js** (v24.x or later recommended)
* **Claude for Desktop** client installed

### 1. Repository Installation
```bash
git clone [https://github.com/terrence-celestine/claude-practice.git](https://github.com/terrence-celestine/claude-practice.git)
cd local-mcp-project