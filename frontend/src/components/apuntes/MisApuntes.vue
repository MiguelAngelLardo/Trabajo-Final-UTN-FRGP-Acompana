<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import SelectorDesplegable from '../ui/SelectorDesplegable.vue'
import ModalBase from '../ui/ModalBase.vue'
import { useToastStore } from '../../stores/toast'
import {
  cargarApunte,
  listarMisApuntes,
  eliminarApunte as eliminarApunteService,
  validarArchivoPdf,
  abrirApunte
} from '../../services/apuntes'
import { obtenerMisCarreras, obtenerMateriasAprobadas } from '../../services/catalogo'
import { mensajeDeError } from '../../utils/errores'

const toast = useToastStore()

// Carreras del alumno con sus materias aprobadas:
// [{ idCarrera, nombre, materias: [{ idMateria, nombre }] }]
const misCarreras = ref([])
const apuntes = ref([])

const idCarrera = ref('')
const idMateria = ref('')
const titulo = ref('')
const descripcion = ref('')
const archivo = ref(null)
const inputArchivo = ref(null)

const cargandoFiltros = ref(false)
const cargandoTabla = ref(false)
const enviando = ref(false)
const error = ref('')

// Confirmación pendiente:
// { tipo: 'subir' } | { tipo: 'eliminar', apunte }
const confirmacion = ref(null)
const errorModal = ref('')

const opcionesCarrera = computed(() =>
  misCarreras.value.map(c => ({ valor: c.idCarrera, texto: c.nombre }))
)

// Solo se puede subir un apunte de una materia aprobada
// (lo valida el backend), así que el selector ofrece esas
const opcionesMateria = computed(() => {
  const carrera = misCarreras.value.find(c => c.idCarrera === idCarrera.value)
  return (carrera?.materias || []).map(m => ({ valor: m.idMateria, texto: m.nombre }))
})

const materiaSeleccionada = computed(() =>
  opcionesMateria.value.find(m => m.valor === idMateria.value)?.texto || ''
)

// listarMisApuntes no trae el nombre de la materia, así que
// se busca en las materias aprobadas ya cargadas
function nombreMateria(idBuscado) {
  const materia = misCarreras.value
    .flatMap(c => c.materias)
    .find(m => m.idMateria === idBuscado)
  return materia ? materia.nombre : 'Materia no disponible'
}

async function cargarDatosDelAlumno() {
  cargandoFiltros.value = true
  try {
    const carreras = await obtenerMisCarreras()
    misCarreras.value = await Promise.all(
      carreras.map(async c => ({
        ...c,
        materias: await obtenerMateriasAprobadas(c.idCarrera)
      }))
    )
    // Con una sola carrera no tiene sentido que la elija
    if (misCarreras.value.length === 1) {
      idCarrera.value = misCarreras.value[0].idCarrera
    }
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargandoFiltros.value = false
  }
}

async function cargarMisApuntes() {
  cargandoTabla.value = true
  try {
    apuntes.value = await listarMisApuntes()
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargandoTabla.value = false
  }
}

function alSeleccionarArchivo(evento) {
  archivo.value = evento.target.files[0] || null
}

// Primero valida; si está todo bien, abre el modal
// que confirma la subida antes de enviarla
function pedirConfirmacionSubida() {
  error.value = ''
  errorModal.value = ''

  // Mismas reglas que el backend: PDF de hasta 10 MB
  const errorArchivo = validarArchivoPdf(archivo.value)
  if (errorArchivo) {
    error.value = errorArchivo
    return
  }

  confirmacion.value = { tipo: 'subir' }
}

function pedirConfirmacionEliminar(apunte) {
  errorModal.value = ''
  confirmacion.value = { tipo: 'eliminar', apunte }
}

async function confirmarAccion() {
  if (enviando.value || !confirmacion.value) return
  enviando.value = true
  errorModal.value = ''
  error.value = ''

  try {
    if (confirmacion.value.tipo === 'subir') {
      await cargarApunte({
        idMateria: idMateria.value,
        nombre: titulo.value.trim(),
        descripcion: descripcion.value.trim() || undefined,
        archivo: archivo.value
      })
      toast.exito('Apunte cargado correctamente')
      limpiarFormulario()
      await cargarMisApuntes()
    } else {
      await eliminarApunteService(confirmacion.value.apunte.id)
      toast.exito('Apunte eliminado correctamente')
      await cargarMisApuntes()
    }
    confirmacion.value = null
  } catch (err) {
    // El error se muestra dentro del modal, que queda abierto
    errorModal.value = mensajeDeError(err)
  } finally {
    enviando.value = false
  }
}

function limpiarFormulario() {
  // Si tiene una sola carrera, la deja elegida
  idCarrera.value = misCarreras.value.length === 1
    ? misCarreras.value[0].idCarrera
    : ''
  idMateria.value = ''
  titulo.value = ''
  descripcion.value = ''
  archivo.value = null
  // Resetea el input file nativo para que no quede el nombre del archivo
  if (inputArchivo.value) inputArchivo.value.value = ''
}

// Abre el PDF en una pestaña nueva del navegador
async function descargar(apunte) {
  error.value = ''
  try {
    await abrirApunte(apunte.id)
  } catch (err) {
    error.value = mensajeDeError(err)
  }
}

// Cambio de carrera: la materia elegida ya no aplica
watch(idCarrera, () => {
  idMateria.value = ''
})

onMounted(() => {
  cargarDatosDelAlumno()
  cargarMisApuntes()
})

// --- Para el modal de confirmación ---
const tituloModal = computed(() =>
  confirmacion.value?.tipo === 'subir'
    ? 'Subir apunte'
    : 'Eliminar apunte'
)

const textoConfirmar = computed(() => {
  const esSubida = confirmacion.value?.tipo === 'subir'
  if (esSubida) return enviando.value ? 'Subiendo…' : 'Subir apunte'
  return enviando.value ? 'Eliminando…' : 'Eliminar'
})

const estiloConfirmar = computed(() =>
  confirmacion.value?.tipo === 'eliminar'
    ? 'bg-red-700 hover:bg-red-800'
    : 'bg-azulutn hover:bg-azulutn/90'
)
</script>

<template>
  <section class="space-y-6">
    <h2 class="text-xl font-bold text-azuloscuro">Mis apuntes</h2>

    <!-- Formulario de Subir apunte -->
    <form @submit.prevent="pedirConfirmacionSubida" class="bg-white rounded-xl shadow p-5 space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-azuloscuro">Carrera</label>
          <SelectorDesplegable v-model="idCarrera" :opciones="opcionesCarrera"
            placeholder="Elegí una carrera" />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-azuloscuro">Materia</label>
          <SelectorDesplegable v-model="idMateria" :opciones="opcionesMateria"
            placeholder="Elegí una materia" />
        </div>
      </div>

      <p v-if="!cargandoFiltros && misCarreras.length === 0" class="text-gris text-sm">
        Para subir apuntes primero registrá materias aprobadas en Mi perfil.
      </p>

      <div class="space-y-1">
        <label class="block text-sm font-semibold text-azuloscuro">Título del apunte</label>
        <input v-model="titulo" type="text" maxlength="50" required
          class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-semibold text-azuloscuro">Descripción</label>
        <input v-model="descripcion" type="text" maxlength="50"
          class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
      </div>

      <div class="space-y-1">
        <label class="block text-sm font-semibold text-azuloscuro">Apunte PDF</label>
        <input ref="inputArchivo" type="file" accept="application/pdf"
          @change="alSeleccionarArchivo"
          class="w-full text-sm text-gris file:mr-4 file:rounded-lg file:border file:border-azulutn file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-azulutn file:cursor-pointer hover:file:bg-celeste" />
        <p v-if="archivo" class="text-xs text-gris">{{ archivo.name }}</p>
      </div>

      <p v-if="error" role="alert" class="text-red-600 text-sm">{{ error }}</p>

      <div class="flex justify-end">
        <button type="submit" :disabled="enviando"
          class="bg-azulutn text-white font-semibold rounded-lg px-4 py-2 hover:bg-azulutn/90 disabled:opacity-60">
          {{ enviando ? 'Subiendo…' : 'Subir apunte' }}
        </button>
      </div>
    </form>

    <!-- Tabla de apuntes: siempre visible. Cada fila tiene icono de archivo,
         título del apunte y debajo el nombre de la materia; a la derecha,
         botones para descargar y eliminar -->
    <div class="bg-white rounded-xl shadow overflow-hidden">
      <p v-if="cargandoTabla" class="px-4 py-8 text-center text-gris">
        Cargando tus apuntes…
      </p>
      <table v-else class="w-full text-sm">
        <tbody>
          <tr v-for="apunte in apuntes" :key="apunte.id"
            class="border-b border-gris/20 last:border-0">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <svg class="h-6 w-6 shrink-0 text-azulutn" fill="none" stroke="currentColor"
                  stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <div>
                  <p class="font-semibold text-azuloscuro">{{ apunte.nombre }}</p>
                  <p class="text-xs text-gris">{{ nombreMateria(apunte.idMateria) }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-4">
                <button type="button" @click="descargar(apunte)"
                  class="text-sm text-turquesa font-semibold cursor-pointer hover:text-azulutn hover:underline">
                  Descargar
                </button>
                <button type="button" @click="pedirConfirmacionEliminar(apunte)"
                  title="Eliminar"
                  class="text-gris hover:text-red-600">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5"
                    viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="apuntes.length === 0">
            <td colspan="2" class="px-4 py-8 text-center text-gris">
              No subiste ningún apunte todavía.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de confirmación, abierto antes de subir o eliminar -->
    <ModalBase v-if="confirmacion" :titulo="tituloModal" :bloqueado="enviando"
      @cerrar="confirmacion = null">
      <!-- Resumen de lo que se va a subir -->
      <template v-if="confirmacion.tipo === 'subir'">
        <p class="text-sm text-gris mb-3">
          Estás por subir el apunte
          <strong class="text-azuloscuro">{{ titulo }}</strong>.
        </p>
        <ul class="space-y-1 text-sm">
          <li>
            <span class="text-gris mr-1">Materia:</span>
            <span class="font-semibold text-azuloscuro">{{ materiaSeleccionada }}</span>
          </li>
          <li>
            <span class="text-gris mr-1">Archivo:</span>
            <span class="font-semibold text-azuloscuro">{{ archivo?.name }}</span>
          </li>
          <li v-if="descripcion.trim()">
            <span class="text-gris mr-1">Descripción:</span>
            <span class="font-semibold text-azuloscuro">{{ descripcion.trim() }}</span>
          </li>
        </ul>
      </template>

      <!-- Aviso de lo que se va a eliminar -->
      <template v-else>
        <p class="text-sm text-gris mb-3">
          Eliminarás el apunte
          <strong class="text-azuloscuro">{{ confirmacion.apunte.nombre }}</strong>
          ({{ nombreMateria(confirmacion.apunte.idMateria) }}).
        </p>
        <p class="text-sm text-gris">Esta acción no se puede deshacer.</p>
      </template>

      <p v-if="errorModal" role="alert"
        class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {{ errorModal }}
      </p>

      <template #acciones>
        <button type="button" :disabled="enviando" @click="confirmacion = null"
          class="rounded-lg border border-gris/50 px-4 py-2 text-sm hover:bg-celeste disabled:opacity-50">
          Cancelar
        </button>
        <button type="button" :disabled="enviando" @click="confirmarAccion"
          class="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          :class="estiloConfirmar">
          {{ textoConfirmar }}
        </button>
      </template>
    </ModalBase>
  </section>
</template>
