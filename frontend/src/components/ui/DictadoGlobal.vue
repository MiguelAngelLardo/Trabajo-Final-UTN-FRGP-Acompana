<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const Reconocimiento = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

const TIPOS_DE_TEXTO = ['text', 'email', 'search', 'tel', 'url']

const campo = ref(null)
const posicion = ref({ top: 0, left: 0 })
const escuchando = ref(false)
const error = ref('')
let reconocimiento = null
let temporizadorError = null

const mensajesDeError = {
  'not-allowed': 'No diste permiso para usar el micrófono',
  'no-speech': 'No se escuchó nada, probá de nuevo',
  'audio-capture': 'No se encontró un micrófono',
  network: 'El dictado necesita conexión a internet'
}

function admiteDictado(el) {
  if (!el || el.disabled || el.readOnly) return false
  if (el.dataset?.dictado === 'propio') return false
  if (el.tagName === 'TEXTAREA') return true
  if (el.tagName !== 'INPUT') return false
  return TIPOS_DE_TEXTO.includes((el.getAttribute('type') || 'text').toLowerCase())
}

function ubicar() {
  if (!campo.value) return
  const r = campo.value.getBoundingClientRect()
  const tamano = 32
  const centroVertical = campo.value.tagName === 'TEXTAREA' ? r.top + 6 + tamano / 2 : r.top + r.height / 2
  posicion.value = { top: centroVertical - tamano / 2, left: r.right - tamano - 6 }
}

function alEnfocar(evento) {
  if (admiteDictado(evento.target)) {
    if (campo.value !== evento.target) detener()
    campo.value = evento.target
    ubicar()
  }
}

function alDesenfocar() {
  setTimeout(() => {
    if (!escuchando.value && document.activeElement !== campo.value) campo.value = null
  }, 150)
}

function adaptarAlCampo(texto, el) {
  if ((el.getAttribute('type') || '').toLowerCase() === 'email') {
    return texto
      .toLowerCase()
      .replace(/\s*guion bajo\s*/g, '_')
      .replace(/\s*arroba\s*/g, '@')
      .replace(/\s*punto\s*/g, '.')
      .replace(/\s*guion\s*/g, '-')
      .replace(/\s+/g, '')
  }
  if (/^[\d\s.-]+$/.test(texto)) return texto.replace(/[\s.]+/g, '')
  return texto
}

function insertar(textoDictado) {
  const el = campo.value
  if (!el) return
  const texto = adaptarAlCampo(textoDictado, el)
  const limite = el.maxLength > 0 ? el.maxLength : Infinity
  let inicio = el.value.length
  let fin = el.value.length
  try {
    if (typeof el.selectionStart === 'number') {
      inicio = el.selectionStart
      fin = el.selectionEnd
    }
  } catch {
    inicio = fin = el.value.length
  }
  const antes = el.value.slice(0, inicio)
  const despues = el.value.slice(fin)
  const separador = antes && !/\s$/.test(antes) ? ' ' : ''
  const disponible = limite - antes.length - despues.length - separador.length
  if (disponible <= 0) return
  const agregado = separador + texto.slice(0, disponible)
  el.value = antes + agregado + despues
  el.dispatchEvent(new Event('input', { bubbles: true }))
  try {
    const cursor = (antes + agregado).length
    el.setSelectionRange(cursor, cursor)
  } catch {
    return
  }
}

function mostrarError(mensaje) {
  error.value = mensaje
  clearTimeout(temporizadorError)
  temporizadorError = setTimeout(() => { error.value = '' }, 4000)
}

function detener() {
  reconocimiento?.stop()
}

function alternar() {
  if (!campo.value) return
  if (escuchando.value) {
    detener()
    return
  }
  error.value = ''
  reconocimiento = new Reconocimiento()
  reconocimiento.lang = 'es-AR'
  reconocimiento.interimResults = false
  reconocimiento.continuous = false
  reconocimiento.onresult = (evento) => {
    const texto = [...evento.results].map(r => r[0].transcript).join(' ').trim()
    if (texto) insertar(texto)
  }
  reconocimiento.onerror = (evento) => {
    mostrarError(mensajesDeError[evento.error] || 'No se pudo usar el dictado')
  }
  reconocimiento.onend = () => {
    escuchando.value = false
    campo.value?.focus()
  }
  escuchando.value = true
  reconocimiento.start()
}

function alTeclear(evento) {
  if (evento.altKey && evento.key.toLowerCase() === 'm' && campo.value && document.activeElement === campo.value) {
    evento.preventDefault()
    alternar()
  }
}

onMounted(() => {
  if (!Reconocimiento) return
  document.addEventListener('focusin', alEnfocar)
  document.addEventListener('focusout', alDesenfocar)
  document.addEventListener('keydown', alTeclear)
  window.addEventListener('scroll', ubicar, true)
  window.addEventListener('resize', ubicar)
})

onBeforeUnmount(() => {
  document.removeEventListener('focusin', alEnfocar)
  document.removeEventListener('focusout', alDesenfocar)
  document.removeEventListener('keydown', alTeclear)
  window.removeEventListener('scroll', ubicar, true)
  window.removeEventListener('resize', ubicar)
  reconocimiento?.abort()
  clearTimeout(temporizadorError)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="Reconocimiento && campo" class="fixed z-[60]"
      :style="{ top: `${posicion.top}px`, left: `${posicion.left}px` }">
      <button type="button" tabindex="-1" @mousedown.prevent @click="alternar"
        :aria-label="escuchando ? 'Detener dictado (Alt + M)' : 'Dictar por voz (Alt + M)'"
        :title="escuchando ? 'Detener dictado (Alt + M)' : 'Dictar por voz (Alt + M)'"
        :aria-pressed="escuchando"
        class="flex items-center justify-center h-8 w-8 rounded-full shadow border transition-colors"
        :class="escuchando ? 'bg-red-600 text-white border-red-600 animate-pulse' : 'bg-white text-gris border-gris/30 hover:text-azulutn'">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path stroke-linecap="round" d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>
      <p v-if="error" role="alert"
        class="absolute right-0 top-full mt-1 w-56 rounded-lg bg-white px-3 py-2 text-xs text-red-600 shadow-lg border border-red-200">
        {{ error }}
      </p>
    </div>
    <span class="sr-only" aria-live="polite">{{ escuchando ? 'Escuchando' : '' }}</span>
  </Teleport>
</template>
