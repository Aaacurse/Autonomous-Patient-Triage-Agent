import { useState } from "react"
import { useWebSocket } from "../hooks/useWebSocket"
import StatusPanel from "../components/StatusPanel"
import ResultCard from "../components/ResultCard"

function Dashboard({ token, onLogout }) {
    const [complaint, setComplaint] = useState("")
    const [patientId, setPatientId] = useState("")
    const { events, status, result, startTriage } = useWebSocket(token)

    function handleSubmit() {
        if (!complaint.trim()) return
        startTriage(complaint, patientId)
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Patient Triage Agent</h2>
                <button style={styles.logout} onClick={onLogout}>Logout</button>
            </div>

            <div style={styles.form}>
                <input
                    style={styles.input}
                    placeholder="Patient ID (optional)"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                />
                <textarea
                    style={styles.textarea}
                    placeholder="Enter patient complaint..."
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    rows={4}
                />
                <button
                    style={styles.button}
                    onClick={handleSubmit}
                    disabled={status === "streaming" || status === "connecting"}
                >
                    {status === "connecting" ? "Connecting..." :
                     status === "streaming" ? "Processing..." : "Start Triage"}
                </button>
            </div>

            <StatusPanel events={events} status={status} />
            <ResultCard result={result} />
        </div>
    )
}

const styles = {
    container: {
        maxWidth: "720px",
        margin: "0 auto",
        padding: "2rem 1rem",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1.5rem",
    },
    title: { margin: 0, color: "#1a202c" },
    logout: {
        background: "none",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "0.5rem 1rem",
        cursor: "pointer",
        color: "#718096",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    },
    input: {
        padding: "0.75rem",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        fontSize: "14px",
    },
    textarea: {
        padding: "0.75rem",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        fontSize: "14px",
        resize: "vertical",
        fontFamily: "inherit",
    },
    button: {
        padding: "0.75rem",
        backgroundColor: "#3182ce",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        cursor: "pointer",
    },
}

export default Dashboard