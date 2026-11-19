<script setup>
import { ref, nextTick } from 'vue'
 import CatalogoCarreras from '../../components/catalogo/CatalogoCarreras.vue'
 import CatalogoMaterias from '../../components/catalogo/CatalogoMaterias.vue'

const tab = ref('carreras')

const tabs = [
  { valor: 'carreras', texto: 'Carreras' },
  { valor: 'materias', texto: 'Materias' }
]

const refCarreras = ref(null)
const refMaterias = ref(null)

async function nuevaCarrera() {
  tab.value = 'carreras'
  await nextTick()
  refCarreras.value?.abrirForm()
}

async function nuevaMateria() {
  tab.value = 'materias'
  await nextTick()
  refMaterias.value?.abrirForm()
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4 space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-2xl font-bold text-azuloscuro">Gestionar catálogo</h1>
      <div class="ms-auto flex gap-2">
        <button type="button" @click="nuevaCarrera"
          class="rounded-lg bg-azulutn px-4 py-2 text-sm font-medium text-white hover:bg-azulutn/90">
          + Nueva carrera
        </button>
        <button type="button" @click="nuevaMateria"
          class="rounded-lg bg-azulutn px-4 py-2 text-sm font-medium text-white hover:bg-azulutn/90">
          + Nueva materia
        </button>
      </div>
    </div>

    <div class="flex gap-2 mb-6" role="tablist">
      <button v-for="t in tabs" :key="t.valor" type="button" role="tab"
        :aria-selected="tab === t.valor" @click="tab = t.valor"
        class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
        :class="tab === t.valor
          ? 'bg-acento border-acento text-white'
          : 'border-gray-500 hover:bg-gray-100'">
        {{ t.texto }}
      </button>
    </div>
    <CatalogoCarreras ref="refCarreras" v-if="tab === 'carreras'" /> 
    <CatalogoMaterias ref="refMaterias" v-else /> 
  </div>
</template>