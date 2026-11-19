<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../services/api'
import { mensajeDeError } from '../../utils/errores'

const router = useRouter()

const form = ref({
  dni: '',
  nombre: '',
  apellido: '',
  correo: '',
  sexo: '',
  direccion: '',
  telefono: '',
  legajo: '',
  contrasena: '',
  carrera: ''
})

const carreras = ref([])
const error = ref('')
const erroresDetalle = ref([])
const cargando = ref(false)
const exito = ref(false)

onMounted(async () => {
  try {
    const data = await api.get('/auth/carreras')
    carreras.value = data
  } catch (err) {
    error.value = 'No se pudieron cargar las carreras'
  }
})

async function registrar() {
  error.value = ''
  erroresDetalle.value = []
  cargando.value = true

  try {
    await api.post('/auth/register', form.value)
    exito.value = true
    setTimeout(() => router.push('/login'), 2000)
  } catch (err) {
    error.value = err.message
    erroresDetalle.value = err.details || []
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <main class="min-h-screen flex items-center justify-center px-4 py-8 bg-fondo">
    <form @submit.prevent="registrar" class="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 space-y-5">

      <!-- Logo y título -->
      <div class="flex flex-col items-center space-y-2">
        <img src="../../assets/logo.png" alt="Acompaña" class="w-16 h-16" />
        <div class="text-center">
          <h1 class="text-xl font-bold text-azuloscuro">Crear cuenta</h1>
          <p class="text-sm text-gris">UTN FRGP</p>
        </div>
      </div>

      <!-- Mensaje de éxito -->
      <div v-if="exito" class="bg-green-100 text-green-800 rounded-lg p-4 text-center text-sm">
        Cuenta creada. Redirigiendo al login…
      </div>

      <!-- Errores -->
      <div v-if="error" class="bg-red-50 text-red-600 rounded-lg p-4 text-sm space-y-1">
        <p class="font-semibold">{{ error }}</p>
        <ul v-if="erroresDetalle.length" class="list-disc list-inside">
          <li v-for="(det, i) in erroresDetalle" :key="i">{{ det }}</li>
        </ul>
      </div>

      <template v-if="!exito">
        <!-- DNI y Legajo en la misma fila -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">DNI</label>
            <input v-model="form.dni" type="text" placeholder="12345678" required
              maxlength="8"
              class="w-full bg-azuloscuro text-white placeholder-white/75 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa" />
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Legajo</label>
            <input v-model="form.legajo" type="text" placeholder="00123" required
              maxlength="5"
              class="w-full bg-azuloscuro text-white placeholder-white/75 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa" />
          </div>
        </div>

        <!-- Nombre y Apellido -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Nombre</label>
            <input v-model="form.nombre" type="text" placeholder="Nombre" required
              maxlength="50"
              class="w-full bg-azuloscuro text-white placeholder-white/75 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa" />
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Apellido</label>
            <input v-model="form.apellido" type="text" placeholder="Apellido" required
              maxlength="50"
              class="w-full bg-azuloscuro text-white placeholder-white/75 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa" />
          </div>
        </div>

        <!-- Correo -->
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-azuloscuro">Correo institucional</label>
          <input v-model="form.correo" type="email" placeholder="nombre.apellido@alumnos.frgp.utn.edu.ar" required
            class="w-full bg-azuloscuro text-white placeholder-white/75 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa" />
        </div>

        <!-- Teléfono y Sexo -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Teléfono</label>
            <input v-model="form.telefono" type="tel" placeholder="011 1234-5678" required
              maxlength="50"
              class="w-full bg-azuloscuro text-white placeholder-white/75 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa" />
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Sexo</label>
            <select v-model="form.sexo" required
              class="w-full bg-azuloscuro text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa">
              <option value="" disabled>Seleccionar</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="X">Otro</option>
            </select>
          </div>
        </div>

        <!-- Dirección -->
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-azuloscuro">Dirección</label>
          <input v-model="form.direccion" type="text" placeholder="Calle 123, Localidad" required
            maxlength="100"
            class="w-full bg-azuloscuro text-white placeholder-white/75 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa" />
        </div>

        <!-- Carrera -->
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-azuloscuro">Carrera</label>
          <select v-model="form.carrera" required
            class="w-full bg-azuloscuro text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa">
            <option value="" disabled>Seleccionar carrera</option>
            <option v-for="c in carreras" :key="c.IdCarrera_Ca" :value="c.IdCarrera_Ca">
              {{ c.Nombre_Ca }}
            </option>
          </select>
        </div>

        <!-- Contraseña -->
        <div class="space-y-1">
          <label class="block text-sm font-semibold text-azuloscuro">Contraseña</label>
          <input v-model="form.contrasena" type="password" placeholder="Mínimo 8 caracteres, mayúscula, minúscula y número" required
            class="w-full bg-azuloscuro text-white placeholder-white/75 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-turquesa" />
          <p class="text-xs text-gris">Mínimo 8 caracteres, una mayúscula, una minúscula y un número</p>
        </div>

        <!-- Botón -->
        <button type="submit" :disabled="cargando"
          class="w-full bg-azulutn text-white font-semibold rounded-lg py-3 hover:bg-azulutn/90 disabled:opacity-60 transition">
          {{ cargando ? 'Registrando…' : 'Crear cuenta' }}
        </button>

        <!-- Link a login -->
        <p class="text-center text-sm text-gris">
          ¿Ya tenés cuenta?
          <router-link to="/login" class="text-turquesa font-semibold hover:underline">
            Iniciar sesión
          </router-link>
        </p>
      </template>
    </form>
  </main>
</template>