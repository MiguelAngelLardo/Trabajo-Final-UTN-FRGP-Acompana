<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  listarCarreras, crearCarrera, renombrarCarrera,
  bajaCarrera, reactivarCarrera, eliminarCarrera
} from '../../services/catalogo'
import { useToastStore } from '../../stores/toast'
import BadgeEstado from '../ui/BadgeEstado.vue'
import FormNombreModal from './FormNombreModal.vue'
import ConfirmarAccionModal from './ConfirmarAccionModal.vue'

const toast = useToastStore()

const carreras = ref([])
const cargando = ref(true)
const errorCarga = ref('')

// null | { tipo: 'form', item } | { tipo: 'confirmar', accion, item }
// (item = null en el form significa alta)
const modal = ref(null)

const filtroNombre = ref('')
const filtroEstado = ref('')

const carrerasFiltradas = computed(() => {
  const q = filtroNombre.value.trim().toLowerCase()
  return carreras.value.filter(c => {
    const coincideNombre = !q || c.nombre.toLowerCase().includes(q)
    const coincideEstado = filtroEstado.value === '' ||
      (!!c.estado) === (filtroEstado.value === 'true')
    return coincideNombre && coincideEstado
  })
})

const POR_PAGINA = 10
const pagina = ref(1)

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(carrerasFiltradas.value.length / POR_PAGINA))
)

const carrerasPagina = computed(() =>
  carrerasFiltradas.value.slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA)
)

watch([filtroNombre, filtroEstado], () => { pagina.value = 1 })

watch(totalPaginas, (total) => {
  if (pagina.value > total) pagina.value = total
})

function limpiarFiltros() {
  filtroNombre.value = ''
  filtroEstado.value = ''
}

const accionesApi = {
  baja: bajaCarrera,
  reactivar: reactivarCarrera,
  eliminar: eliminarCarrera
}

async function cargar() {
  errorCarga.value = ''
  try {
    carreras.value = await listarCarreras({ estado: 'todos' })
  } catch (err) {
    errorCarga.value = err.message
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

const cerrarModal = () => { modal.value = null }
const abrirForm = (item = null) => { modal.value = { tipo: 'form', item } }
const abrirConfirmar = (accion, item) => { modal.value = { tipo: 'confirmar', accion, item } }

defineExpose({ abrirForm })

async function alGuardar(data) {
  const fueAlta = !modal.value.item
  toast.exito(fueAlta
    ? `Se creó la carrera "${data.nombre}"`
    : `Se actualizó la carrera "${data.nombre}"`)
  cerrarModal()
  await cargar()
}

async function alHecho({ accion, data }) {
  if (accion === 'baja') {
    toast.exito(`Se dio de baja "${data.carrera.nombre}" y ${data.materiasDadasDeBaja} materia(s)`)
  } else if (accion === 'reactivar') {
    toast.exito(`Se reactivó "${data.carrera.nombre}" y ${data.materiasReactivadas} de sus ${data.totalMaterias} materia(s)`)
  } else if (accion === 'eliminar') {
    toast.exito(`Se eliminó la carrera "${data.nombre}" del catálogo`)
  } else if (accion === 'baja-en-su-lugar') {
    // Punto 5: no se pudo eliminar, pero quedó inactiva
    toast.aviso(`"${data.carrera.nombre}" tiene datos asociados y no se podía eliminar: se marcó como inactiva (y ${data.materiasDadasDeBaja} materia(s))`)
  }
  cerrarModal()
  await cargar()
}
</script>

<template>
  <div>
    <!-- Filtros -->
    <div class="bg-white rounded-xl shadow p-5 mb-4">
      <div class="flex flex-wrap items-end gap-3">
        <div class="space-y-1 w-52">
          <label for="filtro-nombre-carrera" class="block text-sm font-semibold text-azuloscuro">
            Buscar por nombre
          </label>
          <input id="filtro-nombre-carrera" v-model="filtroNombre" type="text"
            placeholder="Nombre de la carrera"
            class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
        </div>
        <div class="space-y-1 w-40">
          <label for="filtro-estado-carrera" class="block text-sm font-semibold text-azuloscuro">Estado</label>
          <select id="filtro-estado-carrera" v-model="filtroEstado"
            class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa">
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Dados de baja</option>
          </select>
        </div>
        <button type="button" @click="limpiarFiltros"
          class="border border-gris text-gris font-semibold rounded-lg px-4 py-2 hover:bg-gray-100">
          Limpiar
        </button>
      </div>
    </div>

    <p v-if="cargando" class="py-8 text-center text-gris">Cargando carreras…</p>

    <div v-else-if="errorCarga" role="alert"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{{ errorCarga }}</p>
      <button type="button" class="mt-2 underline" @click="cargar">Reintentar</button>
    </div>

    <p v-else-if="!carreras.length" class="py-8 text-center text-gris">
      Todavía no hay carreras cargadas.
    </p>

    <p v-else-if="!carrerasFiltradas.length" class="py-8 text-center text-gris">
      No se encontraron carreras.
    </p>

    <div v-else class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-azuloscuro text-white">
          <tr>
            <th class="px-4 py-3 text-left">ID</th>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-center">Estado</th>
            <th class="px-4 py-3 text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in carrerasPagina" :key="c.id"
            class="border-t border-gray-100 hover:bg-fondo">
            <td class="px-4 py-3">{{ c.id }}</td>
            <td class="px-4 py-3 font-medium">{{ c.nombre }}</td>
            <td class="px-4 py-3 text-center"><BadgeEstado :activo="c.estado" /></td>
            <td class="px-4 py-3">
              <div class="flex justify-center gap-4">
                <button type="button" class="text-sm font-semibold text-azulutn hover:underline"
                  @click="abrirForm(c)">Editar</button>
                <button v-if="c.estado" type="button"
                  class="text-sm font-semibold text-red-500 hover:underline"
                  @click="abrirConfirmar('baja', c)">Dar de baja</button>
                <button v-else type="button"
                  class="text-sm font-semibold text-green-600 hover:underline"
                  @click="abrirConfirmar('reactivar', c)">Reactivar</button>
                <button type="button" class="text-sm font-semibold text-orange-500 hover:underline"
                  @click="abrirConfirmar('eliminar', c)">Eliminar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPaginas > 1" class="mt-4 flex justify-center items-center gap-4">
      <button type="button" @click="pagina--" :disabled="pagina <= 1"
        class="text-sm font-semibold text-azulutn hover:underline disabled:text-gris disabled:no-underline">
        Anterior
      </button>
      <span class="text-sm text-gris">Página {{ pagina }} de {{ totalPaginas }}</span>
      <button type="button" @click="pagina++" :disabled="pagina >= totalPaginas"
        class="text-sm font-semibold text-azulutn hover:underline disabled:text-gris disabled:no-underline">
        Siguiente
      </button>
    </div>

    <p class="mt-3 text-xs text-gris">
      "Dar de baja" oculta la carrera y sus materias sin borrar nada.
      "Eliminar" solo funciona si no tiene materias, alumnos ni apuntes asociados.
    </p>

    <FormNombreModal v-if="modal?.tipo === 'form'"
      entidad="carrera"
      :es-edicion="!!modal.item"
      :nombre-inicial="modal.item?.nombre ?? ''"
      :guardar="({ nombre }) => modal.item
        ? renombrarCarrera(modal.item.id, nombre)
        : crearCarrera(nombre)"
      @guardado="alGuardar"
      @cerrar="cerrarModal" />

    <ConfirmarAccionModal v-if="modal?.tipo === 'confirmar'"
      entidad="carrera"
      :accion="modal.accion"
      :nombre="modal.item.nombre"
      :ejecutar="() => accionesApi[modal.accion](modal.item.id)"
      :ejecutar-baja="modal.accion === 'eliminar' && modal.item.estado
        ? () => bajaCarrera(modal.item.id)
        : null"
      @hecho="alHecho"
      @conflicto="cargar"
      @cerrar="cerrarModal" />
  </div>
</template>