const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export async function getSessions(token) {
    const response = await fetch(`${BASE_URL}/triage/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Failed to fetch sessions")
    return response.json()
}

export async function getSessionDetail(token, sessionId) {
    const response = await fetch(`${BASE_URL}/triage/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error("Failed to fetch session")
    return response.json()
}