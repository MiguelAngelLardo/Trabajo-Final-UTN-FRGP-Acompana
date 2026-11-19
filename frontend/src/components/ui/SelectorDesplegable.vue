<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  opciones: { type: Array, required: true },
  placeholder: { type: String, default: 'Seleccionar' }
})

const emit = defineEmits(['update:modelValue'])

const abierto = ref(false)
const contenedor = ref(null)
const disparador = ref(null)
const lista = ref(null)

const seleccionada = computed(() => props.opciones.find(o => o.valor === props.modelValue))

function botonesDeOpciones() {
  return lista.value ? [...lista.value.querySelectorAll('[role="option"]')] : []
}

async function abrir() {
  abierto.value = true
  await nextTick()
  const botones = botonesDeOpciones()
  const indice = props.opciones.findIndex(o => o.valor === props.modelValue)
  botones[indice >= 0 ? indice : 0]?.focus()
}

function cerrar({ devolverFoco = false } = {}) {
  abierto.value = false
  if (devolverFoco) disparador.value?.focus()
}

function alternar() {
  if (abierto.value) cerrar()
  else abrir()
}

function elegir(opcion) {
  emit('update:modelValue', opcion.valor)
  cerrar({ devolverFoco: true })
}

function alTeclearEnDisparador(evento) {
  if (['ArrowDown', 'ArrowUp'].includes(evento.key)) {
    evento.preventDefault()
    abrir()
  }
}

function alTeclearEnLista(evento) {
  const botones = botonesDeOpciones()
  const actual = botones.indexOf(document.activeElement)
  const destinos = {
    ArrowDown: Math.min(actual + 1, botones.length - 1),
    ArrowUp: Math.max(actual - 1, 0),
    Home: 0,
    End: botones.length - 1
  }
  if (evento.key in destinos) {
    evento.preventDefault()
    botones[destinos[evento.key]]?.focus()
  } else if (evento.key === 'Tab') {
    cerrar()
  }
}

function cerrarSiClickAfuera(evento) {
  if (contenedor.value && !contenedor.value.contains(evento.target)) {
    cerrar()
  }
}

onMounted(() => document.addEventListener('mousedown', cerrarSiClickAfuera))
onBeforeUnmount(() => document.removeEventListener('mousedown', cerrarSiClickAfuera))
</script>

<template>
  <div ref="contenedor" class="relative" @keydown.esc="cerrar({ devolverFoco: true })">
    <button ref="disparador" type="button" @click="alternar" @keydown="alTeclearEnDisparador"
      :aria-expanded="abierto" aria-haspopup="listbox"
      class="w-full flex items-center justify-between gap-2 border border-gris/50 rounded-lg px-3 py-2 bg-white text-left">
      <span class="truncate" :class="{ 'text-gris': !seleccionada }">
        {{ seleccionada ? seleccionada.texto : placeholder }}
      </span>
      <svg class="w-4 h-4 shrink-0 transition-transform" :class="{ 'rotate-180': abierto }"
        fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <ul v-if="abierto" ref="lista" role="listbox" @keydown="alTeclearEnLista"
      class="absolute top-full left-0 right-0 mt-1 z-20 max-h-64 overflow-y-auto bg-white border border-gris/30 rounded-lg shadow-lg py-1">
      <li v-for="opcion in opciones" :key="opcion.valor">
        <button type="button" role="option" :aria-selected="opcion.valor === modelValue" @click="elegir(opcion)"
          class="w-full text-left px-3 py-2 hover:bg-celeste focus:bg-celeste"
          :class="{ 'bg-celeste font-medium': opcion.valor === modelValue }">
          {{ opcion.texto }}
        </button>
      </li>
    </ul>
  </div>
</template>
