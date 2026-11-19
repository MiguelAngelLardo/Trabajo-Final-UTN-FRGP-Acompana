<script setup>
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()

const estilos = {
  exito: 'bg-green-700 text-white',
  error: 'bg-red-700 text-white',
  aviso: 'bg-amber-600 text-white'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
      aria-live="polite">
      <div v-for="t in toast.toasts" :key="t.id" role="status"
        class="flex items-start justify-between gap-3 rounded-lg px-4 py-3 shadow-lg text-sm"
        :class="estilos[t.tipo]">
        <span>{{ t.mensaje }}</span>
        <button type="button" class="shrink-0 opacity-80 hover:opacity-100"
          aria-label="Cerrar aviso" @click="toast.cerrar(t.id)">✕</button>
      </div>
    </div>
  </Teleport>
</template>