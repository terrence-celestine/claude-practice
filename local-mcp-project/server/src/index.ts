import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TICKET_TYPE, TICKET_PRIORITY, TICKET_STATUS } from "./constants.js";

// 1. Convert the absolute file URL of this running script into a standard Windows path string
const __filename = fileURLToPath(import.meta.url);

// 2. Get the directory name containing that file (resolves to C:\...\server\build)
const __dirname = path.dirname(__filename);

// 3. Step out of the 'build' folder cleanly to target your local 'server' directory root explicitly
const DATA_FILE = path.join(__dirname, "..", "tasks.json");

// Ensure local file storage exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// 1. Initialize the official MCP Server instance
const mcpServer = new Server(
  { name: "local-sprint-server", version: "1.0.0" },
  { capabilities: { tools: {}, prompts: {} } }
);

mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "tasks-by-status",
        description: "Retrieves a list of all current sprint tasks grouped by their status.",
        arguments: [
          {
            name: "status",
            description: "The status category to filter tasks by (e.g., 'To Do', 'In Progress', 'Done'). If omitted, returns all tasks.",
            type: "string",
            required: true
          }
        ]
      }
    ]
  };
});

mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name === "tasks-by-status") {
    try {

    const args = request.params.arguments as { status?: string };
    const status = typeof args?.status === "string" ? args.status.trim() : undefined;

    if (!status) {
      return {
        description: "Here are all current sprint tasks across all statuses.",
        messages: [
          {
            role: "user", content: [{ type: "text", text: "❌ Failure: The 'status' argument is required to execute this prompt." }]
          }
        ]
      };
    }

    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(rawData);
    const filteredTasks = data.filter((task: { status: string }) => task.status.toLowerCase() === String(status).toLowerCase());
    return {
      description: `Here are the current sprint tasks with status '${status}'`,
      messages: [
        {
          role: "user",
          content: { type: "text", text: `Here are the current sprint tasks with status '${status}':\n\n${JSON.stringify(filteredTasks, null, 2)} 
            Please display these items to the user in a clean, highly readable Markdown table. Include the ID, Title, Priority, and Assignee for each item. If no tasks match, politely inform the user.` }
        }
      ]
    };
  } catch (err) {
    return {
      description: "An error occurred while retrieving tasks.",
       messages: [
        { role: "user", 
          content: { type: "text", text: "❌ Failure: An error occurred while retrieving tasks. Please try again later." }
        }
       ]
    };
  }
}
  throw new Error("Prompt template not found");
})

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
            type: { type: "string", enum: [...TICKET_TYPE] },
            priority: { type: "string", enum: [...TICKET_PRIORITY] },
            description: { type: "string", description: "Technical implementation notes" },
            assignTo: { type: "string", description: "The team member this ticket should be assigned to" }
          },
          required: ["title", "type", "priority", "description"],
          optional: ["assignTo"]
        }
      },
      {
        name: "update_sprint_task",
        description: "Updates an existing agile task or issue in the user's project file.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the ticket to update" },
            status: { type: "string", enum: [...TICKET_STATUS], description: "The new status of the ticket" },
            priority: { type: "string", enum: [...TICKET_PRIORITY], description: "The new priority of the ticket" },
            description: { type: "string", description: "The new description of the ticket" },
            assignTo: { type: "string", description: "The new assignee of the ticket" },
            title: { type: "string", description: "The new title of the ticket" }
          },
          required: ["id"]
        }
      },
      {
        name: "get_sprint_task",
        description: "Retrieves the details of a specific sprint task from the user's project file.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the ticket to retrieve" }
          },
          required: ["id"]
        }
      },
      {
        name: "delete_sprint_task",
        description: "Deletes a specific sprint task from the user's project file.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the ticket to delete" }
          },
          required: ["id"]
        }
      }
    ]
  };
});

// 3. Handle execution logic when Claude executes the tool
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  // --- ROUTE A: ADD TASK ---
  if (request.params.name === "add_sprint_task") {
    const args = request.params.arguments as { title: string; type: string; priority: string; description: string };
    
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
  // --- ROUTE B: UPDATE TASK (NEW UPDATE ROUTE) ---
  if (request.params.name === "update_sprint_task") {
    const args = request.params.arguments as { id: string; status?: string; priority?: string; description?: string, assignTo?: string, title?: string };
    
    if (!args || !args.id) {
      return {
        content: [{ type: "text", text: "❌ Failure: The LLM client failed to provide a valid target ticket ID." }],
        isError: true
      };
    }

    const targetId = String(args.id).toUpperCase();
    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(rawData);
    const ticketIndex = data.findIndex((ticket: { id: string }) => ticket.id.toUpperCase() === args.id);

    if (ticketIndex === -1) {
      return {
        content: [{ type: "text", text: `❌ Failure: Ticket with ID ${args.id} not found.` }],
        isError: true
      };
    }
    
      if (args.status) data[ticketIndex].status = args.status;
      if (args.priority) data[ticketIndex].priority = args.priority;
      if (args.description) data[ticketIndex].description = args.description; 
      if (args.assignTo) data[ticketIndex].assignTo = args.assignTo;
      if (args.title) data[ticketIndex].title = args.title;
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

      // 4. FIX: Return a formal success response to stop the stream from falling through
    return {
      content: [{ type: "text", text: `✅ State updated successfully for item ${targetId}.` }]
    };
  }
  // --- ROUTE C: GET TASK (NEW LOOKUP ROUTE) ---
  if (request.params.name === "get_sprint_task") {
    const args = request.params.arguments as { id: string };
    if (!args || !args.id) {
      return { content: [{ type: "text", text: "❌ Failure: Ticket ID parameter is required." }], isError: true };
    }
   
    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    const targetId = String(args.id).toUpperCase();
    const data = JSON.parse(rawData);
    const ticket = data.find((t: { id: string }) => t.id.toUpperCase() === targetId);

    if (!ticket) {
      return {
        content: [{ type: "text", text: `❌ Failure: Ticket with ID ${targetId} could not be located on disk.` }],
        isError: true
      };
    }

    // Return the formatted string representation of the object directly back to Claude
    return {
      content: [
        { 
          type: "text", 
          text: `🔍 Found Ticket Data:\n${JSON.stringify(ticket, null, 2)}` 
        }
      ]
    };
  }
  if (request.params.name === "delete_sprint_task") {
    const args = request.params.arguments as { id: string };
    if (!args || !args.id) {
      return { content: [{ type: "text", text: "❌ Failure: Ticket ID parameter is required." }], isError: true };
    }
    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    const targetId = String(args.id).toUpperCase();
    const data = JSON.parse(rawData);
    const ticketIndex = data.findIndex((t: { id: string }) => t.id.toUpperCase() === targetId);
    if (ticketIndex === -1) {
      return { content: [{ type: "text", text: `❌ Failure: Ticket with ID ${targetId} could not be located on disk.` }], isError: true };
    }
    data.splice(ticketIndex, 1);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return { content: [{ type: "text", text: `✅ Successfully deleted ticket ${targetId}.` }] };
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

app.get("/api/tasks", (_, res) => {
  // Disable aggressive HTTP caching
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const rawData = fs.readFileSync(DATA_FILE, "utf-8");
  res.json(JSON.parse(rawData));
});

app.listen(5000, () => {
  // Log to stderr because stdout is reserved exclusively for the MCP binary protocol streams
  console.error("Express pipeline open on http://localhost:5000");
});