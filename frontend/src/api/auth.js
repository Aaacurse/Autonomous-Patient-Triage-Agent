const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export async function login(email, password) {
    const formData = new FormData()
    formData.append("username", email)
    formData.append("password", password)

    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        body: formData,
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Login failed")
    }

    return response.json()  // { access_token, refresh_token, token_type }
}