<script setup>
import { ref, onMounted } from 'vue'
import RegistrarMateriasModal from './RegistrarMateriasModal.vue'
import { obtenerMisCarreras, obtenerMateriasAprobadas } from '../../services/catalogo'
import { mensajeDeError } from '../../utils/errores'

const carreras = ref([])
const cargando = ref(true)
const error = ref('')
const mostrarModal = ref(false)

async function cargarDatos() {
  error.value = ''
  try {
    const misCarreras = await obtenerMisCarreras()
    carreras.value = await Promise.all(
      misCarreras.map(async c => ({
        ...c,
        materias: await obtenerMateriasAprobadas(c.idCarrera)
      }))
    )
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargando.value = false
  }
}

onMounted(cargarDatos)
</script>

<template>
  <div class="bg-white rounded-xl shadow p-5 space-y-4">
    <div class="flex justify-between items-center">
      <h3 class="text-sm font-semibold text-gris uppercase">Materias aprobadas</h3>
      <button type="button" @click="mostrarModal = true"
        class="text-sm text-turquesa font-semibold hover:underline">
        Registrar materias aprobadas
      </button>
    </div>

    <p v-if="cargando" class="text-gris text-sm">Cargando datos académicos…</p>
    <p v-else-if="error" class="text-red-600 text-sm">{{ error }}</p>
    <p v-else-if="carreras.length === 0" class="text-gris text-sm">No estás inscripto en ninguna carrera.</p>

    <div v-else class="space-y-5">
      <div v-for="c in carreras" :key="c.idCarrera" class="space-y-2 text-sm">
        <div class="flex items-center justify-between gap-2">
          <p class="font-semibold text-azuloscuro">{{ c.nombre }}</p>
          <span class="shrink-0 rounded-full bg-azulutn/10 px-2.5 py-0.5 text-xs font-medium text-azulutn">
            {{ c.materias.length }} {{ c.materias.length === 1 ? 'aprobada' : 'aprobadas' }}
          </span>
        </div>
        <ul v-if="c.materias.length" class="flex flex-wrap gap-2">
          <li v-for="m in c.materias" :key="m.idMateria"
            class="inline-flex items-center gap-1.5 rounded-full bg-celeste px-3 py-1 text-azuloscuro">
            <svg class="h-3.5 w-3.5 shrink-0 text-turquesa" fill="none" stroke="currentColor"
              stroke-width="3" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {{ m.nombre }}
          </li>
        </ul>
        <p v-else class="text-gris">Sin materias aprobadas</p>
      </div>
    </div>

    <RegistrarMateriasModal v-if="mostrarModal" :carreras="carreras"
      @cerrar="mostrarModal = false" @registrada="cargarDatos" />
  </div>
</template>
