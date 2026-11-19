<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSesionStore } from '../../stores/sesion'
import { useNotificacionesStore, INTERVALO_ACTUALIZACION_MS } from '../../stores/notificaciones'
import logo from '../../assets/logo.png'
import CampanitaAvisos from './CampanitaAvisos.vue'
import PanelAccesibilidad from './PanelAccesibilidad.vue'

const sesion = useSesionStore()
const notificaciones = useNotificacionesStore()
const route = useRoute()
const router = useRouter()

let temporizador = null

function contadorDe(link) {
  return link.to === '/solicitudes' ? notificaciones.pendientesRecibidas : 0
}

onMounted(() => {
  if (!sesion.esAlumno) return
  notificaciones.actualizarPendientes()
  temporizador = setInterval(notificaciones.actualizarPendientes, INTERVALO_ACTUALIZACION_MS)
})
onBeforeUnmount(() => clearInterval(temporizador))

const menuAbierto = ref(false)

const linksAlumno = [
  { texto: 'Inicio', to: '/alumno' },
  { texto: 'Tutores', to: '/tutores' },
  { texto: 'Apuntes', to: '/apuntes' },
  { texto: 'Mis solicitudes', to: '/solicitudes' },
  { texto: 'Mi perfil', to: '/perfil' }
]

const linksAdmin = [
  { texto: 'Inicio', to: '/admin' },
  { texto: 'Usuarios', to: '/admin/usuarios' },
  { texto: 'Moderación', to: '/admin/moderacion' },
  { texto: 'Catálogo', to: '/admin/catalogo' }
]

const links = computed(() => (sesion.esAdmin ? linksAdmin : linksAlumno))

watch(() => route.fullPath, () => {
  menuAbierto.value = false
  if (sesion.esAlumno) notificaciones.actualizarPendientes()
})

function salir() {
  sesion.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <header class="bg-azuloscuro text-white">
    <nav class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
      <RouterLink to="/" class="shrink-0">
        <img :src="logo" alt="Acompaña — UTN FRGP" class="h-12 w-12 rounded-full bg-white" />
      </RouterLink>

      <ul class="hidden md:flex items-center gap-1">
        <li v-for="link in links" :key="link.to">
          <RouterLink :to="link.to"
            class="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors inline-flex items-center"
            active-class="bg-white/10 text-turquesa">
            {{ link.texto }}
            <span v-if="contadorDe(link)" :aria-label="`${contadorDe(link)} pendientes`"
              class="ml-1.5 min-w-5 h-5 px-1 rounded-full bg-turquesa text-azuloscuro text-xs font-bold inline-flex items-center justify-center">
              {{ contadorDe(link) }}
            </span>
          </RouterLink>
        </li>
      </ul>
        <div class="flex items-center gap-2">
          <PanelAccesibilidad />
          <CampanitaAvisos v-if="sesion.esAlumno" />

          <div class="hidden md:flex items-center gap-3">
            <span class="text-sm text-celeste">{{ sesion.usuario?.nombre }}</span>
            <span v-if="sesion.esAdmin" class="text-xs bg-turquesa text-azuloscuro font-bold px-2 py-0.5 rounded-full">Admin</span>
            <span v-else class="text-xs bg-azulutn text-white font-bold px-2 py-0.5 rounded-full">Alumno/a</span>
            <button @click="salir"
              class="text-sm border border-white/40 rounded-lg px-3 py-1.5 hover:bg-white/10 transition-colors">
              Cerrar sesión
            </button>
          </div>

          <button @click="menuAbierto = !menuAbierto" class="md:hidden p-2 rounded-lg hover:bg-white/10"
            :aria-expanded="menuAbierto" aria-label="Abrir menú">
            <svg v-if="!menuAbierto" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
            
        </button>
      </div>
    </nav>

    <div v-if="menuAbierto" class="md:hidden border-t border-white/10 px-4 pb-4">
      <ul class="py-2">
        <li v-for="link in links" :key="link.to">
          <RouterLink :to="link.to" class="flex items-center px-3 py-2 rounded-lg hover:bg-white/10"
            active-class="bg-white/10 text-turquesa">
            {{ link.texto }}
            <span v-if="contadorDe(link)" :aria-label="`${contadorDe(link)} pendientes`"
              class="ml-1.5 min-w-5 h-5 px-1 rounded-full bg-turquesa text-azuloscuro text-xs font-bold inline-flex items-center justify-center">
              {{ contadorDe(link) }}
            </span>
          </RouterLink>
        </li>
      </ul>
      <div class="flex items-center justify-between border-t border-white/10 pt-3">
        <span class="text-sm text-celeste">{{ sesion.usuario?.nombre }}</span>
        <button @click="salir" class="text-sm border border-white/40 rounded-lg px-3 py-1.5">
          Cerrar sesión
        </button>
      </div>
    </div>
  </header>
</template>
