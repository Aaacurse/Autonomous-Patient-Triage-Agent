import { useState, useEffect } from "react"
import { getSessions, getSessionDetail, getSessionsByMrn } from "../api/triage"

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

function SessionDetail({ session, token, onClose }) {
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getSessionDetail(token, session.session_id)
            .then(setDetail)
            .finally(() => setLoading(false))
    }, [session.session_id])

    if (loading) return <p style={styles.muted}>Loading...</p>
    if (!detail?.record) return <p style={styles.muted}>No record found</p>

    const r = detail.record
    const color = ESI_COLORS[r.esi_level] || "#e2e8f0"

    return (
        <div style={styles.detailCard}>
            <div style={styles.detailHeader}>
                <h4 style={styles.detailTitle}>Session Detail</h4>
                <button style={styles.closeBtn} onClick={onClose}>✕</button>
            </div>

            <p style={styles.label}>Patient MRN</p>
            <p style={styles.value}>{detail.mrn}</p>

            <p style={styles.label}>Complaint</p>
            <p style={styles.value}>{r.raw_complaint}</p>

            <p style={styles.label}>ESI Level</p>
            <p style={{ ...styles.value, color, fontWeight: "bold" }}>
                {r.esi_level} — {ESI_LABELS[r.esi_level]}
                {r.escalated && <span style={styles.badge}>ESCALATED</span>}
            </p>

            <p style={styles.label}>Disposition</p>
            <p style={styles.value}>{r.disposition_zone?.replace(/_/g, " ")}</p>

            {r.extracted_symptoms?.length > 0 && (
                <>
                    <p style={styles.label}>Symptoms</p>
                    <div style={styles.tags}>
                        {r.extracted_symptoms.map((s, i) => (
                            <span key={i} style={styles.tag}>{s}</span>
                        ))}
                    </div>
                </>
            )}

            <p style={styles.label}>Pain Score</p>
            <p style={styles.value}>{r.pain_score}/10</p>

            <p style={styles.label}>Reasoning</p>
            <p style={styles.value}>{r.esi_reasoning}</p>
        </div>
    )
}

function HistoryPanel({ token }) {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)
    const [mrnQuery, setMrnQuery] = useState("")
    const [searchResults, setSearchResults] = useState(null) 
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchError, setSearchError] = useState(null)

    useEffect(() => {
    getSessions(token)
        .then((data) => {
            console.log("Sessions response:", data)
            setSessions(data)
        })
        .finally(() => setLoading(false))}, [token])
    
    
    useEffect(() => {
    if (selected) {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        })
    }}, [selected])

    function handleMrnSearch() {
    const mrn = mrnQuery.trim().toUpperCase()
    if (!mrn) return
    setSearchLoading(true)
    setSearchError(null)
    getSessionsByMrn(token, mrn)
        .then((data) => setSearchResults(data))
        .catch((err) => {
            setSearchResults(null)
            setSearchError(err.message)
        })
        .finally(() => setSearchLoading(false))
    }

    function clearSearch() {
        setMrnQuery("")
        setSearchResults(null)
        setSearchError(null)
    }

    if (loading) return <p style={styles.muted}>Loading history...</p>

    const listToShow = searchResults !== null ? searchResults : sessions

    return (
        <div>
            <div style={styles.searchBar}>
                <input
                    style={styles.searchInput}
                    placeholder="Look up patient by MRN (e.g. MRN-00123)"
                    value={mrnQuery}
                    onChange={(e) => setMrnQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleMrnSearch()}
                />
                <button style={styles.searchButton} onClick={handleMrnSearch} disabled={searchLoading}>
                    {searchLoading ? "Searching..." : "Search"}
                </button>
                {searchResults !== null && (
                    <button style={styles.clearButton} onClick={clearSearch}>
                        Clear
                    </button>
                )}
            </div>

            {searchError && <p style={styles.errorText}>{searchError}</p>}

            {searchResults !== null && (
                <p style={styles.sectionLabel}>
                    {searchResults.length} triage{searchResults.length === 1 ? "" : "s"} found for {mrnQuery.trim().toUpperCase()}
                </p>
            )}

            {selected && (
                <SessionDetail
                    session={selected}
                    token={token}
                    onClose={() => setSelected(null)}
                />
            )}

            {listToShow.length === 0 ? (
                <p style={styles.muted}>
                    {searchResults !== null ? "No triages found for this MRN." : "No past sessions yet."}
                </p>
            ) : (
                <div style={styles.list}>
                {listToShow.map((s) => (
                    <div
                        key={s.session_id}
                        style={styles.row}
                        onClick={() => setSelected(s)}
                    >
                        <div>
                            <p style={styles.rowTitle}>{s.mrn}</p>
                            <p style={styles.rowSub}>
                                {new Date(s.created_at).toLocaleString()}
                            </p>
                        </div>
                        <span style={{
                            ...styles.statusBadge,
                            backgroundColor:
                                s.status === "escalated" ? "#fed7d7" :
                                s.status === "completed" ? "#c6f6d5" : "#e2e8f0",
                            color:
                                s.status === "escalated" ? "#c53030" :
                                s.status === "completed" ? "#276749" : "#718096",
                        }}>
                            {s.status}
                        </span>
                    </div>
                ))}
            </div>
            )}
        </div>
    )
}

const styles = {
    muted: { color: "#a0aec0", fontSize: "14px" },
    list: { display: "flex", flexDirection: "column", gap: "0.5rem" },
    row: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem 1rem",
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        cursor: "pointer",
    },
    rowTitle: { margin: 0, fontSize: "14px", fontWeight: "500", color: "#2d3748" },
    rowSub: { margin: "0.25rem 0 0", fontSize: "12px", color: "#a0aec0" },
    statusBadge: {
        padding: "0.25rem 0.75rem",
        borderRadius: "99px",
        fontSize: "12px",
        fontWeight: "500",
    },
    detailCard: {
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1rem",
    },
    detailHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
    },
    detailTitle: { margin: 0, color: "#1a202c" },
    closeBtn: {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "16px",
        color: "#718096",
    },
    label: { margin: "0.75rem 0 0.25rem", fontSize: "12px", color: "#a0aec0", textTransform: "uppercase" },
    value: { margin: 0, fontSize: "14px", color: "#2d3748" },
    tags: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
    tag: {
        backgroundColor: "#ebf8ff",
        color: "#2b6cb0",
        padding: "0.25rem 0.75rem",
        borderRadius: "99px",
        fontSize: "13px",
    },
    badge: {
        marginLeft: "0.75rem",
        backgroundColor: "#fc8181",
        color: "white",
        padding: "0.1rem 0.5rem",
        borderRadius: "99px",
        fontSize: "11px",
    },
    searchBar: { display: "flex", gap: "0.5rem", marginBottom: "0.75rem" },
    searchInput: { flex: 1, padding: "0.65rem 0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" },
    searchButton: { padding: "0.65rem 1.25rem", backgroundColor: "#3182ce", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", cursor: "pointer" },
    clearButton: { padding: "0.65rem 1rem", backgroundColor: "white", color: "#718096", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", cursor: "pointer" },
    sectionLabel: { fontSize: "13px", color: "#718096", margin: "0 0 0.75rem" },
    errorText: { fontSize: "13px", color: "#e53e3e", margin: "0 0 0.75rem" },
    }

export default HistoryPanel