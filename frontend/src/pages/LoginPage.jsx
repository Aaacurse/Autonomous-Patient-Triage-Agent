import { useState } from "react"

function LoginPage({ onLogin, onRegister }) {
    const [mode, setMode] = useState("login")  // login | register
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        if (!email || !password) {
            setError("Please enter email and password")
            return
        }
        if (mode === "register" && !fullName) {
            setError("Please enter your full name")
            return
        }
        setLoading(true)
        setError(null)
        const success = mode === "login"
            ? await onLogin(email, password)
            : await onRegister(email, fullName, password)
        if (!success) setError(mode === "login" ? "Invalid credentials" : "Registration failed")
        setLoading(false)
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") handleSubmit()
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>Patient Triage System</h2>
                <p style={styles.subtitle}>
                    {mode === "login" ? "Nurse Login" : "Create Account"}
                </p>

                {mode === "register" && (
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                )}

                <input
                    style={styles.input}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                />

                <div style={styles.passwordWrapper}>
                    <input
                        style={{ ...styles.input, flex: 1, margin: 0 }}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        style={styles.eyeButton}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>
                </div>

                {error && <p style={styles.error}>{error}</p>}

                <button
                    style={styles.button}
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading
                        ? "Please wait..."
                        : mode === "login" ? "Login" : "Register"}
                </button>

                <p style={styles.toggle}>
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    <span
                        style={styles.link}
                        onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null) }}
                    >
                        {mode === "login" ? "Register" : "Login"}
                    </span>
                </p>
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
        width: "100%",
        boxSizing: "border-box",
    },
    passwordWrapper: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "0 0.5rem",
    },
    eyeButton: {
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "#718096",
        fontSize: "12px",
        padding: "0.25rem",
        whiteSpace: "nowrap",
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
    toggle: { margin: 0, fontSize: "13px", color: "#718096", textAlign: "center" },
    link: { color: "#3182ce", cursor: "pointer", fontWeight: "500" },
}

export default LoginPage