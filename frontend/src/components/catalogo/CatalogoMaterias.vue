<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  listarMaterias, obtenerCarrerasActivas, crearMateria, renombrarMateria,
  bajaMateria, reactivarMateria, eliminarMateria
} from '../../services/catalogo'
import { useToastStore } from '../../stores/toast'
import BadgeEstado from '../ui/BadgeEstado.vue'
import FormNombreModal from './FormNombreModal.vue'
import ConfirmarAccionModal from './ConfirmarAccionModal.vue'
import SelectorDesplegable from '../ui/SelectorDesplegable.vue'

const toast = useToastStore()

const materias = ref([])
const carreras = ref([])
const cargando = ref(true)
const errorCarga = ref('')
const modal = ref(null)
const idCarrera = ref('')
const filtroNombre = ref('')
const filtroEstado = ref('')

const materiasFiltradas = computed(() => {
  const q = filtroNombre.value.trim().toLowerCase()
  return materias.value.filter(m => {
    const coincideCarrera = idCarrera.value === '' || idCarrera.value == null ||
      Number(m.idCarrera) === Number(idCarrera.value)
    const coincideNombre = !q || m.nombre.toLowerCase().includes(q)
    const coincideEstado = filtroEstado.value === '' ||
      (!!m.estado) === (filtroEstado.value === 'true')
    return coincideCarrera && coincideNombre && coincideEstado
  })
})

const POR_PAGINA = 10
const pagina = ref(1)

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(materiasFiltradas.value.length / POR_PAGINA))
)

const materiasPagina = computed(() =>
  materiasFiltradas.value.slice((pagina.value - 1) * POR_PAGINA, pagina.value * POR_PAGINA)
)

watch([idCarrera, filtroNombre, filtroEstado], () => { pagina.value = 1 })

watch(totalPaginas, (total) => {
  if (pagina.value > total) pagina.value = total
})

function limpiarFiltros() {
  idCarrera.value = ''
  filtroNombre.value = ''
  filtroEstado.value = ''
}

const accionesApi = {
  baja: bajaMateria,
  reactivar: reactivarMateria,
  eliminar: eliminarMateria
}

async function cargar() {
  errorCarga.value = ''
  try {
    const [listaMaterias, carrerasActivas] = await Promise.all([
      listarMaterias({ estado: 'todos' }),
      obtenerCarrerasActivas()
    ])
    materias.value = listaMaterias
    carreras.value = carrerasActivas.map(carrera => ({
      valor: carrera.id,
      texto: carrera.nombre
    }))
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
    ? `Se creó la materia "${data.nombre}"`
    : `Se actualizó la materia "${data.nombre}"`)
  cerrarModal()
  await cargar()
}

async function alHecho({ accion, data }) {
  if (accion === 'baja') {
    toast.exito(`Se dio de baja la materia "${data.nombre}"`)
  } else if (accion === 'reactivar') {
    toast.exito(`Se reactivó la materia "${data.nombre}"`)
  } else if (accion === 'eliminar') {
    toast.exito(`Se eliminó la materia "${data.nombre}" del catálogo`)
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
          <label class="block text-sm font-semibold text-azuloscuro">Carrera</label>
          <SelectorDesplegable v-model="idCarrera" :opciones="carreras"
            placeholder="Todas las carreras" />
        </div>
        <div class="space-y-1 w-52">
          <label for="filtro-nombre-materia" class="block text-sm font-semibold text-azuloscuro">
            Buscar por nombre
          </label>
          <input id="filtro-nombre-materia" v-model="filtroNombre" type="text"
            placeholder="Nombre de la materia"
            class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
        </div>
        <div class="space-y-1 w-40">
          <label for="filtro-estado-materia" class="block text-sm font-semibold text-azuloscuro">Estado</label>
          <select id="filtro-estado-materia" v-model="filtroEstado"
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

    <p v-if="cargando" class="py-8 text-center text-gris">Cargando materias…</p>

    <div v-else-if="errorCarga" role="alert"
      class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{{ errorCarga }}</p>
      <button type="button" class="mt-2 underline" @click="cargar">Reintentar</button>
    </div>

    <p v-else-if="!materias.length" class="py-8 text-center text-gris">
      Todavía no hay materias cargadas.
    </p>

    <p v-else-if="!materiasFiltradas.length" class="py-8 text-center text-gris">
      No se encontraron materias.
    </p>

    <div v-else class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-azuloscuro text-white">
          <tr>
            <th class="px-4 py-3 text-left">ID</th>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-left">Carrera</th>
            <th class="px-4 py-3 text-center">Estado</th>
            <th class="px-4 py-3 text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="materia in materiasPagina" :key="materia.id"
            class="border-t border-gray-100 hover:bg-fondo">
            <td class="px-4 py-3">{{ materia.id }}</td>
            <td class="px-4 py-3 font-medium">{{ materia.nombre }}</td>
            <td class="px-4 py-3">{{ materia.carrera?.nombre ?? 'Sin carrera' }}</td>
            <td class="px-4 py-3 text-center"><BadgeEstado :activo="materia.estado" /></td>
            <td class="px-4 py-3">
              <div class="flex justify-center gap-4">
                <button type="button" class="text-sm font-semibold text-azulutn hover:underline"
                  @click="abrirForm(materia)">Editar</button>
                <button v-if="materia.estado" type="button"
                  class="text-sm font-semibold text-red-500 hover:underline"
                  @click="abrirConfirmar('baja', materia)">Dar de baja</button>
                <button v-else type="button"
                  class="text-sm font-semibold text-green-600 hover:underline"
                  @click="abrirConfirmar('reactivar', materia)">Reactivar</button>
                <button type="button" class="text-sm font-semibold text-orange-500 hover:underline"
                  @click="abrirConfirmar('eliminar', materia)">Eliminar</button>
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

    <FormNombreModal v-if="modal?.tipo === 'form'"
      entidad="materia"
      :es-edicion="!!modal.item"
      :nombre-inicial="modal.item?.nombre ?? ''"
      :carreras="carreras"
      :id-carrera-inicial="modal.item?.idCarrera ?? ''"
      :carrera-nombre="modal.item?.carrera?.nombre ?? ''"
      :guardar="({ nombre, idCarrera }) => modal.item
        ? renombrarMateria(modal.item.id, nombre)
        : crearMateria({ nombre, idCarrera })"
      @guardado="alGuardar"
      @cerrar="cerrarModal" />

    <ConfirmarAccionModal v-if="modal?.tipo === 'confirmar'"
      entidad="materia"
      :accion="modal.accion"
      :nombre="modal.item.nombre"
      :ejecutar="() => accionesApi[modal.accion](modal.item.id)"
      @hecho="alHecho"
      @conflicto="cargar"
      @cerrar="cerrarModal" />
  </div>
</template>