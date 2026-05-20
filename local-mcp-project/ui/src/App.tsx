import { useEffect, useState } from "react";

interface Ticket {
  id: string;
  title: string;
  type: "Feature" | "Bug" | "Chore";
  priority: "Low" | "Medium" | "High";
  description: string;
  status: "To Do" | "In Progress" | "Done" | "Under Review" | "In Validation" | "Blocked";
  assignTo?: string;
  createdAt: string;
}

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const fetchTickets = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/tasks");
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error("Dashboard offline. Ensure Claude Desktop has spawned the backend server module.", err);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, []);

  // Helper color mappings for clean UI presentation
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress": return "#3498db";
      case "Done": return "#2ecc71";
      case "In Validation": return "#f39c12";
      case "Under Review": return "#9b59b6";
      case "Blocked": return "#e74c3c";
      default: return "#95a5a6"; // To Do
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Segoe UI, sans-serif", backgroundColor: "#fafafa", minHeight: "100vh" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ color: "#2c3e50", margin: 0 }}>📊 Local MCP Sprint Board</h1>
        <p style={{ color: "#7f8c8d" }}>Talk to Claude Desktop to append or modify tickets dynamically.</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {tickets.length === 0 ? (
          <div style={{ padding: "2rem", background: "#fff", borderRadius: "8px", border: "1px dashed #ccc", gridColumn: "1/-1", textAlign: "center" }}>
            No active sprint tickets found.
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} style={{ background: "#fff", padding: "1.25rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderTop: ticket.type === "Bug" ? "4px solid #e74c3c" : ticket.type === "Feature" ? "4px solid #2ecc71" : "4px solid #f1c40f" }}>
              
              {/* Header Badge Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#95a5a6" }}>{ticket.id}</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "#eee", color: "#333" }}>
                    {ticket.priority}
                  </span>
                  <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", backgroundColor: getStatusColor(ticket.status), color: "#fff", fontWeight: "bold" }}>
                    {ticket.status || "To Do"}
                  </span>
                </div>
              </div>

              <h3 style={{ margin: "0 0 0.5rem 0", color: "#2c3e50", fontSize: "1.1rem" }}>{ticket.title}</h3>
              <p style={{ color: "#7f8c8d", fontSize: "0.85rem", margin: "0 0 1rem 0", minHeight: "2.5rem" }}>{ticket.description}</p>
              
              <hr style={{ border: "0", borderTop: "1px solid #f0f0f0", margin: "10px 0" }} />
              
              {/* Footer Meta Row */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#7f8c8d" }}>
                <span>📋 {ticket.type}</span>
                <span>👤 Assignee: <strong style={{ color: "#2c3e50" }}>{ticket.assignTo || "Unassigned"}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}