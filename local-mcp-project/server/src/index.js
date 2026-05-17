import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "tasks.json");
// Ensure local file storage exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}
// 1. Initialize the official MCP Server instance
const mcpServer = new Server({ name: "local-sprint-server", version: "1.0.0" }, { capabilities: { tools: {} } });
// 2. Expose the structured JSON tool schema to Claude
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "add_sprint_task",
                description: "Logs a strongly-typed agile task or issue directly into the user's project file.",
                inputSchema: {
                    type: "object",
                    properties: {
                        title: { type: "string", description: "The name of the ticket" },
                        type: { type: "string", enum: ["Feature", "Bug", "Chore"] },
                        priority: { type: "string", enum: ["Low", "Medium", "High"] },
                        description: { type: "string", description: "Technical implementation notes" }
                    },
                    required: ["title", "type", "priority", "description"]
                }
            },
            {
                name: "update_sprint_task",
                description: "Updates the status of an existing sprint task.",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: { type: "string", description: "The ID of the ticket to update" },
                        status: { type: "string", enum: ["To Do", "In Progress", "Done"], description: "The new status of the ticket" },
                        assignTo: { type: "string", description: "The team member this ticket should be assigned to (optional)" }
                    },
                    required: ["id"]
                }
            }
        ]
    };
});
// 3. Handle execution logic when Claude executes the tool
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "add_sprint_task") {
        const args = request.params.arguments;
        const rawData = fs.readFileSync(DATA_FILE, "utf-8");
        const data = JSON.parse(rawData);
        const newTicket = {
            id: `TICKET-${Date.now().toString().slice(-4)}`,
            ...args,
            status: "To Do",
            createdAt: new Date().toLocaleTimeString()
        };
        data.push(newTicket);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return {
            content: [{ type: "text", text: `✅ Successfully created ticket ${newTicket.id} in local storage.` }]
        };
    }
    throw new Error("Requested tool not found.");
});
// 4. Fire up the MCP Link over Standard Streams
const transport = new StdioServerTransport();
mcpServer.connect(transport);
// 5. Spin up parallel Express API to serve data to React Frontend
const app = express();
app.use(cors());
app.use(express.json());
app.get("/api/tasks", (req, res) => {
    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    res.json(JSON.parse(rawData));
});
app.listen(5000, () => {
    // Log to stderr because stdout is reserved exclusively for the MCP binary protocol streams
    console.error("Express pipeline open on http://localhost:5000");
});
//# sourceMappingURL=index.js.map