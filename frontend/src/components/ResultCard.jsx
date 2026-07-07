const ESI_COLORS = {
    1: "#fc8181",
    2: "#f6ad55",
    3: "#f6e05e",
    4: "#68d391",
    5: "#63b3ed",
}

const ESI_LABELS = {
    1: "Immediate",
    2: "Emergent",
    3: "Urgent",
    4: "Less Urgent",
    5: "Non-Urgent",
}

function ResultCard({ result }) {
    if (!result) return null

    const color = ESI_COLORS[result.esi_level] || "#e2e8f0"

    return (
        <div style={{ ...styles.card, borderLeft: `6px solid ${color}` }}>
            <div style={styles.row}>
                <div>
                    <p style={styles.label}>ESI Level</p>
                    <h2 style={{ ...styles.level, color }}>
                        {result.esi_level} — {ESI_LABELS[result.esi_level]}
                    </h2>
                </div>
                {result.escalated && (
                    <span style={styles.badge}>ESCALATED</span>
                )}
            </div>

            <p style={styles.label}>Disposition</p>
            <p style={styles.value}>{result.disposition_zone?.replace("_", " ")}</p>

            <p style={styles.label}>Clinical Notes</p>
            <p style={styles.value}>{result.clinical_notes}</p>

            <p style={styles.label}>Reasoning</p>
            <p style={styles.value}>{result.esi_reasoning}</p>

            {result.extracted_symptoms?.length > 0 && (
                <>
                    <p style={styles.label}>Symptoms</p>
                    <div style={styles.tags}>
                        {result.extracted_symptoms.map((s, i) => (
                            <span key={i} style={styles.tag}>{s}</span>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

const styles = {
    card: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        marginTop: "1.5rem",
    },
    row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    label: { margin: "0.75rem 0 0.25rem", fontSize: "12px", color: "#a0aec0", textTransform: "uppercase" },
    level: { margin: 0, fontSize: "24px" },
    value: { margin: 0, fontSize: "14px", color: "#2d3748" },
    badge: {
        backgroundColor: "#fc8181",
        color: "white",
        padding: "0.25rem 0.75rem",
        borderRadius: "99px",
        fontSize: "12px",
        fontWeight: "bold",
    },
    tags: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
    tag: {
        backgroundColor: "#ebf8ff",
        color: "#2b6cb0",
        padding: "0.25rem 0.75rem",
        borderRadius: "99px",
        fontSize: "13px",
    },
}

export default ResultCard