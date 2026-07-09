import { useAuth } from "./hooks/useAuth"
import LoginPage from "./pages/LoginPage"
import Dashboard from "./pages/Dashboard"
import InactivityWarning from "./components/InactivityWarning"

function App() {
    const { token, login, logout, register, showWarning, countdown, stayLoggedIn } = useAuth()

    if (!token) {
        return <LoginPage onLogin={login} onRegister={register} />
    }

    return (
        <>
            {showWarning && (
                <InactivityWarning
                    countdown={countdown}
                    onStayLoggedIn={stayLoggedIn}
                    onLogout={logout}
                />
            )}
            <Dashboard token={token} onLogout={logout} countdown={countdown}/>
        </>
    )
}

export default App