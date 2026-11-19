<script setup>
import { ref, onMounted, watch } from 'vue'
import { api } from '../../services/api'
import { abrirApunte } from '../../services/apuntes'
import { mensajeDeError } from '../../utils/errores'

const carreras = ref([])
const materias = ref([])
const apuntes = ref([])

const filtroCarrera = ref('')
const filtroMateria = ref('')
const filtroNombre = ref('')
const filtroEstado = ref('')

const pagina = ref(1)
const totalPaginas = ref(1)
const totalApuntes = ref(0)
const error = ref('')
const cargando = ref(false)
const cargandoEstado = ref(null)

async function cargarCarreras() {
  try {
    carreras.value = await api.get('/auth/carreras')
  } catch (err) {
    error.value = 'No se pudieron cargar las carreras'
  }
}

async function cargarMaterias() {
  if (!filtroCarrera.value) {
    materias.value = []
    filtroMateria.value = ''
    return
  }
  try {
    materias.value = await api.get(`/catalogo/materias?idCarrera=${filtroCarrera.value}`)
  } catch (err) {
    materias.value = []
  }
}

async function cargarApuntes(pag = 1) {
  error.value = ''
  cargando.value = true
  try {
    let params = `?pagina=${pag}&porPagina=10`
    if (filtroCarrera.value) params += `&carrera=${filtroCarrera.value}`
    if (filtroMateria.value) params += `&materia=${filtroMateria.value}`
    if (filtroNombre.value.trim()) params += `&nombre=${encodeURIComponent(filtroNombre.value.trim())}`
    if (filtroEstado.value !== '') params += `&estado=${filtroEstado.value}`

    const data = await api.get(`/moderacion${params}`)
    apuntes.value = data.apuntes
    pagina.value = data.paginacion.paginaActual
    totalPaginas.value = data.paginacion.totalPaginas
    totalApuntes.value = data.paginacion.totalApuntes
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargando.value = false
  }
}

async function toggleEstado(apunte) {
  cargandoEstado.value = apunte.idApunte
  try {
    await api.patch(`/moderacion/${apunte.idApunte}/estado`, { estado: !apunte.estado })
    apunte.estado = !apunte.estado
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargandoEstado.value = null
  }
}

async function descargar(apunte) {
  error.value = ''
  try {
    await abrirApunte(apunte.idApunte)
  } catch (err) {
    error.value = mensajeDeError(err)
  }
}

function filtrar() {
  cargarApuntes(1)
}

function limpiarFiltros() {
  filtroCarrera.value = ''
  filtroMateria.value = ''
  filtroNombre.value = ''
  filtroEstado.value = ''
  materias.value = []
  cargarApuntes(1)
}

watch(filtroCarrera, () => {
  filtroMateria.value = ''
  cargarMaterias()
})

onMounted(() => {
  cargarCarreras()
  cargarApuntes(1)
})
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4 space-y-6">
    <h1 class="text-2xl font-bold text-azuloscuro">Moderar apuntes</h1>

    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow p-5 space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-azuloscuro">Carrera</label>
          <select v-model="filtroCarrera"
            class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa">
            <option value="">Todas las carreras</option>
            <option v-for="c in carreras" :key="c.IdCarrera_Ca" :value="c.IdCarrera_Ca">
              {{ c.Nombre_Ca }}
            </option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-azuloscuro">Materia</label>
          <select v-model="filtroMateria" :disabled="!filtroCarrera"
            class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa disabled:opacity-50">
            <option value="">Todas las materias</option>
            <option v-for="m in materias" :key="m.id" :value="m.id"">
              {{ m.nombre }}
            </option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-azuloscuro">Buscar por título</label>
          <input v-model="filtroNombre" type="text" placeholder="Nombre del apunte"
            class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
        </div>
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-azuloscuro">Estado</label>
          <select v-model="filtroEstado"
            class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa">
            <option value="">Todos</option>
            <option value="true">Habilitado</option>
            <option value="false">Dado de baja</option>
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button @click="filtrar" :disabled="cargando"
            class="bg-azulutn text-white font-semibold rounded-lg px-6 py-2 hover:bg-azulutn/90 disabled:opacity-60">
            Filtrar
          </button>
          <button @click="limpiarFiltros"
            class="border border-gris text-gris font-semibold rounded-lg px-4 py-2 hover:bg-gray-100">
            Limpiar
          </button>
        </div>
      </div>
    </div>

    <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    <p v-if="cargando" class="text-gris text-sm">Cargando…</p>

    <p v-if="!cargando && apuntes.length" class="text-sm text-gris">
      {{ totalApuntes }} apunte{{ totalApuntes !== 1 ? 's' : '' }}
    </p>

    <!-- Tabla -->
    <div v-if="apuntes.length" class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-azuloscuro text-white">
          <tr>
            <th class="px-4 py-3 text-left">Título</th>
            <th class="px-4 py-3 text-left">Materia</th>
            <th class="px-4 py-3 text-left">Autor</th>
            <th class="px-4 py-3 text-center">Estado</th>
            <th class="px-4 py-3 text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ap in apuntes" :key="ap.idApunte" class="border-t border-gray-100 hover:bg-fondo">
            <td class="px-4 py-3">
              <div>{{ ap.nombre }}</div>
              <div v-if="ap.descripcion" class="text-xs text-gris">{{ ap.descripcion }}</div>
            </td>
            <td class="px-4 py-3">
              <div>{{ ap.materia }}</div>
              <div class="text-xs text-gris">{{ ap.carrera }}</div>
            </td>
            <td class="px-4 py-3">{{ ap.autor }}</td>
            <td class="px-4 py-3 text-center">
              <span :class="ap.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                class="px-3 py-1 rounded-full text-xs font-semibold">
                {{ ap.estado ? 'Habilitado' : 'Dado de baja' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <div class="flex justify-center items-center gap-3">
                <button @click="descargar(ap)"
                  class="font-semibold hover:underline text-sm text-turquesa">
                  Descargar
                </button>
                <button @click="toggleEstado(ap)" :disabled="cargandoEstado === ap.idApunte"
                  class="font-semibold hover:underline text-sm"
                  :class="ap.estado ? 'text-red-500' : 'text-green-600'">
                  {{ cargandoEstado === ap.idApunte ? '…' : (ap.estado ? 'Dar de baja' : 'Habilitar') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="!cargando && !apuntes.length && !error" class="text-gris text-sm">No se encontraron apuntes</p>

    <!-- Paginador -->
    <div v-if="totalPaginas > 1" class="flex justify-center items-center gap-4">
      <button @click="cargarApuntes(pagina - 1)" :disabled="pagina <= 1"
        class="text-sm font-semibold text-azulutn hover:underline disabled:text-gris disabled:no-underline">
        Anterior
      </button>
      <span class="text-sm text-gris">Página {{ pagina }} de {{ totalPaginas }}</span>
      <button @click="cargarApuntes(pagina + 1)" :disabled="pagina >= totalPaginas"
        class="text-sm font-semibold text-azulutn hover:underline disabled:text-gris disabled:no-underline">
        Siguiente
      </button>
    </div>
  </div>
</template>