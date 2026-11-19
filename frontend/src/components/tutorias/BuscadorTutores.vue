<script setup>
import { ref, computed, watch } from 'vue'
import SelectorDesplegable from '../ui/SelectorDesplegable.vue'
import ModalBase from '../ui/ModalBase.vue'
import BotonLeerEnVozAlta from '../ui/BotonLeerEnVozAlta.vue'
import BotonDictado from '../ui/BotonDictado.vue'
import { obtenerMateriasDeCarrera } from '../../services/catalogo'
import { buscarTutores, solicitarTutoria } from '../../services/tutorias'
import { mensajeDeError } from '../../utils/errores'

const props = defineProps({
  carreras: { type: Array, required: true }
})

const idCarrera = ref(props.carreras[0]?.idCarrera ?? '')
const idMateria = ref('')
const materias = ref([])

const opcionesCarrera = computed(() =>
  props.carreras.map(c => ({ valor: c.idCarrera, texto: c.nombre }))
)
const opcionesMateria = computed(() => [
  { valor: '', texto: 'Todas las materias' },
  ...materias.value.map(m => ({ valor: m.id, texto: m.nombre }))
])

const tutores = ref([])
const buscado = ref(false)
const cargando = ref(false)
const error = ref('')

const solicitudes = ref({})

watch(idCarrera, async (id) => {
  idMateria.value = ''
  materias.value = []
  if (!id) return
  try {
    materias.value = await obtenerMateriasDeCarrera(id)
  } catch (err) {
    error.value = mensajeDeError(err)
  }
}, { immediate: true })

async function buscar() {
  error.value = ''
  cargando.value = true
  try {
    tutores.value = await buscarTutores({ carrera: idCarrera.value, materia: idMateria.value })
    solicitudes.value = {}
    buscado.value = true
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargando.value = false
  }
}

function clave(tutor) {
  return `${tutor.dni}-${tutor.idMateria}`
}

function textoDe(tutor) {
  return [
    `${tutor.nombre} ${tutor.apellido}, tutor de ${tutor.materia}.`,
    tutor.descripcionTutoria,
    tutor.bio
  ].filter(Boolean).join(' ')
}

const mediosContacto = [
  { valor: '', texto: 'Sin preferencia' },
  { valor: 'Mail', texto: 'Mail' },
  { valor: 'WhatsApp', texto: 'WhatsApp' },
  { valor: 'Llamada', texto: 'Llamada' }
]
const sugerenciasApoyo = ['Intérprete de LSA', 'Material por escrito', 'Encuentro virtual con subtítulos']

const tutorElegido = ref(null)
const medioContacto = ref('')
const apoyo = ref('')

function abrirSolicitud(tutor) {
  tutorElegido.value = tutor
  medioContacto.value = ''
  apoyo.value = ''
}

function cerrarSolicitud() {
  tutorElegido.value = null
}

function agregarApoyo(texto) {
  if (apoyo.value.toLowerCase().includes(texto.toLowerCase())) return
  apoyo.value = (apoyo.value.trim() ? `${apoyo.value.trim()}, ${texto}` : texto).slice(0, 200)
}

async function solicitar() {
  const tutor = tutorElegido.value
  const extras = {
    medioContacto: medioContacto.value || undefined,
    apoyo: apoyo.value.trim() || undefined
  }
  tutorElegido.value = null
  const k = clave(tutor)
  solicitudes.value[k] = { enviando: true }
  try {
    await solicitarTutoria(tutor.dni, tutor.idMateria, extras)
    solicitudes.value[k] = { ok: true, mensaje: 'Solicitud enviada. El tutor se va a contactar con vos.' }
  } catch (err) {
    solicitudes.value[k] = { ok: false, mensaje: mensajeDeError(err) }
  }
}
</script>

<template>
  <section class="space-y-6">
    <form @submit.prevent="buscar" class="bg-white rounded-xl p-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div class="space-y-1">
        <span class="text-sm text-gris">Carrera</span>
        <SelectorDesplegable v-model="idCarrera" :opciones="opcionesCarrera" />
      </div>

      <div class="space-y-1">
        <span class="text-sm text-gris">Materia</span>
        <SelectorDesplegable v-model="idMateria" :opciones="opcionesMateria" />
      </div>

      <button type="submit" :disabled="cargando || !idCarrera"
        class="bg-azulutn text-white rounded-lg px-5 py-2 disabled:opacity-60">
        {{ cargando ? 'Buscando…' : 'Buscar' }}
      </button>
    </form>

    <p v-if="error" class="text-red-600">{{ error }}</p>

    <p v-else-if="buscado && tutores.length === 0" class="text-gris">
      No se encontraron tutores disponibles para esa búsqueda.
    </p>

    <ul v-else class="grid gap-4 md:grid-cols-2">
      <li v-for="tutor in tutores" :key="clave(tutor)" class="bg-white rounded-xl p-4 space-y-3">
        <div class="flex items-center gap-3">
          <img v-if="tutor.fotoPerfil" :src="tutor.fotoPerfil" :alt="tutor.nombre"
            class="h-12 w-12 rounded-full object-cover" />
          <div v-else class="h-12 w-12 rounded-full bg-celeste flex items-center justify-center font-semibold">
            {{ tutor.nombre[0] }}{{ tutor.apellido[0] }}
          </div>
          <div class="flex-1">
            <p class="font-semibold">{{ tutor.nombre }} {{ tutor.apellido }}</p>
            <p class="text-sm text-gris">{{ tutor.materia }}</p>
          </div>
          <BotonLeerEnVozAlta :texto="textoDe(tutor)" etiqueta="Leer la descripción del tutor en voz alta" />
        </div>

        <p v-if="tutor.descripcionTutoria">{{ tutor.descripcionTutoria }}</p>
        <p v-if="tutor.bio" class="text-sm text-gris">{{ tutor.bio }}</p>

        <div>
          <button v-if="!solicitudes[clave(tutor)]?.ok" @click="abrirSolicitud(tutor)"
            :disabled="solicitudes[clave(tutor)]?.enviando"
            class="bg-azulutn text-white rounded-lg px-4 py-2 text-sm disabled:opacity-60">
            {{ solicitudes[clave(tutor)]?.enviando ? 'Enviando…' : 'Solicitar tutoría' }}
          </button>
          <p v-if="solicitudes[clave(tutor)]?.mensaje" class="text-sm mt-2"
            :class="solicitudes[clave(tutor)].ok ? 'text-azulutn' : 'text-red-600'">
            {{ solicitudes[clave(tutor)].mensaje }}
          </p>
        </div>
      </li>
    </ul>

    <ModalBase v-if="tutorElegido" titulo="Solicitar tutoría" @cerrar="cerrarSolicitud">
      <div class="space-y-5">
        <p class="text-sm">
          Vas a pedirle tutoría a <span class="font-semibold">{{ tutorElegido.nombre }} {{ tutorElegido.apellido }}</span>
          en <span class="font-semibold">{{ tutorElegido.materia }}</span>.
        </p>

        <fieldset class="space-y-2">
          <legend class="text-sm font-semibold">¿Cómo preferís que te contacten?</legend>
          <div class="flex flex-wrap gap-2">
            <label v-for="m in mediosContacto" :key="m.valor" class="cursor-pointer">
              <input type="radio" name="medio-contacto" :value="m.valor" v-model="medioContacto" class="sr-only peer" />
              <span class="inline-block rounded-full border px-3 py-1.5 text-sm transition-colors border-gris/40 hover:border-azulutn peer-checked:bg-azulutn peer-checked:text-white peer-checked:border-azulutn peer-focus-visible:ring-2 peer-focus-visible:ring-turquesa">
                {{ m.texto }}
              </span>
            </label>
          </div>
        </fieldset>

        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <label for="apoyo-solicitud" class="text-sm font-semibold">¿Necesitás algún apoyo? (opcional)</label>
            <BotonDictado @dictado="agregarApoyo" />
          </div>
          <textarea id="apoyo-solicitud" data-dictado="propio" v-model="apoyo" maxlength="200" rows="2"
            placeholder="Ej: intérprete de LSA, material por escrito, encuentro virtual con subtítulos"
            class="w-full border border-gris/50 rounded-lg px-3 py-2 text-sm"></textarea>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs text-gris">Sugerencias:</span>
            <button v-for="s in sugerenciasApoyo" :key="s" type="button" @click="agregarApoyo(s)"
              class="rounded-full bg-celeste px-3 py-1 text-xs hover:bg-azulutn hover:text-white transition-colors">
              {{ s }}
            </button>
          </div>
          <p class="text-xs text-gris">{{ apoyo.length }}/200. Se suma al mensaje que recibe el tutor.</p>
        </div>
      </div>

      <template #acciones>
        <button type="button" @click="solicitar"
          class="bg-azulutn text-white rounded-lg px-4 py-2 text-sm font-semibold">
          Enviar solicitud
        </button>
        <button type="button" @click="cerrarSolicitud"
          class="border border-gris/40 rounded-lg px-4 py-2 text-sm">
          Cancelar
        </button>
      </template>
    </ModalBase>
  </section>
</template>
