<script setup>
import Navbar from '../components/layout/Navbar.vue'
import Footer from '../components/layout/Footer.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <a href="#contenido"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-azuloscuro focus:shadow-lg">
      Saltar al contenido
    </a>
    <Navbar />
    <main id="contenido" tabindex="-1" class="flex-1 w-full max-w-6xl mx-auto px-4 py-6 focus:outline-none">
      <RouterView />
    </main>
    <Footer />
  </div>
</template>
