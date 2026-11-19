<script setup>
defineProps({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  requerimientos: { type: String, default: '' }
})
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold">{{ titulo }}</h1>

    <div class="space-y-2">
      <p>Acá va {{ descripcion }}</p>
      <p v-if="requerimientos" class="text-sm text-gris">Requerimientos: {{ requerimientos }}</p>
    </div>
  </section>
</template>
