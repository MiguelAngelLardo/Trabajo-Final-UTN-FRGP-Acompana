<script setup>
import { ref, onMounted } from 'vue'
import BuscadorTutores from '../../components/tutorias/BuscadorTutores.vue'
import PostulacionTutor from '../../components/tutorias/PostulacionTutor.vue'
import { obtenerMisCarreras } from '../../services/catalogo'
import { mensajeDeError } from '../../utils/errores'

const pestanas = [
  { id: 'buscar', texto: 'Buscar tutores' },
  { id: 'postularme', texto: 'Postularme como tutor' }
]
const pestanaActiva = ref('buscar')

const carreras = ref([])
const cargando = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    carreras.value = await obtenerMisCarreras()
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <section class="space-y-6">
    <h1 class="text-2xl font-semibold">Tutores</h1>

    <div class="flex gap-2 border-b border-gris/30">
      <button v-for="p in pestanas" :key="p.id" @click="pestanaActiva = p.id"
        class="px-4 py-2 -mb-px border-b-2 transition-colors"
        :class="pestanaActiva === p.id ? 'border-azulutn text-azulutn font-medium' : 'border-transparent text-gris hover:text-azuloscuro'">
        {{ p.texto }}
      </button>
    </div>

    <p v-if="cargando" class="text-gris">Cargando…</p>
    <p v-else-if="error" class="text-red-600">{{ error }}</p>
    <p v-else-if="carreras.length === 0" class="text-gris">No estás inscripto en ninguna carrera.</p>

    <template v-else>
      <BuscadorTutores v-if="pestanaActiva === 'buscar'" :carreras="carreras" />
      <PostulacionTutor v-else :carreras="carreras" />
    </template>
  </section>
</template>
