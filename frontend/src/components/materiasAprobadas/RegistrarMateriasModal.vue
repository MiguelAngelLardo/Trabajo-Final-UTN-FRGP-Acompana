<script setup>
import { ref, computed, watch } from 'vue'
import ModalBase from '../ui/ModalBase.vue'
import SelectorDesplegable from '../ui/SelectorDesplegable.vue'
import { listarMateriasDisponibles, registrarMateriaAprobada } from '../../services/materiaAprobada'
import { mensajeDeError } from '../../utils/errores'

const props = defineProps({
  carreras: { type: Array, required: true }
})

const emit = defineEmits(['cerrar', 'registrada'])

const idCarrera = ref(props.carreras.length === 1 ? props.carreras[0].idCarrera : '')
const idMateria = ref('')
const materias = ref([])

const cargando = ref(false)
const enviando = ref(false)
const error = ref('')
const exito = ref('')

const variasCarreras = computed(() => props.carreras.length > 1)

const opcionesCarrera = computed(() =>
  props.carreras.map(c => ({ valor: c.idCarrera, texto: c.nombre }))
)

const opcionesMateria = computed(() =>
  materias.value.map(m => ({ valor: m.idMateria, texto: m.nombre }))
)

const selectorMateriaHabilitado = computed(() =>
  !!idCarrera.value && !cargando.value && materias.value.length > 0
)

async function cargarMaterias() {
  materias.value = []
  idMateria.value = ''
  if (!idCarrera.value) return
  cargando.value = true
  try {
    const data = await listarMateriasDisponibles(idCarrera.value)
    materias.value = data.materias
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargando.value = false
  }
}

watch(idCarrera, () => {
  error.value = ''
  exito.value = ''
  cargarMaterias()
}, { immediate: true })

async function registrar() {
  if (!idMateria.value || enviando.value) return
  error.value = ''
  exito.value = ''
  enviando.value = true
  try {
    const resultado = await registrarMateriaAprobada(idMateria.value)
    exito.value = resultado.mensajes.alta
    emit('registrada')
    await cargarMaterias()
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <ModalBase titulo="Registrar materias aprobadas" :bloqueado="enviando" @cerrar="emit('cerrar')">
    <div class="space-y-4">
      <div v-if="variasCarreras" class="space-y-1">
        <span class="block text-sm font-medium">Carrera</span>
        <SelectorDesplegable v-model="idCarrera" :opciones="opcionesCarrera"
          placeholder="Elegí una carrera" />
      </div>
      <p v-else-if="carreras.length === 1" class="text-sm text-gris">
        Carrera: <span class="font-semibold text-azuloscuro">{{ carreras[0].nombre }}</span>
      </p>
      <p v-else class="text-sm text-gris">No estás inscripto en ninguna carrera.</p>

      <div v-if="carreras.length" class="space-y-1">
        <span class="block text-sm font-medium">Materia</span>
        <div :inert="!selectorMateriaHabilitado" :class="{ 'opacity-50': !selectorMateriaHabilitado }">
          <SelectorDesplegable v-model="idMateria" :opciones="opcionesMateria"
            :placeholder="cargando ? 'Cargando materias…' : 'Elegí una materia'" />
        </div>
        <p v-if="idCarrera && !cargando && materias.length === 0 && !error" class="text-xs text-gris">
          No hay materias disponibles para registrar en esta carrera.
        </p>
      </div>

      <p v-if="error" role="alert"
        class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
        {{ error }}
      </p>
      <p v-if="exito" class="text-green-700 text-sm">{{ exito }}</p>
    </div>

    <template #acciones>
      <button type="button" :disabled="enviando" @click="emit('cerrar')"
        class="rounded-lg border border-gris/50 px-4 py-2 text-sm hover:bg-celeste disabled:opacity-50">
        Cerrar
      </button>
      <button type="button" :disabled="enviando || !idMateria" @click="registrar"
        class="rounded-lg bg-azulutn px-4 py-2 text-sm font-medium text-white hover:bg-azulutn/90 disabled:opacity-60">
        {{ enviando ? 'Registrando…' : 'Registrar' }}
      </button>
    </template>
  </ModalBase>
</template>
