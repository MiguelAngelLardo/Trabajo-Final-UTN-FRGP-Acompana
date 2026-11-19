<script setup>
import { ref, computed } from 'vue'
import ModalBase from '../ui/ModalBase.vue'
import SelectorDesplegable from '../ui/SelectorDesplegable.vue'

const props = defineProps({
  entidad: { type: String, required: true }, // 'carrera' | 'materia'
  esEdicion: { type: Boolean, default: false },
  nombreInicial: { type: String, default: '' },
  // Solo materias: opciones [{ valor, texto }] de carreras activas (alta)
  carreras: { type: Array, default: () => [] },
  idCarreraInicial: { type: [Number, String], default: '' },
  // Solo materias en edición: la carrera se muestra de solo lectura
  carreraNombre: { type: String, default: '' },
  // async ({ nombre, idCarrera }) => data. Si falla, el error se muestra acá
  guardar: { type: Function, required: true }
})

const emit = defineEmits(['cerrar', 'guardado'])

// Mismas reglas que el backend
const REGEX_NOMBRE = /^[\p{L}\p{N} ,.()&-]+$/u

const nombre = ref(props.nombreInicial)
const idCarrera = ref(props.idCarreraInicial)
const errores = ref([])
const enviando = ref(false)

const esMateria = computed(() => props.entidad === 'materia')
const titulo = computed(() =>
  `${props.esEdicion ? 'Editar' : 'Nueva'} ${props.entidad}`
)
const textoBoton = computed(() => (props.esEdicion ? 'Guardar' : 'Crear'))
const textoEnviando = computed(() => (props.esEdicion ? 'Guardando…' : 'Creando…'))

function validar() {
  const texto = nombre.value.trim()
  const lista = []
  if (!texto) lista.push('El nombre es obligatorio')
  else if (texto.length < 3 || texto.length > 100) {
    lista.push('El nombre debe tener entre 3 y 100 caracteres')
  } else if (!REGEX_NOMBRE.test(texto)) {
    lista.push('El nombre solo puede contener letras, números, espacios y los signos , . ( ) - &')
  }
  if (esMateria.value && !props.esEdicion && !idCarrera.value) {
    lista.push('Elegí la carrera a la que pertenece la materia')
  }
  return lista
}

async function enviar() {
  if (enviando.value) return
  errores.value = validar()
  if (errores.value.length) return

  enviando.value = true
  try {
    const data = await props.guardar({
      nombre: nombre.value.trim(),
      idCarrera: idCarrera.value
    })
    emit('guardado', data)
  } catch (err) {
    // 400 trae una lista en details; el resto (409, red, 500) solo message
    errores.value = err.status === 400 && err.details?.length
      ? err.details
      : [err.message]
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <ModalBase :titulo="titulo" :bloqueado="enviando" @cerrar="emit('cerrar')">
    <form id="form-nombre" class="space-y-4" novalidate @submit.prevent="enviar">
      <!-- Carrera (solo materias) -->
      <div v-if="esMateria">
        <label class="block text-sm font-medium mb-1">Carrera</label>
        <p v-if="esEdicion" class="rounded-lg bg-fondo px-3 py-2 text-sm">
          {{ carreraNombre }}
          <span class="block text-xs text-gris">
            La carrera de una materia no se puede cambiar.
          </span>
        </p>
        <SelectorDesplegable v-else v-model="idCarrera" :opciones="carreras"
          placeholder="Elegí una carrera" />
      </div>

      <div>
        <label for="nombre-catalogo" class="block text-sm font-medium mb-1">Nombre</label>
        <input id="nombre-catalogo" v-model="nombre" type="text" maxlength="100"
          autocomplete="off" autofocus
          class="w-full rounded-lg border border-gris/50 px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-azulutn" />
      </div>

      <ul v-if="errores.length" role="alert"
        class="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800 space-y-1">
        <li v-for="e in errores" :key="e">{{ e }}</li>
      </ul>
    </form>

    <template #acciones>
      <!-- form="..." porque este botón vive fuera del <form> (slot de ModalBase) -->
      <button type="submit" form="form-nombre" :disabled="enviando"
        class="rounded-lg bg-azulutn px-4 py-2 text-sm font-medium text-white hover:bg-azulutn/90 disabled:opacity-60">
        {{ enviando ? textoEnviando : textoBoton }}
      </button>
      <button type="button" :disabled="enviando" @click="emit('cerrar')"
        class="rounded-lg border border-gris/50 px-4 py-2 text-sm hover:bg-celeste disabled:opacity-50">
        Cerrar
      </button>
    </template>
  </ModalBase>
</template>