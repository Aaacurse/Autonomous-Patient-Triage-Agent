import { useState } from "react"
import { login as loginApi } from "../api/auth"

export function useAuth() {
    const [token, setToken] = useState(null)
    const [user, setUser] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    async function login(email, password) {
        setLoading(true)
        setError(null)
        try {
            const data = await loginApi(email, password)
            setToken(data.access_token)
            setUser({ email })
            return data.access_token
        } catch (err) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }

    function logout() {
        setToken(null)
        setUser(null)
    }

    return { token, user, error, loading, login, logout }
}