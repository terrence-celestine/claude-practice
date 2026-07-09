# Local Agile Sprint Management Ecosystem (MCP)

An advanced full-stack task management application featuring a **React/TypeScript dashboard** paired with a **Node.js/TypeScript backend** configured as a custom **Model Context Protocol (MCP)** server. This architecture allows an LLM client (like Claude Desktop) to act as an autonomous agentic teammate capable of reading, mutating, and auditing a localized sprint database via structured JSON-RPC transaction streams.

---

## 🏗️ System Architecture

The application is built on a decoupled, three-tier architecture designed for low-latency state synchronization:

1. **Client UI Layer (React/TypeScript):** A dashboard that polls the local Express API every 3 seconds, offering immediate visual feedback on project updates.
2. **AI Agentic Layer (Claude Desktop Client):** Processes natural language instructions from the engineer, mapping user intent into structured JSON-RPC tool calls.
3. **Storage & Protocol Layer (Node.js/Express/MCP Server):** Acts as the state broker. It exposes a declarative tool and prompt schema to the LLM over stdio, while also serving task data to the UI over a local HTTP API.

---

## 🛠️ Key Technical Features

### 1. Unified Real-Time Sync Pipeline
Bypasses browser caching using server-side HTTP header injection (`Cache-Control: no-store`) so the UI always reads the latest state from `tasks.json` on every 3-second poll.

### 2. Context-Isolated File Systems
Utilizes explicit ES Module URL-to-path parsing (`fileURLToPath(import.meta.url)`) rather than `process.cwd()`. This ensures predictable absolute path resolution for `tasks.json` even when the server is spawned by Claude Desktop from an arbitrary working directory.

### 3. JSON-RPC Tool Surface
Exposes six strongly typed tools to the LLM layer:
* `add_sprint_task` — Creates a new ticket (`title`, `type`, `priority`, `description`, optional `assignTo`). New tickets default to status `"To Do"`.
* `update_sprint_task` — Updates `status`, `priority`, `description`, `assignTo`, and/or `title` on an existing ticket by `id`.
* `get_sprint_task` — Looks up a single ticket by `id`.
* `delete_sprint_task` — Removes a ticket by `id`.
* `list_sprint_tasks_by_status` — Lists all tickets matching a given `status`.
* `list_sprint_tasks_by_assignee` — Lists all tickets assigned to a given `assignee`.

### 4. Native Protocol Prompt
Includes one MCP prompt template, `tasks-by-status`, which injects the live, filtered ticket list into the prompt context and instructs the LLM to render it as a clean Markdown table.

---

## 💻 Tech Stack

* **Frontend:** React 19, TypeScript, Vite
* **Backend Runtime:** Node.js, Express, TypeScript (`tsc`)
* **Protocol Standard:** [Model Context Protocol (MCP) SDK](https://modelcontextprotocol.io/)
* **Data Storage:** Flat-file JSON database (`server/tasks.json`)

---

## 🚀 Getting Started & Local Installation

### Prerequisites
* **Node.js** (v24.x or later recommended)
* **Claude for Desktop** client installed

### 1. Clone the repository
```bash
git clone https://github.com/terrence-celestine/claude-practice.git
cd claude-practice/local-mcp-project
```

### 2. Install and build the MCP server
```bash
cd server
npm install
npm run build
```
This compiles `src/index.ts` to `build/index.js`, which is the entry point Claude Desktop will spawn. `tasks.json` is created automatically on first run if it doesn't already exist.

### 3. Install and run the UI dashboard
```bash
cd ../ui
npm install
npm run dev
```
The dashboard runs at `http://localhost:3000` and polls the server's API at `http://localhost:5000/api/tasks`. The API only starts once the MCP server process (below) is running.

### 4. Register the server with Claude Desktop
Add an entry to your `claude_desktop_config.json` (on Windows: `%APPDATA%\Claude\claude_desktop_config.json`) pointing at the built server:

```json
{
  "mcpServers": {
    "local-sprint-server": {
      "command": "node",
      "args": ["C:\\absolute\\path\\to\\local-mcp-project\\server\\build\\index.js"]
    }
  }
}
```

Restart Claude Desktop. It will spawn the server over stdio (exposing the tools/prompts above) and the server will simultaneously start the Express API on port `5000` for the dashboard.
