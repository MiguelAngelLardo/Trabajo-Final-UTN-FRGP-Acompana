<script setup>
import { ref, onBeforeUnmount } from 'vue'

const emit = defineEmits(['dictado'])

const Reconocimiento = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

const escuchando = ref(false)
const error = ref('')
let reconocimiento = null

const mensajesDeError = {
  'not-allowed': 'No diste permiso para usar el micrófono',
  'no-speech': 'No se escuchó nada, probá de nuevo',
  'audio-capture': 'No se encontró un micrófono',
  network: 'El dictado necesita conexión a internet'
}

function alternar() {
  if (escuchando.value) {
    reconocimiento?.stop()
    return
  }
  error.value = ''
  reconocimiento = new Reconocimiento()
  reconocimiento.lang = 'es-AR'
  reconocimiento.interimResults = false
  reconocimiento.continuous = false
  reconocimiento.onresult = (evento) => {
    const texto = [...evento.results].map(r => r[0].transcript).join(' ').trim()
    if (texto) emit('dictado', texto)
  }
  reconocimiento.onerror = (evento) => {
    error.value = mensajesDeError[evento.error] || 'No se pudo usar el dictado'
  }
  reconocimiento.onend = () => { escuchando.value = false }
  escuchando.value = true
  reconocimiento.start()
}

onBeforeUnmount(() => reconocimiento?.abort())
</script>

<template>
  <span v-if="Reconocimiento" class="inline-flex flex-col items-end">
    <button type="button" @click="alternar"
      :aria-label="escuchando ? 'Detener dictado' : 'Dictar por voz'"
      :title="escuchando ? 'Detener dictado' : 'Dictar por voz'"
      :aria-pressed="escuchando"
      class="inline-flex items-center justify-center h-9 w-9 shrink-0 rounded-lg transition-colors"
      :class="escuchando ? 'bg-red-600 text-white animate-pulse motion-reduce:animate-none' : 'text-gris hover:text-azulutn hover:bg-celeste'">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path stroke-linecap="round" d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
    <span class="sr-only" aria-live="polite">{{ escuchando ? 'Escuchando' : '' }}</span>
    <span v-if="error" class="text-xs text-red-600 mt-1" role="alert">{{ error }}</span>
  </span>
</template>
