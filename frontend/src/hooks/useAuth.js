import { useState } from "react"
import { login as loginApi, register as registerApi } from "../api/auth"

export function useAuth() {
    const [token, setToken] = useState(
        () => sessionStorage.getItem("token") || null  // fix 4: persist across refresh
    )
    const [user, setUser] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    async function login(email, password) {
        setLoading(true)
        setError(null)
        try {
            const data = await loginApi(email, password)
            setToken(data.access_token)
            sessionStorage.setItem("token", data.access_token)  // persist
            setUser({ email })
            return data.access_token
        } catch (err) {
            setError(err.message)
            return null
        } finally {
            setLoading(false)
        }
    }

    async function register(email, fullName, password) {
        setLoading(true)
        setError(null)
        try {
            const data = await registerApi(email, fullName, password)
            setToken(data.access_token)
            sessionStorage.setItem("token", data.access_token)
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
        sessionStorage.removeItem("token")
    }

    return { token, user, error, loading, login, logout, register }
}