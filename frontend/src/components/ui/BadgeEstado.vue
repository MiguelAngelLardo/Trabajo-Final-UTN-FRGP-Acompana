<script setup>
defineProps({ activo: { type: Boolean, required: true } })
</script>

<template>
  <span class="inline-block rounded-full px-3 py-0.5 text-xs font-medium"
    :class="activo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'">
    {{ activo ? 'Activa' : 'Inactiva' }}
  </span>
</template>