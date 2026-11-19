<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAccesibilidadStore } from '../../stores/accesibilidad'
import InterruptorAccesibilidad from '../ui/InterruptorAccesibilidad.vue'

const accesibilidad = useAccesibilidadStore()
const route = useRoute()

const abierto = ref(false)
const contenedor = ref(null)

function cerrarSiClickAfuera(evento) {
  if (contenedor.value && !contenedor.value.contains(evento.target)) {
    abierto.value = false
  }
}

watch(() => route.fullPath, () => { abierto.value = false })

onMounted(() => document.addEventListener('mousedown', cerrarSiClickAfuera))
onBeforeUnmount(() => document.removeEventListener('mousedown', cerrarSiClickAfuera))
</script>

<template>
  <div ref="contenedor" class="relative" @keydown.esc="abierto = false">
    <button type="button" @click="abierto = !abierto" :aria-expanded="abierto"
      aria-label="Opciones de accesibilidad" title="Opciones de accesibilidad"
      class="p-2 rounded-lg hover:bg-white/10 transition-colors">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="12" cy="4.5" r="1.8" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 8.5c2.3.7 4.6 1 7 1s4.7-.3 7-1M12 9.5V14m0 0-3 6.5M12 14l3 6.5" />
      </svg>
    </button>

    <div v-if="abierto"
      class="absolute right-0 top-full mt-2 z-30 w-80 max-w-[calc(100vw-2rem)] bg-white text-azuloscuro rounded-xl shadow-lg border border-gris/20 p-4 space-y-4">
      <p class="font-semibold">Accesibilidad</p>
      <InterruptorAccesibilidad
        titulo="Modo para daltónicos"
        descripcion="Colores distinguibles con daltonismo"
        :activo="accesibilidad.modoDaltonico"
        @alternar="accesibilidad.alternarModoDaltonico()" />
      <InterruptorAccesibilidad
        titulo="Fuente para dislexia"
        descripcion="Tipografía OpenDyslexic"
        clase-texto="font-dislexia"
        :activo="accesibilidad.fuenteDislexia"
        @alternar="accesibilidad.alternarFuenteDislexia()" />
    </div>
  </div>
</template>
