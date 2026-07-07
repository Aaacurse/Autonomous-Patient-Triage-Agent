import { useState } from "react"

function LoginPage({ onLogin }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        if (!email || !password) {
            setError("Please enter email and password")
            return
        }
        setLoading(true)
        setError(null)
        const success = await onLogin(email, password)
        if (!success) setError("Invalid credentials")
        setLoading(false)
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Patient Triage System</h2>
                <p style={styles.subtitle}>Nurse Login</p>

                <input
                    style={styles.input}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    style={styles.input}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <p style={styles.error}>{error}</p>}

                <button
                    style={styles.button}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </div>
        </div>
    )
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f0f4f8",
    },
    card: {
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "360px",
    },
    title: { margin: 0, color: "#1a202c" },
    subtitle: { margin: 0, color: "#718096", fontSize: "14px" },
    input: {
        padding: "0.75rem",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        fontSize: "14px",
        outline: "none",
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
    error: { color: "#e53e3e", fontSize: "13px", margin: 0 },
}

export default LoginPage