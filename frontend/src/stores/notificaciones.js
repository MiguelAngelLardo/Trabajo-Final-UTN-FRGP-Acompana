import { defineStore } from 'pinia'
import { ref } from 'vue'
import { obtenerSolicitudesRecibidas } from '../services/tutorias'

export const INTERVALO_ACTUALIZACION_MS = 30000

export const useNotificacionesStore = defineStore('notificaciones', () => {
  const pendientesRecibidas = ref(0)

  async function actualizarPendientes() {
    try {
      const pendientes = await obtenerSolicitudesRecibidas('Pendiente')
      pendientesRecibidas.value = pendientes.length
    } catch {
      pendientesRecibidas.value = 0
    }
  }

  return { pendientesRecibidas, actualizarPendientes }
})
