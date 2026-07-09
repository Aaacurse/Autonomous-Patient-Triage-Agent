import { useState, useEffect, useCallback } from "react"
import { login as loginApi, register as registerApi } from "../api/auth"

const TOTAL_SECONDS = 15 * 60     

export function useAuth() {
    const [token, setToken] = useState(
        () => sessionStorage.getItem("token") || null
    )
    const [user, setUser] = useState(null)
    const [showWarning, setShowWarning] = useState(false)
    const [countdown, setCountdown] = useState(TOTAL_SECONDS)

    const logout = useCallback(() => {
        setToken(null)
        setUser(null)
        setShowWarning(false)
        sessionStorage.removeItem("token")
    }, [])

    const stayLoggedIn = useCallback(() => {
    setCountdown(TOTAL_SECONDS)
    }, [])

useEffect(() => {
    if (!token) return

    const interval = setInterval(() => {
        setCountdown((prev) => {
            if (prev <= 1) {
                logout()
                return 0
            }

            return prev - 1
        })
    }, 1000)

    function resetTimer() {
        setCountdown(TOTAL_SECONDS)
    }

    window.addEventListener("mousemove", resetTimer)
    window.addEventListener("keydown", resetTimer)
    window.addEventListener("click", resetTimer)
    window.addEventListener("scroll", resetTimer)

    return () => {
        clearInterval(interval)

        window.removeEventListener("mousemove", resetTimer)
        window.removeEventListener("keydown", resetTimer)
        window.removeEventListener("click", resetTimer)
        window.removeEventListener("scroll", resetTimer)
    }
    }, [token, logout])

    async function login(email, password) {
        try {
            const data = await loginApi(email, password)
            setToken(data.access_token)
            sessionStorage.setItem("token", data.access_token)
            setUser({ email })
            return data.access_token
        } catch (err) {
            return null
        }
    }

    async function register(email, fullName, password) {
        try {
            const data = await registerApi(email, fullName, password)
            setToken(data.access_token)
            sessionStorage.setItem("token", data.access_token)
            setUser({ email })
            return data.access_token
        } catch (err) {
            return null
        }
    }

    return { token, user, login, logout, register, showWarning, countdown, stayLoggedIn }
}