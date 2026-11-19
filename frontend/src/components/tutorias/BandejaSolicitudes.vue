<script setup>
import { ref, computed, onMounted } from 'vue'
import { obtenerSolicitudesRecibidas, responderSolicitud } from '../../services/tutorias'
import { useNotificacionesStore } from '../../stores/notificaciones'
import BotonLeerEnVozAlta from '../ui/BotonLeerEnVozAlta.vue'
import { mensajeDeError } from '../../utils/errores'
import { formatearFecha } from '../../utils/fechas'

const filtros = [
  { valor: 'Pendiente', texto: 'Pendientes' },
  { valor: 'Aceptada', texto: 'Aceptadas' },
  { valor: 'Rechazada', texto: 'Rechazadas' },
  { valor: '', texto: 'Todas' }
]
const filtro = ref('Pendiente')

const solicitudes = ref([])
const cargando = ref(true)
const error = ref('')

const notificaciones = useNotificacionesStore()

const respuestas = ref({})
const confirmandoRechazo = ref(null)

const visibles = computed(() =>
  filtro.value ? solicitudes.value.filter(s => s.estado === filtro.value) : solicitudes.value
)

function cantidad(estado) {
  return estado ? solicitudes.value.filter(s => s.estado === estado).length : solicitudes.value.length
}

const estilosEstado = {
  Pendiente: 'bg-celeste text-azuloscuro',
  Aceptada: 'bg-turquesa text-azuloscuro',
  Rechazada: 'bg-gris/20 text-gris'
}

onMounted(async () => {
  try {
    solicitudes.value = await obtenerSolicitudesRecibidas()
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargando.value = false
  }
})

async function responder(solicitud, decision) {
  confirmandoRechazo.value = null
  respuestas.value[solicitud.idSolicitud] = { enviando: true }
  try {
    const resultado = await responderSolicitud(solicitud.idSolicitud, decision)
    solicitud.estado = resultado.estado
    solicitud.fechaRespuesta = resultado.fechaRespuesta
    notificaciones.actualizarPendientes()
    respuestas.value[solicitud.idSolicitud] = {
      ok: true,
      mensaje: decision === 'Aceptada'
        ? 'Solicitud aceptada. Contactá al alumno por mail o teléfono para coordinar.'
        : 'Solicitud rechazada. Se le avisará al alumno.'
    }
  } catch (err) {
    respuestas.value[solicitud.idSolicitud] = { ok: false, mensaje: mensajeDeError(err) }
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-wrap gap-2">
      <button v-for="f in filtros" :key="f.valor" @click="filtro = f.valor"
        class="px-3 py-1.5 rounded-full text-sm border transition-colors"
        :class="filtro === f.valor ? 'bg-azulutn text-white border-azulutn' : 'bg-white border-gris/40 hover:border-azulutn'">
        {{ f.texto }} ({{ cantidad(f.valor) }})
      </button>
    </div>

    <p v-if="cargando" class="text-gris">Cargando solicitudes…</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>
    <p v-else-if="visibles.length === 0" class="text-gris">No hay solicitudes para mostrar.</p>

    <ul v-else class="space-y-4">
      <li v-for="s in visibles" :key="s.idSolicitud" class="bg-white rounded-xl p-4 space-y-3">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="font-semibold">{{ s.nombreSolicitante }} {{ s.apellidoSolicitante }}</p>
            <p class="text-sm text-gris">{{ s.materia }} · Pedida el {{ formatearFecha(s.fechaPedido) }}</p>
          </div>
          <span class="text-xs font-medium px-2.5 py-1 rounded-full" :class="estilosEstado[s.estado]">
            {{ s.estado }}
          </span>
        </div>

        <div class="bg-fondo rounded-lg p-3 flex items-start gap-2">
          <p class="flex-1 text-sm">{{ s.mensaje }}</p>
          <BotonLeerEnVozAlta :texto="s.mensaje" etiqueta="Leer el mensaje en voz alta" />
        </div>

        <div class="text-sm flex flex-wrap gap-x-6 gap-y-1">
          <span><span class="text-gris">Mail:</span> {{ s.correoSolicitante }}</span>
          <span><span class="text-gris">Teléfono:</span> {{ s.telefonoSolicitante }}</span>
          <span v-if="s.fechaRespuesta"><span class="text-gris">Respondida el</span> {{ formatearFecha(s.fechaRespuesta) }}</span>
        </div>

        <div v-if="s.estado === 'Pendiente'" class="flex flex-wrap items-center gap-2">
          <template v-if="confirmandoRechazo !== s.idSolicitud">
            <button @click="responder(s, 'Aceptada')" :disabled="respuestas[s.idSolicitud]?.enviando"
              class="bg-azulutn text-white rounded-lg px-4 py-2 text-sm disabled:opacity-60">
              Aceptar
            </button>
            <button @click="confirmandoRechazo = s.idSolicitud" :disabled="respuestas[s.idSolicitud]?.enviando"
              class="border border-red-600 text-red-600 rounded-lg px-4 py-2 text-sm hover:bg-red-50 disabled:opacity-60">
              Rechazar
            </button>
          </template>
          <template v-else>
            <span class="text-sm">¿Seguro que querés rechazarla?</span>
            <button @click="responder(s, 'Rechazada')"
              class="bg-red-600 text-white rounded-lg px-4 py-2 text-sm">
              Sí, rechazar
            </button>
            <button @click="confirmandoRechazo = null"
              class="border border-gris/40 rounded-lg px-4 py-2 text-sm">
              Cancelar
            </button>
          </template>
        </div>

        <p v-if="respuestas[s.idSolicitud]?.mensaje" class="text-sm"
          :class="respuestas[s.idSolicitud].ok ? 'text-azulutn' : 'text-red-600'">
          {{ respuestas[s.idSolicitud].mensaje }}
        </p>
      </li>
    </ul>
  </section>
</template>
