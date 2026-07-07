function NodeCard({ event, isLast, status }) {
    const { node, data } = event

    const nodeLabels = {
        intake: "Intake — complaint received",
        nlp_extract: "NLP Extraction",
        esi_scorer: "ESI Scoring",
        escalate: "Escalation triggered",
        disposition: "Disposition assigned",
    }

    const isActive = isLast && status === "streaming"

    return (
        <div style={{
            ...styles.card,
            borderLeft: `4px solid ${isActive ? "#f6ad55" : "#48bb78"}`,
            backgroundColor: isActive ? "#fffbeb" : "#f7fafc",
        }}>
            <div style={styles.header}>
                <span style={{
                    ...styles.dot,
                    backgroundColor: isActive ? "#f6ad55" : "#48bb78",
                }} />
                <strong>
                    {isActive ? "⟳ " : "✓ "}
                    {nodeLabels[node] || node}
                </strong>
            </div>

            {data.extracted_symptoms?.length > 0 && (
                <p style={styles.detail}>
                    Symptoms: {data.extracted_symptoms.join(", ")}
                </p>
            )}
            {data.pain_score != null && data.pain_score > 0 && (
                <p style={styles.detail}>Pain score: {data.pain_score}/10</p>
            )}
            {data.esi_level != null && (
                <p style={styles.detail}>ESI Level: {data.esi_level}</p>
            )}
            {data.disposition_zone && (
                <p style={styles.detail}>
                    Routing to: {data.disposition_zone.replace(/_/g, " ")}
                </p>
            )}
            {data.escalated && (
                <p style={{ ...styles.detail, color: "#e53e3e", fontWeight: "bold" }}>
                    ⚠ Immediate escalation
                </p>
            )}
        </div>
    )
}

function StatusPanel({ events, status }) {
    const nodeEvents = events.filter(e => e.event === "node_complete")

    if (nodeEvents.length === 0 && status === "idle") return null

    return (
        <div style={styles.panel}>
            <h3 style={styles.title}>
                {status === "connecting" && "Connecting..."}
                {status === "streaming" && "Agent running..."}
                {status === "complete" && "✓ Triage complete"}
                {status === "error" && "Something went wrong"}
            </h3>
            {nodeEvents.map((event, i) => (
                <NodeCard
                    key={i}
                    event={event}
                    isLast={i === nodeEvents.length - 1}
                    status={status}
                />
            ))}
        </div>
    )
}

const styles = {
    panel: {
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        marginTop: "1.5rem",
    },
    title: { margin: "0 0 0.5rem", color: "#2d3748", fontSize: "16px" },
    card: {
        backgroundColor: "#f7fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "0.75rem 1rem",
    },
    header: { display: "flex", alignItems: "center", gap: "0.5rem" },
    dot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        flexShrink: 0,
    },
    detail: { margin: "0.25rem 0 0", fontSize: "13px", color: "#718096" },
}

export default StatusPanel