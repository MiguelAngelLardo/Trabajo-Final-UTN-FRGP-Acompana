<script setup>
import { ref, computed, watch } from 'vue'
import SelectorDesplegable from '../ui/SelectorDesplegable.vue'
import BotonDictado from '../ui/BotonDictado.vue'
import { obtenerMateriasAprobadas } from '../../services/catalogo'
import { postularmeComoTutor } from '../../services/tutorias'
import { mensajeDeError } from '../../utils/errores'

const props = defineProps({
  carreras: { type: Array, required: true }
})

const idCarrera = ref(props.carreras[0]?.idCarrera ?? '')
const materias = ref([])
const seleccionadas = ref([])
const descripcion = ref('')

const cargando = ref(false)
const enviando = ref(false)
const error = ref('')
const exito = ref('')

const opcionesCarrera = computed(() =>
  props.carreras.map(c => ({ valor: c.idCarrera, texto: c.nombre }))
)

const disponibles = computed(() => materias.value.filter(m => !m.esTutor))
const yaTutor = computed(() => materias.value.filter(m => m.esTutor))

async function cargarMaterias() {
  if (!idCarrera.value) return
  cargando.value = true
  try {
    materias.value = await obtenerMateriasAprobadas(idCarrera.value)
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargando.value = false
  }
}

watch(idCarrera, () => {
  seleccionadas.value = []
  error.value = ''
  exito.value = ''
  cargarMaterias()
}, { immediate: true })

function agregarDictado(texto) {
  descripcion.value = `${descripcion.value} ${texto}`.trim().slice(0, 200)
}

async function enviar() {
  error.value = ''
  exito.value = ''
  enviando.value = true
  try {
    const resultado = await postularmeComoTutor(seleccionadas.value, descripcion.value)
    exito.value = `Postulación registrada. Ya figurás como tutor de: ${resultado.materias.map(m => m.nombre).join(', ')}.`
    seleccionadas.value = []
    descripcion.value = ''
    await cargarMaterias()
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-1 max-w-md">
      <span class="text-sm text-gris">Carrera</span>
      <SelectorDesplegable v-model="idCarrera" :opciones="opcionesCarrera" />
    </div>

    <p v-if="cargando" class="text-gris">Cargando tus materias aprobadas…</p>

    <p v-else-if="materias.length === 0" class="text-gris">
      No tenés materias aprobadas en esta carrera. Primero cargalas en Mi perfil.
    </p>

    <form v-else @submit.prevent="enviar" class="bg-white rounded-xl p-4 space-y-4">
      <div v-if="disponibles.length" class="space-y-2">
        <p class="font-medium">Elegí las materias que querés enseñar</p>
        <label v-for="m in disponibles" :key="m.idMateria" class="flex items-center gap-2">
          <input type="checkbox" :value="m.idMateria" v-model="seleccionadas" class="h-4 w-4 accent-azulutn" />
          <span>{{ m.nombre }}</span>
        </label>
      </div>
      <p v-else class="text-gris">Ya sos tutor de todas tus materias aprobadas.</p>

      <div v-if="yaTutor.length" class="text-sm text-gris">
        Ya sos tutor de: {{ yaTutor.map(m => m.nombre).join(', ') }}
      </div>

      <template v-if="disponibles.length">
        <div class="space-y-1">
          <div class="flex items-center justify-between gap-2">
            <label for="descripcion-postulacion" class="font-medium">Descripción de tu propuesta o disponibilidad</label>
            <BotonDictado @dictado="agregarDictado" />
          </div>
          <textarea id="descripcion-postulacion" data-dictado="propio" v-model="descripcion" maxlength="200" rows="3" required
            placeholder="Ej: Disponible martes y jueves a la tarde, puedo ayudar con práctica y teoría"
            class="w-full border border-gris/50 rounded-lg px-3 py-2"></textarea>
          <span class="text-xs text-gris">{{ descripcion.length }}/200</span>
        </div>

        <button type="submit" :disabled="enviando || seleccionadas.length === 0 || !descripcion.trim()"
          class="bg-azulutn text-white rounded-lg px-5 py-2 disabled:opacity-60">
          {{ enviando ? 'Enviando…' : 'Postularme' }}
        </button>
      </template>

      <p v-if="error" class="text-red-600">{{ error }}</p>
      <p v-if="exito" class="text-azulutn">{{ exito }}</p>
    </form>
  </section>
</template>
