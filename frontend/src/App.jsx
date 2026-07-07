import { useAuth } from "./hooks/useAuth"
import LoginPage from "./pages/LoginPage"
import Dashboard from "./pages/Dashboard"

function App() {
    const { token, login, logout, register } = useAuth()

    if (!token) {
        return <LoginPage onLogin={login} onRegister={register} />
    }

    return <Dashboard token={token} onLogout={logout} />
}

export default App