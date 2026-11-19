<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSesionStore } from '../../stores/sesion'
import { useAccesibilidadStore } from '../../stores/accesibilidad'
import InterruptorAccesibilidad from '../../components/ui/InterruptorAccesibilidad.vue'

const sesion = useSesionStore()
const accesibilidad = useAccesibilidadStore()
const router = useRouter()
const route = useRoute()

const correo = ref('')
const contrasena = ref('')
const error = ref('')
const detallesError = ref([])
const cargando = ref(false)

async function ingresar() {
  error.value = ''
  cargando.value = true
  try {
    await sesion.login(correo.value, contrasena.value)
    router.push(route.query.redirect || '/')
  } catch (err) {
    error.value = err.message
    detallesError.value = err.details || []
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center px-4 bg-fondo">
    <form @submit.prevent="ingresar" class="w-full bg-white rounded-2xl shadow-lg p-8 space-y-5"
      :class="accesibilidad.fuenteDislexia ? 'max-w-lg' : 'max-w-sm'">

      <!-- Logo y título -->
      <div class="flex flex-col items-center space-y-2">
        <div class="w-16 h-16 rounded-full bg-azuloscuro flex items-center justify-center">
          <img src="../../assets/logo.png" alt="Acompaña" class="w-16 h-16" />
        </div>
        <div class="text-center">
          <h1 class="text-xl font-bold text-azuloscuro">Acompaña</h1>
          <p class="text-sm text-gris">UTN FRGP</p>
        </div>
      </div>

      <!-- Correo -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold text-azuloscuro">Correo institucional</label>
        <input
          v-model="correo"
          type="email"
          placeholder="nombre.apellido@frgp.utn.edu.ar"
          required
          @input="error = ''; detallesError = []"
          class="w-full bg-azuloscuro text-white placeholder-white/75 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa"
        />
      </div>

      <!-- Contraseña -->
      <div class="space-y-1">
        <label class="block text-sm font-semibold text-azuloscuro">Contraseña</label>
        <input
          v-model="contrasena"
          type="password"
          placeholder="Tu contraseña"
          required
          @input="error = ''; detallesError = []"
          class="w-full bg-azuloscuro text-white placeholder-white/75 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa"
        />
      </div>

      <!-- Error -->
      <div v-if="error" class="text-red-600 text-sm text-center">
        <template v-if="detallesError.length">
          <p v-for="(d, i) in detallesError" :key="i">{{ d }}</p>
        </template>
        <p v-else>{{ error }}</p>
      </div>
      <!-- Botón -->
      <button
        type="submit"
        :disabled="cargando"
        class="w-full bg-azulutn text-white font-semibold rounded-lg py-3 hover:bg-azulutn/90 disabled:opacity-60 transition"
      >
        {{ cargando ? 'Ingresando…' : 'Iniciar sesión' }}
      </button>

      <!-- Link a registro -->
      <p class="text-center text-sm text-gris">
        ¿No tenés cuenta?
        <router-link to="/registro" class="text-turquesa font-semibold hover:underline">
          Registrate
        </router-link>
      </p>

      <div class="border-t border-gris/20 pt-4 space-y-4">
        <InterruptorAccesibilidad
          titulo="Modo para daltónicos"
          descripcion="Colores de alto contraste, distinguibles con daltonismo"
          :activo="accesibilidad.modoDaltonico"
          @alternar="accesibilidad.alternarModoDaltonico()" />
        <InterruptorAccesibilidad
          titulo="Fuente para dislexia"
          descripcion="Tipografía OpenDyslexic, con letras más fáciles de distinguir"
          clase-texto="font-dislexia"
          :activo="accesibilidad.fuenteDislexia"
          @alternar="accesibilidad.alternarFuenteDislexia()" />
      </div>
    </form>
  </main>
</template>