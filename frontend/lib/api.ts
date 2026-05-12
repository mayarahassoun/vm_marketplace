  export const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  export const WS_URL =
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"

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
    distro: string
    minDisk: number
    minRam: number
  }

  export const VM_IMAGES: VMImage[] = [
    // 👇 Remplace les IDs par les vrais UUIDs HCS
    // Linux
    { id: "7f22f4d8-4863-45d6-befe-d19ba7e7563a", name: "Ubuntu-Server-24", os: "Linux", distro: "Ubuntu", minDisk: 10, minRam: 2 },
    { id: "4b5a9278-a2ff-4c66-9cfb-4ce9a51ee06d", name: "Ubuntu-Server-22 ", os: "Linux", distro: "Ubuntu", minDisk: 30, minRam: 1 },
    { id: "af743e89-da9b-47a7-962d-41eb074bdfb2", name: "Debian-11",           os: "Linux", distro: "Debian",  minDisk: 40, minRam: 2 },
    { id: " 7be47085-2e35-40b9-855f-c6a1fb602cc9", name: "Debian-10",            os: "Linux", distro: "CentOS",  minDisk: 10, minRam: 2 },
    // Windows
    { id: "b686df0b-5551-4bbc-87e6-041a963f578b", name: "Windows10-Pro", os: "Windows", distro: "Windows", minDisk: 80, minRam: 4 },
    { id: "d4b26806-5192-4e02-925f-022d79a80ac6", name: "Win2022-Standard-64", os: "Windows", distro: "Windows", minDisk: 80, minRam: 16 },
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
