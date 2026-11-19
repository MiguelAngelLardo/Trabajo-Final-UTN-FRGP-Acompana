import { useSesionStore } from '../stores/sesion'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
// “blob” acá significa “quiero que la respuesta se trate como archivo binario, 
// no como texto/JSON”.
async function request(metodo, ruta, body, { blob = false } = {}) {
  const sesion = useSesionStore()
  const headers = {}

  if (sesion.token) {
    headers.Authorization = `Bearer ${sesion.token}`
  }

  const esFormData = body instanceof FormData
  if (body && !esFormData) {
    headers['Content-Type'] = 'application/json'
  }

  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers,
      body: body ? (esFormData ? body : JSON.stringify(body)) : undefined
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Reintente más tarde.')
  }

  if (blob && respuesta.ok) {
    return respuesta.blob()
  }

  const json = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    if (respuesta.status === 401 && sesion.token) {
      sesion.logout()
    }
    const err = new Error(json?.message || 'Ocurrió un error inesperado. Reintente más tarde.')
    err.status = respuesta.status
    err.details = json?.details || []
    throw err
  }

  return json?.data
}

export const api = {
  get: (ruta) => request('GET', ruta),
  getBlob: (ruta) => request('GET', ruta, undefined, { blob: true }),
  post: (ruta, body) => request('POST', ruta, body),
  patch: (ruta, body) => request('PATCH', ruta, body),
  delete: (ruta) => request('DELETE', ruta)
}
