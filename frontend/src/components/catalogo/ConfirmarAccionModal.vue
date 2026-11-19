<script setup>
import { ref, computed } from 'vue'
import ModalBase from '../ui/ModalBase.vue'

const props = defineProps({
  accion: { type: String, required: true }, // 'baja' | 'reactivar' | 'eliminar'
  entidad: { type: String, required: true }, // 'carrera' | 'materia'
  nombre: { type: String, required: true },
  ejecutar: { type: Function, required: true },
  // Solo para 'eliminar': alternativa si el backend responde 409
  ejecutarBaja: { type: Function, default: null }
})

const emit = defineEmits(['cerrar', 'hecho', 'conflicto'])

const enviando = ref(false)
const error = ref('')
const hayConflicto = ref(false)

const esCarrera = computed(() => props.entidad === 'carrera')

const titulo = computed(() => ({
  baja: `Dar de baja ${props.entidad}`,
  reactivar: `Reactivar ${props.entidad}`,
  eliminar: `Eliminar ${props.entidad}`
}[props.accion]))

const mensaje = computed(() => {
  if (props.accion === 'baja') {
    return esCarrera.value
      ? 'Se dará de baja la carrera y también todas sus materias activas.'
      : 'La materia dejará de verse en la plataforma.'
  }
  if (props.accion === 'reactivar') {
    return esCarrera.value
      ? 'Se reactivará la carrera y todas sus materias.'
      : 'La materia volverá a estar disponible en la plataforma.'
  }
  return 'Se eliminará definitivamente del catálogo. Solo es posible si no tiene datos asociados, y no se puede deshacer.'
})

const puedeOfrecerBaja = computed(() =>
  props.accion === 'eliminar' && hayConflicto.value && !!props.ejecutarBaja
)

const textoConfirmar = computed(() => ({
  baja: 'Dar de baja',
  reactivar: 'Reactivar',
  eliminar: 'Eliminar'
}[props.accion]))

const estiloConfirmar = computed(() =>
  props.accion === 'eliminar'
    ? 'bg-red-700 hover:bg-red-800'
    : 'bg-azulutn hover:bg-azulutn/90'
)

async function acciones(funcion, accionHecha) {
  if (enviando.value) return
  enviando.value = true
  error.value = ''
  try {
    const data = await funcion()
    emit('hecho', { accion: accionHecha, data })
  } catch (err) {
    error.value = err.message
    if (err.status === 409) {
      hayConflicto.value = true
      emit('conflicto')
    }
  } finally {
    enviando.value = false
  }
}

const confirmar = () => acciones(props.ejecutar, props.accion)
const bajaEnSuLugar = () => acciones(props.ejecutarBaja, 'baja-en-su-lugar')
</script>

<template>
  <ModalBase :titulo="titulo" :bloqueado="enviando" @cerrar="emit('cerrar')">
    <p class="text-sm mb-3">
      <strong>{{ nombre }}</strong>
    </p>
    <p v-if="!hayConflicto" class="text-sm text-gris">{{ mensaje }}</p>

    <p v-if="error" role="alert"
      class="mt-3 rounded-lg border px-3 py-2 text-sm"
      :class="puedeOfrecerBaja
        ? 'bg-amber-50 border-amber-300 text-amber-900'
        : 'bg-red-50 border-red-200 text-red-800'">
      {{ error }}
    </p>

    <template #acciones>
      <button type="button" :disabled="enviando" @click="emit('cerrar')"
        class="rounded-lg border border-gris/50 px-4 py-2 text-sm hover:bg-celeste disabled:opacity-50">
        {{ hayConflicto ? 'Cerrar' : 'Cancelar' }}
      </button>

      <button v-if="puedeOfrecerBaja" type="button" :disabled="enviando" @click="bajaEnSuLugar"
        class="rounded-lg bg-azulutn px-4 py-2 text-sm font-medium text-white hover:bg-azulutn/90 disabled:opacity-60">
        {{ enviando ? 'Procesando…' : 'Dar de baja en su lugar' }}
      </button>

      <!-- Con un 409 no tiene sentido reintentar la misma acción -->
      <button v-else-if="!hayConflicto" type="button" :disabled="enviando" @click="confirmar"
        class="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        :class="estiloConfirmar">
        {{ enviando ? 'Procesando…' : textoConfirmar }}
      </button>
    </template>
  </ModalBase>
</template>