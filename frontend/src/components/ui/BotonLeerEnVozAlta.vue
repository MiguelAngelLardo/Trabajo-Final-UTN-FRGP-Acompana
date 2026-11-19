<script setup>
import { ref, onBeforeUnmount } from 'vue'

const props = defineProps({
  texto: { type: String, required: true },
  etiqueta: { type: String, default: 'Leer en voz alta' }
})

const soportado = typeof window !== 'undefined' && 'speechSynthesis' in window
const hablando = ref(false)

function vozEnEspanol() {
  const voces = window.speechSynthesis.getVoices()
  return voces.find(v => v.lang === 'es-AR')
    || voces.find(v => v.lang.startsWith('es'))
    || null
}

function alternar() {
  const sintesis = window.speechSynthesis
  if (hablando.value) {
    sintesis.cancel()
    hablando.value = false
    return
  }
  sintesis.cancel()
  const lectura = new SpeechSynthesisUtterance(props.texto)
  lectura.lang = 'es-AR'
  const voz = vozEnEspanol()
  if (voz) lectura.voice = voz
  lectura.onend = () => { hablando.value = false }
  lectura.onerror = () => { hablando.value = false }
  hablando.value = true
  sintesis.speak(lectura)
}

onBeforeUnmount(() => {
  if (hablando.value) window.speechSynthesis.cancel()
})
</script>

<template>
  <button v-if="soportado" type="button" @click="alternar"
    :aria-label="hablando ? 'Detener lectura' : etiqueta"
    :title="hablando ? 'Detener lectura' : etiqueta"
    :aria-pressed="hablando"
    class="inline-flex items-center justify-center h-9 w-9 shrink-0 rounded-lg transition-colors"
    :class="hablando ? 'bg-azulutn text-white' : 'text-gris hover:text-azulutn hover:bg-celeste'">
    <svg v-if="!hablando" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
    <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  </button>
</template>
