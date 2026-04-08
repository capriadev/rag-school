const API_URL = window.location.origin

async function ensureJsonResponse(response) {
  const contentType = response.headers.get("content-type")
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text()
    throw new Error(`Respuesta no JSON: ${text.substring(0, 200)}`)
  }

  return response.json()
}

export async function listProfilesApi() {
  const response = await fetch(`${API_URL}/api/profiles`)
  return ensureJsonResponse(response)
}

export async function createProfileApi(payload) {
  const response = await fetch(`${API_URL}/api/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return ensureJsonResponse(response)
}

export async function updateProfileApi(id, payload) {
  const response = await fetch(`${API_URL}/api/profiles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return ensureJsonResponse(response)
}

export async function uploadFileApi(formData) {
  const response = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: formData,
  })
  return ensureJsonResponse(response)
}

export async function startFileProcessApi(payload) {
  const response = await fetch(`${API_URL}/api/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return ensureJsonResponse(response)
}

export async function listProcessJobsApi() {
  const response = await fetch(`${API_URL}/api/process/jobs`)
  return ensureJsonResponse(response)
}

export async function getSystemStatusApi() {
  const response = await fetch(`${API_URL}/api/status`)
  return ensureJsonResponse(response)
}
