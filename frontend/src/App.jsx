import { useAuth } from "./hooks/useAuth"
import LoginPage from "./pages/LoginPage"
import Dashboard from "./pages/Dashboard"

function App() {
    const { token, login, logout } = useAuth()

    if (!token) {
        return <LoginPage onLogin={login} />
    }

    return <Dashboard token={token} onLogout={logout} />
}

export default App