import { useState,useEffect } from "react"
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

    useEffect(() => {
    if (!token) return

    let timer

    const resetTimer = () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            logout()
        },  15 * 60 * 1000)
    }

    resetTimer()

    window.addEventListener("mousemove", resetTimer)
    window.addEventListener("keydown", resetTimer)
    window.addEventListener("mousedown", resetTimer)
    window.addEventListener("scroll", resetTimer)

    return () => {
        clearTimeout(timer)
        window.removeEventListener("mousemove", resetTimer)
        window.removeEventListener("keydown", resetTimer)
        window.removeEventListener("mousedown", resetTimer)
        window.removeEventListener("scroll", resetTimer)
    }}, [token])

    return { token, user, error, loading, login, logout, register }
}