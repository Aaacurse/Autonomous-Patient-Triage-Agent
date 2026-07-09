function InactivityWarning({ countdown, onStayLoggedIn, onLogout }) {
    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.iconWrapper}>
                    <span style={styles.icon}>⚠</span>
                </div>
                <h3 style={styles.title}>Session Expiring Soon</h3>
                <p style={styles.message}>
                    You have been inactive. For security, you will be
                    automatically logged out in:
                </p>
                <div style={styles.countdown}>{countdown}s</div>
                <div style={styles.buttons}>
                    <button style={styles.stayButton} onClick={onStayLoggedIn}>
                        Stay Logged In
                    </button>
                    <button style={styles.logoutButton} onClick={onLogout}>
                        Logout Now
                    </button>
                </div>
            </div>
        </div>
    )
}

const styles = {
    overlay: {
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    },
    modal: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "2rem",
        width: "360px",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    },
    iconWrapper: {
        marginBottom: "1rem",
    },
    icon: {
        fontSize: "48px",
    },
    title: {
        margin: "0 0 0.75rem",
        color: "#1a202c",
        fontSize: "18px",
    },
    message: {
        margin: "0 0 1.5rem",
        color: "#718096",
        fontSize: "14px",
        lineHeight: "1.6",
    },
    countdown: {
        fontSize: "48px",
        fontWeight: "bold",
        color: "#e53e3e",
        margin: "0 0 1.5rem",
    },
    buttons: {
        display: "flex",
        gap: "0.75rem",
    },
    stayButton: {
        flex: 1,
        padding: "0.75rem",
        backgroundColor: "#3182ce",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        cursor: "pointer",
    },
    logoutButton: {
        flex: 1,
        padding: "0.75rem",
        backgroundColor: "white",
        color: "#e53e3e",
        border: "1px solid #e53e3e",
        borderRadius: "8px",
        fontSize: "14px",
        cursor: "pointer",
    },
}

export default InactivityWarning