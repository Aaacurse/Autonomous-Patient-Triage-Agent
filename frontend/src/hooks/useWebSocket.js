import { useState, useRef, useCallback } from "react"

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000"

export function useWebSocket(token) {
    const [events, setEvents] = useState([])
    const [status, setStatus] = useState("idle")
    const [result, setResult] = useState(null)
    const wsRef = useRef(null)

    const startTriage = useCallback((complaint, mrn) => {
        // Reset state
        setEvents([])
        setResult(null)
        setStatus("connecting")

        const ws = new WebSocket(`${WS_BASE_URL}/ws/triage?token=${token}`)
        wsRef.current = ws

        ws.onopen = () => {
            setStatus("streaming")
            ws.send(JSON.stringify({
                complaint,
                mrn,
            }))
        }

        ws.onmessage = (e) => {
            const event = JSON.parse(e.data)

            if (event.event === "triage_complete") {
                setTimeout(() => {
                    setResult(event.data)
                    setStatus("complete")
                }, 500)
            } else if (event.event === "error") {
                setStatus("error")
            } else {
                setEvents((prev) => [...prev, event])
            }
        }

        ws.onerror = () => setStatus("error")
        ws.onclose = () => {
            if (status !== "complete") setStatus("idle")
        }
    }, [token])
    function reset() {
        setEvents([])
        setResult(null)
        setStatus("idle")
    }

    return { events, status, result, startTriage, reset }
}