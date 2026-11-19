<script setup>
import { ref, onMounted } from 'vue'
import { useSesionStore } from '../../stores/sesion'
import { api } from '../../services/api'

const sesion = useSesionStore()

const totalAlumnos = ref(null)
const totalApuntes = ref(null)

onMounted(async () => {
  try {
    const usuarios = await api.get('/usuarios?pagina=1&porPagina=1')
    totalAlumnos.value = usuarios.total
  } catch { /* silenciar */ }

  try {
    const apuntes = await api.get('/moderacion?porPagina=1')
    totalApuntes.value = apuntes.paginacion.totalApuntes
  } catch { /* silenciar */ }
})

const accesos = [
  { titulo: 'Gestionar usuarios', descripcion: 'Alta, edición y baja de cuentas', ruta: '/admin/usuarios' },
  { titulo: 'Moderar apuntes', descripcion: 'Revisar y habilitar apuntes subidos', ruta: '/admin/moderacion' },
  { titulo: 'Gestionar catálogo', descripcion: 'Carreras y materias', ruta: '/admin/catalogo' }
]
</script>

<template>
  <div class="max-w-4xl mx-auto py-8 px-4 space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-azuloscuro">Panel de administración</h1>
      <p class="text-gris">Hola, {{ sesion.usuario?.nombre }}</p>
    </div>

    <!-- Contadores -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-xl shadow p-5 text-center">
        <p class="text-3xl font-bold text-azulutn">{{ totalAlumnos ?? '…' }}</p>
        <p class="text-sm text-gris">Alumnos/as registrados</p>
      </div>
      <div class="bg-white rounded-xl shadow p-5 text-center">
        <p class="text-3xl font-bold text-azulutn">{{ totalApuntes ?? '…' }}</p>
        <p class="text-sm text-gris">Apuntes publicados</p>
      </div>
    </div>

    <!-- Accesos rápidos -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <router-link v-for="a in accesos" :key="a.ruta" :to="a.ruta"
        class="bg-white rounded-xl shadow p-5 hover:shadow-md transition group">
        <h3 class="font-semibold text-azuloscuro group-hover:text-azulutn">{{ a.titulo }}</h3>
        <p class="text-sm text-gris mt-1">{{ a.descripcion }}</p>
        <p class="text-turquesa text-sm font-semibold mt-3">Ir →</p>
      </router-link>
    </div>
  </div>
</template>