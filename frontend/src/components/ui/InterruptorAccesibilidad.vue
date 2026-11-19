<script setup>
defineProps({
  titulo: { type: String, required: true },
  descripcion: { type: String, default: '' },
  activo: { type: Boolean, required: true },
  claseTexto: { type: String, default: '' }
})

defineEmits(['alternar'])
</script>

<template>
  <button type="button" role="switch" :aria-checked="activo" @click="$emit('alternar')"
    class="w-full flex items-center justify-between gap-3 text-sm text-azuloscuro">
    <span class="text-left" :class="claseTexto">
      <span class="block font-semibold">{{ titulo }}</span>
      <span v-if="descripcion" class="block text-xs text-gris">{{ descripcion }}</span>
    </span>
    <span class="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors"
      :class="activo ? 'bg-azulutn' : 'bg-gris/40'">
      <span class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
        :class="{ 'translate-x-5': activo }"></span>
    </span>
  </button>
</template>
