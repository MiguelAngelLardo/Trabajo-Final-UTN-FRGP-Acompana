import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

function preferencia(clave, claseCss) {
  let inicial = false
  try {
    inicial = localStorage.getItem(clave) === 'true'
  } catch {
    inicial = false
  }

  const activa = ref(inicial)

  watch(activa, (valor) => {
    document.documentElement.classList.toggle(claseCss, valor)
    try {
      localStorage.setItem(clave, String(valor))
    } catch {
      return
    }
  }, { immediate: true })

  return activa
}

export const useAccesibilidadStore = defineStore('accesibilidad', () => {
  const modoDaltonico = preferencia('acompana_modo_daltonico', 'modo-daltonico')
  const fuenteDislexia = preferencia('acompana_fuente_dislexia', 'fuente-dislexia')

  function alternarModoDaltonico() {
    modoDaltonico.value = !modoDaltonico.value
  }

  function alternarFuenteDislexia() {
    fuenteDislexia.value = !fuenteDislexia.value
  }

  return { modoDaltonico, fuenteDislexia, alternarModoDaltonico, alternarFuenteDislexia }
})
