<script setup>
import { ref } from 'vue'
import BuscarApuntes from '../../components/apuntes/BuscarApuntes.vue'
import MisApuntes from '../../components/apuntes/MisApuntes.vue'

// Al hacer click en "Mis apuntes" se muestra MisApuntes y desaparece
// BuscarApuntes (y viceversa)
const viendoMisApuntes = ref(false)
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-azuloscuro">Apuntes</h1>
      <button type="button" @click="viendoMisApuntes = !viendoMisApuntes"
        class="bg-azulutn text-white font-semibold rounded-lg px-4 py-2 hover:bg-azulutn/90">
        {{ viendoMisApuntes ? 'Buscar apuntes' : 'Mis apuntes' }}
      </button>
    </div>

    <!-- Si hice click en "Mis apuntes" veo este componente y desaparece el otro -->
    <MisApuntes v-if="viendoMisApuntes" />
    <BuscarApuntes v-else />
  </div>
</template>
