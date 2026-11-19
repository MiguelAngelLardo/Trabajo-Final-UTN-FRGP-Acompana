<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useSesionStore } from '../../stores/sesion'
import { INTERVALO_ACTUALIZACION_MS } from '../../stores/notificaciones'
import { obtenerAvisos } from '../../services/tutorias'
import { formatearFecha } from '../../utils/fechas'
import BotonLeerEnVozAlta from '../ui/BotonLeerEnVozAlta.vue'

const sesion = useSesionStore()
const route = useRoute()

const todos = ref([])
const vistos = ref([])
const eliminados = ref([])
const resaltados = ref([])
const abierto = ref(false)
const contenedor = ref(null)

const claveVistos = computed(() => `acompana_avisos_vistos_${sesion.usuario?.dni}`)
const claveEliminados = computed(() => `acompana_avisos_eliminados_${sesion.usuario?.dni}`)

function claveDe(aviso) {
  return `${aviso.idSolicitud}-${aviso.estado}-${aviso.fechaRespuesta}-${aviso.idMateria}-${aviso.nombreTutor}`
}

function textoDe(aviso) {
  const tutor = `${aviso.nombreTutor} ${aviso.apellidoTutor}`
  return aviso.estado === 'Aceptada'
    ? `${tutor} aceptó tu solicitud de tutoría en ${aviso.materia}. Se va a contactar con vos por mail o teléfono para coordinar.`
    : `${tutor} rechazó tu solicitud de tutoría en ${aviso.materia}.`
}

const avisos = computed(() => todos.value.filter(a => !eliminados.value.includes(claveDe(a))))
const nuevos = computed(() => avisos.value.filter(a => !vistos.value.includes(claveDe(a))))
function leer(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || []
  } catch {
    return []
  }
}

function guardar(clave, valor) {
  localStorage.setItem(clave, JSON.stringify(valor))
}

function marcarTodosComoVistos() {
  vistos.value = avisos.value.map(claveDe)
  guardar(claveVistos.value, vistos.value)
}

async function cargarAvisos() {
  try {
    todos.value = await obtenerAvisos()
  } catch {
    return
  }
  const actuales = new Set(todos.value.map(claveDe))
  vistos.value = vistos.value.filter(k => actuales.has(k))
  eliminados.value = eliminados.value.filter(k => actuales.has(k))
  guardar(claveVistos.value, vistos.value)
  guardar(claveEliminados.value, eliminados.value)
}

function eliminar(aviso) {
  eliminados.value = [...eliminados.value, claveDe(aviso)]
  guardar(claveEliminados.value, eliminados.value)
}

function eliminarTodos() {
  eliminados.value = [...new Set([...eliminados.value, ...avisos.value.map(claveDe)])]
  guardar(claveEliminados.value, eliminados.value)
}

function alternar() {
  abierto.value = !abierto.value
  if (abierto.value) {
    resaltados.value = nuevos.value.map(claveDe)
    marcarTodosComoVistos()
  }
}

function cerrarSiClickAfuera(evento) {
  if (contenedor.value && !contenedor.value.contains(evento.target)) {
    abierto.value = false
  }
}

watch(() => route.fullPath, () => {
  abierto.value = false
  cargarAvisos()
})

let temporizador = null

onMounted(() => {
  vistos.value = leer(claveVistos.value)
  eliminados.value = leer(claveEliminados.value)
  cargarAvisos()
  temporizador = setInterval(cargarAvisos, INTERVALO_ACTUALIZACION_MS)
  document.addEventListener('mousedown', cerrarSiClickAfuera)
})
onBeforeUnmount(() => {
  clearInterval(temporizador)
  document.removeEventListener('mousedown', cerrarSiClickAfuera)
})
</script>

<template>
  <div ref="contenedor" class="relative" @keydown.esc="abierto = false">    <button type="button" @click="alternar" :aria-expanded="abierto"
      :aria-label="nuevos.length ? `Avisos: ${nuevos.length} nuevos` : 'Avisos'"
      class="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
      </svg>
      <span v-if="nuevos.length"
        class="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-turquesa text-azuloscuro text-xs font-bold flex items-center justify-center">
        {{ nuevos.length }}
      </span>
    </button>

    <div v-if="abierto"
      class="absolute right-0 top-full mt-2 z-30 w-80 max-w-[calc(100vw-2rem)] bg-white text-azuloscuro rounded-xl shadow-lg border border-gris/20">
      <div class="px-4 py-3 flex items-center justify-between border-b border-gris/20">
        <p class="font-semibold">Avisos</p>
        <button v-if="avisos.length" type="button" @click="eliminarTodos"
          class="text-xs text-gris hover:text-red-600 transition-colors">
          Borrar todos
        </button>
      </div>

      <p v-if="avisos.length === 0" class="px-4 py-4 text-sm text-gris">No tenés avisos.</p>

      <ul v-else class="max-h-80 overflow-y-auto divide-y divide-gris/10">
        <li v-for="a in avisos" :key="claveDe(a)" class="px-4 py-3 text-sm flex items-start gap-2"
          :class="{ 'bg-celeste/50': resaltados.includes(claveDe(a)) }">
          <div class="flex-1 space-y-1">
            <template v-if="a.estado === 'Aceptada'">
              <p>
                <span class="font-medium">{{ a.nombreTutor }} {{ a.apellidoTutor }}</span>
                aceptó tu solicitud de tutoría en <span class="font-medium">{{ a.materia }}</span>.
              </p>
              <p class="text-azulutn">Se va a contactar con vos por mail o teléfono para coordinar.</p>
            </template>
            <p v-else>
              <span class="font-medium">{{ a.nombreTutor }} {{ a.apellidoTutor }}</span>
              rechazó tu solicitud de tutoría en <span class="font-medium">{{ a.materia }}</span>.
            </p>
            <p class="text-xs text-gris">{{ formatearFecha(a.fechaRespuesta) }}</p>
          </div>
          <BotonLeerEnVozAlta :texto="textoDe(a)" etiqueta="Leer el aviso en voz alta" />
          <button type="button" @click="eliminar(a)" aria-label="Eliminar aviso"
            class="shrink-0 p-1 rounded text-gris hover:text-red-600 hover:bg-red-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
