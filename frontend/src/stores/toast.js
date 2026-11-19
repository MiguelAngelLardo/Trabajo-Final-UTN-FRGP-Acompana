import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let siguienteId = 1

  function mostrar(mensaje, tipo = 'exito', duracion = 4000) {
    const id = siguienteId++
    toasts.value.push({ id, mensaje, tipo })
    setTimeout(() => cerrar(id), duracion)
  }

  function cerrar(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return {
    toasts,
    mostrar,
    cerrar,
    exito: (m) => mostrar(m, 'exito'),
    error: (m) => mostrar(m, 'error', 6000),
    aviso: (m) => mostrar(m, 'aviso', 6000)
  }
})