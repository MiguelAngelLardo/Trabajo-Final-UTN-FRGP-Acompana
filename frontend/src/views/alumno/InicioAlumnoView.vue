<script setup>
import { useSesionStore } from '../../stores/sesion'

const sesion = useSesionStore()

const accesos = [
  { titulo: 'Buscar apuntes', descripcion: 'Material subido por otros alumnos/as', ruta: '/apuntes' },
  { titulo: 'Buscar tutores', descripcion: 'Compañeros/as disponibles para ayudarte', ruta: '/tutores' },
  { titulo: 'Mis solicitudes', descripcion: 'Estado de tus pedidos de tutoría', ruta: '/solicitudes' },
  { titulo: 'Mi perfil', descripcion: 'Tus datos personales y foto', ruta: '/perfil' }
]
</script>

<template>
  <div class="max-w-4xl mx-auto py-8 px-4 space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-azuloscuro">Hola, {{ sesion.usuario?.nombre }}</h1>
      <p class="text-gris">Inicio de alumno/a</p>
    </div>

    <!-- Accesos rápidos -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <router-link v-for="a in accesos" :key="a.ruta" :to="a.ruta"
        class="bg-white rounded-xl shadow p-5 hover:shadow-md transition group">
        <h3 class="font-semibold text-azuloscuro group-hover:text-azulutn">{{ a.titulo }}</h3>
        <p class="text-sm text-gris mt-1">{{ a.descripcion }}</p>
        <p class="text-turquesa text-sm font-semibold mt-3">Ir →</p>
      </router-link>
    </div>
  </div>
</template>