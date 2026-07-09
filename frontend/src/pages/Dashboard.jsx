import { useState } from "react"
import { useWebSocket } from "../hooks/useWebSocket"
import StatusPanel from "../components/StatusPanel"
import ResultCard from "../components/ResultCard"
import HistoryPanel from "../components/HistoryPanel"

function Dashboard({ token, onLogout, countdown }) {
    const [tab, setTab] = useState("triage")
    const [complaint, setComplaint] = useState("")
    const [patientId, setPatientId] = useState("")
    const { events, status, result, startTriage, reset } = useWebSocket(token)

    function handleSubmit() {
        if (!complaint.trim()) return
        startTriage(complaint, patientId)
    }

    function handleNewTriage() {
        setComplaint("")
        setPatientId("")
        reset()
    }
    const minutes = Math.floor(countdown / 60)
    const seconds = countdown % 60

    const formattedTime =
        `${minutes}:${seconds.toString().padStart(2, "0")}`

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2 style={styles.title}>Patient Triage Agent</h2>

                <div style={styles.headerRight}>
                    <span style={styles.timer}>
                        Session expires in {formattedTime}
                    </span>

                    <button style={styles.logout} onClick={onLogout}>
                        Logout
                    </button>
                </div>
            </div>  

            {/* Tabs */}
            <div style={styles.tabs}>
                <button
                    style={{ ...styles.tab, ...(tab === "triage" ? styles.activeTab : {}) }}
                    onClick={() => setTab("triage")}
                >
                    New Triage
                </button>
                <button
                    style={{ ...styles.tab, ...(tab === "history" ? styles.activeTab : {}) }}
                    onClick={() => setTab("history")}
                >
                    History
                </button>
            </div>

            {tab === "triage" && (
                <>
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
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button
                                style={styles.button}
                                onClick={handleSubmit}
                                disabled={status === "streaming" || status === "connecting"}
                            >
                                {status === "connecting" ? "Connecting..." :
                                 status === "streaming" ? "Processing..." : "Start Triage"}
                            </button>
                            {(status === "complete" || status === "error") && (
                                <button style={styles.secondaryButton} onClick={handleNewTriage}>
                                    New Triage
                                </button>
                            )}
                        </div>
                    </div>
                    <StatusPanel events={events} status={status} />
                    {result && <ResultCard result={result} />}
                </>
            )}

            {tab === "history" && (
                <HistoryPanel token={token} />
            )}
        </div>
    )
}

const styles = {
    container: { maxWidth: "720px", margin: "0 auto", padding: "2rem 1rem" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
    title: { margin: 0, color: "#1a202c" },
    logout: { background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer", color: "#718096" },
    tabs: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem" },
    tab: { padding: "0.5rem 1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "white", cursor: "pointer", fontSize: "14px", color: "#718096" },
    activeTab: { backgroundColor: "#3182ce", color: "white", border: "1px solid #3182ce" },
    form: { display: "flex", flexDirection: "column", gap: "0.75rem", backgroundColor: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
    input: { padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" },
    textarea: { padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", resize: "vertical", fontFamily: "inherit" },
    button: { flex: 1, padding: "0.75rem", backgroundColor: "#3182ce", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" },
    secondaryButton: { padding: "0.75rem 1.5rem", backgroundColor: "white", color: "#3182ce", border: "1px solid #3182ce", borderRadius: "8px", fontSize: "14px", cursor: "pointer" },
    headerRight: {display: "flex",alignItems: "center",gap: "1rem",},
    timer: {fontSize: "14px",fontWeight: "600",color: "#4a5568",backgroundColor: "#edf2f7",padding: "0.45rem 0.9rem",borderRadius: "999px",},
}

export default Dashboard