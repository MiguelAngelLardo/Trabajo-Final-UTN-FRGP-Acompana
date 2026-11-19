<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import SelectorDesplegable from '../ui/SelectorDesplegable.vue'
import BotonDictado from '../ui/BotonDictado.vue'
import { buscarApuntes, abrirApunte } from '../../services/apuntes'
import { obtenerCarrerasActivas, obtenerMateriasDeCarrera } from '../../services/catalogo'
import { mensajeDeError } from '../../utils/errores'

// Cantidad de apuntes por página (por defecto del backend)
const LIMITE = 10

const opcionesCarrera = ref([])
const opcionesMateria = ref([])
const resultados = ref([])
const paginacion = ref({ pagina: 1, limite: LIMITE, total: 0, totalPaginas: 0 })

const idCarrera = ref('')
const idMateria = ref('')
const busqueda = ref('')
const cargando = ref(false)
const cargandoFiltros = ref(false)
const error = ref('')

async function cargarCarreras() {
  cargandoFiltros.value = true
  try {
    // El catálogo devuelve { id, nombre, estado }
    opcionesCarrera.value = (await obtenerCarrerasActivas()).map(c => ({
      valor: c.id,
      texto: c.nombre
    }))
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargandoFiltros.value = false
  }
}

async function cargarMaterias() {
  // Cambio de carrera: las materias anteriores ya no aplican
  idMateria.value = ''
  opcionesMateria.value = []
  if (!idCarrera.value) return
  try {
    // El catálogo devuelve { id, nombre, estado, idCarrera }
    opcionesMateria.value = (await obtenerMateriasDeCarrera(idCarrera.value)).map(m => ({
      valor: m.id,
      texto: m.nombre
    }))
  } catch (err) {
    error.value = mensajeDeError(err)
  }
}

async function buscar(pagina = 1) {
  // El handler del form llama a buscar() sin argumentos; Number() por
  // si el evento de submit llega igualmente (Number(evento) es NaN)
  const numeroPagina = Number(pagina) || 1
  cargando.value = true
  error.value = ''
  try {
    const data = await buscarApuntes({
      idCarrera: idCarrera.value || undefined,
      idMateria: idMateria.value || undefined,
      q: busqueda.value.trim() || undefined,
      page: numeroPagina,
      limit: LIMITE
    })
    resultados.value = data.resultados
    paginacion.value = data.paginacion
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargando.value = false
  }
}

// Muestra el botón "Limpiar filtros" solo si hay algún filtro aplicado
const hayFiltros = computed(() =>
  !!idCarrera.value || !!idMateria.value || !!busqueda.value.trim()
)

function limpiarFiltros() {
  idCarrera.value = ''
  idMateria.value = ''
  busqueda.value = ''
  // El watch de idCarrera ya resetea las opciones de materia
  buscar()
}

function paginaAnterior() {
  if (paginacion.value.pagina > 1) buscar(paginacion.value.pagina - 1)
}

function irAPagina(pagina) {
  if (pagina !== paginacion.value.pagina) buscar(pagina)
}

function paginaSiguiente() {
  if (paginacion.value.pagina < paginacion.value.totalPaginas) {
    buscar(paginacion.value.pagina + 1)
  }
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

// La materia depende de la carrera elegida
watch(idCarrera, () => {
  cargarMaterias()
})

onMounted(() => {
  cargarCarreras()
  // Muestra los apuntes más recientes de entrada
  buscar()
})
</script>

<template>
  <section class="space-y-6">
    <!-- Sección filtros - Búsqueda. El backend busca en el título
         del apunte con la palabra clave (q) -->
    <form @submit.prevent="buscar()" class="flex flex-wrap gap-3">
      <div class="flex-1 min-w-44">
        <SelectorDesplegable v-model="idCarrera" :opciones="opcionesCarrera"
          placeholder="Carrera" />
      </div>
      <div class="flex-1 min-w-44">
        <SelectorDesplegable v-model="idMateria" :opciones="opcionesMateria"
          placeholder="Materia" />
      </div>
      <div class="flex-1 min-w-44 flex items-start gap-1">
        <input v-model="busqueda" type="text" placeholder="Palabra clave" maxlength="50" aria-label="Palabra clave" data-dictado="propio"
          class="flex-1 min-w-0 border border-gris rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
        <BotonDictado @dictado="t => busqueda = t.slice(0, 50)" />
      </div>
      <button type="submit" :disabled="cargando"
        class="bg-azulutn text-white rounded-lg px-6 py-2 font-semibold hover:bg-azulutn/90 disabled:opacity-60">
        Buscar
      </button>
      <button v-if="hayFiltros" type="button" @click="limpiarFiltros"
        class="border border-gris text-gris rounded-lg px-6 py-2 font-semibold hover:bg-celeste">
        Limpiar filtros
      </button>
    </form>

    <p v-if="error" role="alert" class="text-red-600 text-sm">{{ error }}</p>
    <p v-if="cargando" class="text-gris text-sm">Cargando…</p>

    <!-- Cards con información: 2 por renglón. Tiene título, badge con el nombre
         de la materia, descripción, "Subido por: autor" y botón Descargar -->
    <div v-if="resultados.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <article v-for="apunte in resultados" :key="apunte.id"
        class="bg-white rounded-xl shadow p-5 space-y-2">
        <div class="flex justify-between items-start gap-2">
          <h3 class="font-semibold text-azuloscuro">{{ apunte.nombre }}</h3>
          <span class="shrink-0 rounded-full bg-celeste px-2.5 py-0.5 text-xs font-medium text-azulutn">
            {{ apunte.materia }}
          </span>
        </div>
        <p class="text-sm text-gris">{{ apunte.descripcion || 'Sin descripción' }}</p>
        <div class="flex justify-between items-center pt-1">
          <p class="text-xs text-gris">Subido por: {{ apunte.autor }}</p>
          <button type="button" @click="descargar(apunte)"
            class="text-sm text-turquesa font-semibold cursor-pointer hover:text-azulutn hover:underline">
            Descargar
          </button>
        </div>
      </article>
    </div>

    <p v-else-if="!cargando" class="text-gris">
      No se encontraron apuntes para el criterio ingresado.
    </p>

    <!-- Paginador -->
    <nav v-if="paginacion.totalPaginas > 1" class="flex justify-center items-center gap-2">
      <button type="button" :disabled="paginacion.pagina === 1" @click="paginaAnterior"
        class="border border-gris rounded-lg px-3 py-1 text-sm hover:bg-celeste disabled:opacity-50">
        Anterior
      </button>
      <button v-for="pagina in paginacion.totalPaginas" :key="pagina" type="button"
        @click="irAPagina(pagina)"
        class="border rounded-lg px-3 py-1 text-sm"
        :class="pagina === paginacion.pagina
          ? 'border-azulutn bg-azulutn text-white'
          : 'border-gris hover:bg-celeste'">
        {{ pagina }}
      </button>
      <button type="button" :disabled="paginacion.pagina === paginacion.totalPaginas"
        @click="paginaSiguiente"
        class="border border-gris rounded-lg px-3 py-1 text-sm hover:bg-celeste disabled:opacity-50">
        Siguiente
      </button>
    </nav>
  </section>
</template>
