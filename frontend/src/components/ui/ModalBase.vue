<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  titulo: { type: String, required: true },
  // Mientras hay una petición en curso no se deja cerrar
  bloqueado: { type: Boolean, default: false }
})
const emit = defineEmits(['cerrar'])

function intentarCerrar() {
  if (!props.bloqueado) emit('cerrar')
}

const dialogo = ref(null)
let focoAnterior = null

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function enfocables() {
  return dialogo.value ? [...dialogo.value.querySelectorAll(ENFOCABLES)] : []
}

function alTeclear(e) {
  if (e.key === 'Escape') {
    intentarCerrar()
    return
  }
  if (e.key !== 'Tab') return
  const lista = enfocables()
  if (lista.length === 0) {
    e.preventDefault()
    return
  }
  const primero = lista[0]
  const ultimo = lista[lista.length - 1]
  const actual = document.activeElement
  if (!dialogo.value.contains(actual)) {
    e.preventDefault()
    primero.focus()
  } else if (e.shiftKey && actual === primero) {
    e.preventDefault()
    ultimo.focus()
  } else if (!e.shiftKey && actual === ultimo) {
    e.preventDefault()
    primero.focus()
  }
}

onMounted(async () => {
  focoAnterior = document.activeElement
  document.addEventListener('keydown', alTeclear)
  await nextTick()
  const [primero] = enfocables()
  ;(primero ?? dialogo.value)?.focus()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', alTeclear)
  if (focoAnterior && document.contains(focoAnterior)) focoAnterior.focus()
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      @mousedown.self="intentarCerrar">
      <div ref="dialogo" role="dialog" aria-modal="true" :aria-label="titulo" tabindex="-1"
        class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl focus:outline-none">
        <h2 class="text-lg font-semibold mb-4">{{ titulo }}</h2>
        <slot />
        <div v-if="$slots.acciones" class="mt-6 flex justify-start gap-2">
          <slot name="acciones" />
        </div>
      </div>
    </div>
  </Teleport>
</template>