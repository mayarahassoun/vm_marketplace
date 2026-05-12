  export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  export const WS_URL =
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"

  export function getAuthToken() {
    if (typeof window === "undefined") return null

    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("authToken")
    )
  }

  export function saveAuthToken(token: string) {
    localStorage.setItem("token", token)
    localStorage.setItem("access_token", token)
  }

  export function clearAuthToken() {
    localStorage.removeItem("token")
    localStorage.removeItem("access_token")
    localStorage.removeItem("authToken")
  }

  // ============ AUTH ============
  export async function register(email: string, password: string) {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Register failed")
    }
    return res.json()
  }

  export async function login(email: string, password: string) {
    const formData = new URLSearchParams()
    formData.append("username", email)
    formData.append("password", password)
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Login failed")
    }
    return res.json()
  }

  export async function getCurrentUser(token: string) {
    const res = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Not authenticated")
    return res.json()
  }

  // ============ IMAGES (static list for now) ============
  export type VMImage = {
    id: string
    name: string
    os: "Linux" | "Windows"
    distro: "Ubuntu" | "Debian" | "Other" | "Windows"
    minDisk: number
    minRam: number
    status?: "ready" | "needs_id"
  }

  export const VM_IMAGES: VMImage[] = [
    { id: "2a35768e-4206-4882-b1a6-c78e3a198ac2", name: "Ubuntu-Server-16", os: "Linux", distro: "Ubuntu", minDisk: 10, minRam: 2, status: "ready" },
    { id: "67fc03d1-79d5-4570-90b9-18e304755631", name: "Ubuntu-server-18", os: "Linux", distro: "Ubuntu", minDisk: 10, minRam: 2, status: "ready" },
    { id: "efd9f876-7602-4ff1-be54-e4e899cb9302", name: "Ubuntu-Server-20", os: "Linux", distro: "Ubuntu", minDisk: 10, minRam: 2, status: "ready" },
    { id: "4b5a9278-a2ff-4c66-9cfb-4ce9a51ee06d", name: "Ubuntu-Server-22", os: "Linux", distro: "Ubuntu", minDisk: 30, minRam: 1, status: "ready" },
    { id: "7f22f4d8-4863-45d6-befe-d19ba7e7563a", name: "Ubuntu-Server-24", os: "Linux", distro: "Ubuntu", minDisk: 10, minRam: 2, status: "ready" },
    { id: "9c75e27b-20dd-44fb-93d1-1913d0bb9fbe", name: "Debian-8", os: "Linux", distro: "Debian", minDisk: 2, minRam: 2, status: "ready" },
    { id: "8f232113-b76e-43b4-a663-bf3b0bab31f6", name: "Debian-9", os: "Linux", distro: "Debian", minDisk: 10, minRam: 2, status: "ready" },
    { id: "7be47085-2e35-40b9-855f-c6a1fb602cc9", name: "Debian-10", os: "Linux", distro: "Debian", minDisk: 10, minRam: 2, status: "ready" },
    { id: "af743e89-da9b-47a7-962d-41eb074bdfb2", name: "Debian-11", os: "Linux", distro: "Debian", minDisk: 2, minRam: 2, status: "ready" },
    { id: "8488f3ba-d6f7-4e6b-9cce-8ad9e9e65fe3", name: "AlmaLinux-8", os: "Linux", distro: "Other", minDisk: 10, minRam: 2, status: "ready" },
    { id: "accb790d-bb89-4b3a-bfe8-e478cdce12f4", name: "AlmaLinux-9", os: "Linux", distro: "Other", minDisk: 10, minRam: 2, status: "ready" },
    { id: "0a1121be-2263-4f40-8c53-f58b37dba418", name: "Rocky-8", os: "Linux", distro: "Other", minDisk: 10, minRam: 2, status: "ready" },
    { id: "f247cdd4-7f2d-4ccf-b742-868b9a0a9908", name: "Rocky-9", os: "Linux", distro: "Other", minDisk: 10, minRam: 2, status: "ready" },
    { id: "b686df0b-5551-4bbc-87e6-041a963f578b", name: "Windows10-Pro", os: "Windows", distro: "Windows", minDisk: 80, minRam: 4, status: "ready" },
    { id: "d4b26806-5192-4e02-925f-022d79a80ac6", name: "Win2022-Standard-64", os: "Windows", distro: "Windows", minDisk: 80, minRam: 16, status: "ready" },
  ]
  // ============ VMs ============
  export async function createVM(token: string, payload: {
    instance_name: string
    availability_zone: string
    instance_flavor_id: string
    instance_image_id: string
    security_group_id: string
    subnet_id: string
    administrator_password: string
    system_disk_type: string
    system_disk_size: number
  }) {
    const res = await fetch(`${API_URL}/vms/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || "Failed to create VM")
    }
    return res.json()
  }

  export async function listVMs(token: string) {
    const res = await fetch(`${API_URL}/vms`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) throw new Error("UNAUTHORIZED")
    if (!res.ok) throw new Error("Failed to fetch VMs")
    return res.json()
  }
  export async function deleteVM(token: string, vmId: number) {
    const res = await fetch(`${API_URL}/vms/${vmId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error("Failed to delete VM")
    return res.json()
  }
