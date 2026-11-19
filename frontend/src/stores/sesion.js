import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'

const CLAVE_TOKEN = 'acompana_token'
const CLAVE_USUARIO = 'acompana_usuario'

function tokenVencido(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

function leerSesionGuardada() {
  const token = localStorage.getItem(CLAVE_TOKEN)
  if (!token || tokenVencido(token)) {
    localStorage.removeItem(CLAVE_TOKEN)
    localStorage.removeItem(CLAVE_USUARIO)
    return { token: null, usuario: null }
  }
  try {
    return { token, usuario: JSON.parse(localStorage.getItem(CLAVE_USUARIO)) }
  } catch {
    return { token: null, usuario: null }
  }
}

export const useSesionStore = defineStore('sesion', () => {
  const guardada = leerSesionGuardada()
  const token = ref(guardada.token)
  const usuario = ref(guardada.usuario)

  const estaLogueado = computed(() => !!token.value)
  const rol = computed(() => usuario.value?.rol ?? null)
  const esAdmin = computed(() => rol.value === 'Admin')
  const esAlumno = computed(() => rol.value === 'Alumno')

  async function login(correo, contrasena) {
    const data = await api.post('/auth/login', { correo, contrasena })
    token.value = data.token
    usuario.value = data.usuario
    localStorage.setItem(CLAVE_TOKEN, data.token)
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(data.usuario))
    return data.usuario
  }

  function logout() {
    token.value = null
    usuario.value = null
    localStorage.removeItem(CLAVE_TOKEN)
    localStorage.removeItem(CLAVE_USUARIO)
  }

  return { token, usuario, estaLogueado, rol, esAdmin, esAlumno, login, logout }
})
