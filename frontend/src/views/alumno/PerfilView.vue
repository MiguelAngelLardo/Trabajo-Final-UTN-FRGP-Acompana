<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../services/api'
import { mensajeDeError } from '../../utils/errores'
import DatosAcademicos from '../../components/materiasAprobadas/DatosAcademicos.vue'

const perfil = ref(null)
const cargandoPerfil = ref(true)
const editando = ref(false)

const verPassActual = ref(false)
const verPassNueva = ref(false)

const form = ref({
  telefono: '',
  direccion: '',
  sexo: '',
  descripcion: ''
})

const mensaje = ref('')
const error = ref('')
const cargando = ref(false)

// --- Foto ---
const errorFoto = ref('')
const cargandoFoto = ref(false)

// --- Contraseña ---
const mostrarContrasena = ref(false)
const formPass = ref({ contrasenaActual: '', contrasenaNueva: '' })
const errorPass = ref('')
const mensajePass = ref('')
const cargandoPass = ref(false)

async function cargarPerfil() {
  try {
    perfil.value = await api.get('/usuarios/me')
    form.value = {
      telefono: perfil.value.telefono || '',
      direccion: perfil.value.direccion || '',
      sexo: perfil.value.sexo || '',
      descripcion: perfil.value.descripcion || ''
    }
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargandoPerfil.value = false
  }
}

function cancelarEdicion() {
  form.value = {
    telefono: perfil.value.telefono || '',
    direccion: perfil.value.direccion || '',
    sexo: perfil.value.sexo || '',
    descripcion: perfil.value.descripcion || ''
  }
  editando.value = false
  error.value = ''
  mensaje.value = ''
}

async function guardarPerfil() {
  error.value = ''
  mensaje.value = ''
  cargando.value = true
  try {
    const datos = {
      Telefono_P: form.value.telefono,
      Direccion_P: form.value.direccion,
      Sexo_P: form.value.sexo,
      Descripcion_A: form.value.descripcion || null
    }
    await api.patch('/usuarios/me', datos)
    await cargarPerfil()
    mensaje.value = 'Perfil actualizado'
    editando.value = false
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargando.value = false
  }
}

async function subirFoto(event) {
  const archivo = event.target.files[0]
  if (!archivo) return

  errorFoto.value = ''
  cargandoFoto.value = true

  const formData = new FormData()
  formData.append('foto', archivo)

  try {
    const resultado = await api.patch('/usuarios/me/foto', formData)
    perfil.value.fotoPerfil = resultado.fotoPerfil
  } catch (err) {
    errorFoto.value = mensajeDeError(err)
  } finally {
    cargandoFoto.value = false
  }
}

async function cambiarContrasena() {
  errorPass.value = ''
  mensajePass.value = ''
  cargandoPass.value = true
  try {
    await api.patch('/usuarios/me/contrasena', formPass.value)
    mensajePass.value = 'Contraseña actualizada'
    formPass.value = { contrasenaActual: '', contrasenaNueva: '' }
    mostrarContrasena.value = false
  } catch (err) {
    errorPass.value = mensajeDeError(err)
  } finally {
    cargandoPass.value = false
  }
}

onMounted(cargarPerfil)
</script>

<template>
  <div class="max-w-2xl mx-auto py-8 px-4 space-y-6">
    <h1 class="text-2xl font-bold text-azuloscuro">Mi perfil</h1>

    <!-- Cargando -->
    <p v-if="cargandoPerfil" class="text-gris">Cargando perfil…</p>

    <template v-if="perfil">
      <!-- Foto de perfil -->
      <div class="flex items-center gap-4">
        <div class="w-20 h-20 rounded-full bg-celeste flex items-center justify-center overflow-hidden">
          <img v-if="perfil.fotoPerfil" :src="perfil.fotoPerfil" alt="Foto de perfil" class="w-full h-full object-cover" />
          <span v-else class="text-2xl font-bold text-azuloscuro">
            {{ perfil.nombre?.charAt(0) }}{{ perfil.apellido?.charAt(0) }}
          </span>
        </div>
        <div>
          <h2 class="text-lg font-semibold text-azuloscuro">{{ perfil.nombre }} {{ perfil.apellido }}</h2>
          <p class="text-sm text-gris">{{ perfil.correo }}</p>
          <label class="text-sm text-turquesa font-semibold cursor-pointer hover:underline">
            {{ cargandoFoto ? 'Subiendo…' : 'Cambiar foto' }}
            <input type="file" accept="image/*" class="hidden" @change="subirFoto" :disabled="cargandoFoto" />
          </label>
          <p v-if="errorFoto" class="text-red-600 text-sm">{{ errorFoto }}</p>
        </div>
      </div>

      <!-- Datos de solo lectura -->
      <div class="bg-white rounded-xl shadow p-5 space-y-3">
        <h3 class="text-sm font-semibold text-gris uppercase">Datos institucionales</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gris">DNI</p>
            <p class="font-semibold text-azuloscuro">{{ perfil.dni }}</p>
          </div>
          <div>
            <p class="text-gris">Legajo</p>
            <p class="font-semibold text-azuloscuro">{{ perfil.legajo }}</p>
          </div>
          <div>
            <p class="text-gris">Nombre</p>
            <p class="font-semibold text-azuloscuro">{{ perfil.nombre }} {{ perfil.apellido }}</p>
          </div>
          <div>
            <p class="text-gris">Correo</p>
            <p class="font-semibold text-azuloscuro">{{ perfil.correo }}</p>
          </div>
        </div>
      </div>

      <!-- Datos académicos -->
      <DatosAcademicos />

      <!-- Datos editables -->
      <div class="bg-white rounded-xl shadow p-5 space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-sm font-semibold text-gris uppercase">Datos personales</h3>
          <button v-if="!editando" @click="editando = true"
            class="text-sm text-turquesa font-semibold hover:underline">
            Editar
          </button>
        </div>

        <p v-if="mensaje" class="text-green-700 text-sm">{{ mensaje }}</p>
        <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

        <!-- Modo lectura -->
        <div v-if="!editando" class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gris">Teléfono</p>
            <p class="font-semibold text-azuloscuro">{{ perfil.telefono }}</p>
          </div>
          <div>
            <p class="text-gris">Sexo</p>
            <p class="font-semibold text-azuloscuro">
              {{ perfil.sexo === 'M' ? 'Masculino' : perfil.sexo === 'F' ? 'Femenino' : 'Otro' }}
            </p>
          </div>
          <div class="col-span-2">
            <p class="text-gris">Dirección</p>
            <p class="font-semibold text-azuloscuro">{{ perfil.direccion }}</p>
          </div>
          <div class="col-span-2">
            <p class="text-gris">Descripción</p>
            <p class="font-semibold text-azuloscuro">{{ perfil.descripcion || 'Sin descripción' }}</p>
          </div>
        </div>

        <!-- Modo edición -->
        <form v-else @submit.prevent="guardarPerfil" class="space-y-3">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-sm font-semibold text-azuloscuro">Teléfono</label>
              <input v-model="form.telefono" type="tel" required
                class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
            </div>
            <div class="space-y-1">
              <label class="block text-sm font-semibold text-azuloscuro">Sexo</label>
              <select v-model="form.sexo" required
                class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa">
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="X">Otro</option>
              </select>
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Dirección</label>
            <input v-model="form.direccion" type="text" required
              class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Descripción</label>
            <input v-model="form.descripcion" type="text" maxlength="50" placeholder="Breve descripción (opcional)"
              class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
          </div>
          <div class="flex gap-3">
            <button type="submit" :disabled="cargando"
              class="bg-azulutn text-white font-semibold rounded-lg px-4 py-2 hover:bg-azulutn/90 disabled:opacity-60">
              {{ cargando ? 'Guardando…' : 'Guardar' }}
            </button>
            <button type="button" @click="cancelarEdicion"
              class="border border-gris text-gris rounded-lg px-4 py-2 hover:bg-gray-100">
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <!-- Cambiar contraseña -->
      <div class="bg-white rounded-xl shadow p-5 space-y-4">
        <div class="flex justify-between items-center">
          <h3 class="text-sm font-semibold text-gris uppercase">Contraseña</h3>
          <button v-if="!mostrarContrasena" @click="mostrarContrasena = true"
            class="text-sm text-turquesa font-semibold hover:underline">
            Cambiar
          </button>
        </div>

        <p v-if="mensajePass" class="text-green-700 text-sm">{{ mensajePass }}</p>
        <p v-if="errorPass" class="text-red-600 text-sm">{{ errorPass }}</p>

        <form v-if="mostrarContrasena" @submit.prevent="cambiarContrasena" class="space-y-3">
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Contraseña actual</label>
            <div class="relative">
              <input v-model="formPass.contrasenaActual" :type="verPassActual ? 'text' : 'password'" required
                class="w-full border border-gris rounded-lg px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-turquesa" />
              <button type="button" @click="verPassActual = !verPassActual"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gris hover:text-azuloscuro">
                {{ verPassActual ? 'Ocultar' : 'Ver' }}
              </button>
            </div>
          </div>
          
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Contraseña nueva</label>
            <div class="relative">
              <input v-model="formPass.contrasenaNueva" :type="verPassNueva ? 'text' : 'password'" required
                class="w-full border border-gris rounded-lg px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-turquesa" />
              <button type="button" @click="verPassNueva = !verPassNueva"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gris hover:text-azuloscuro">
                {{ verPassNueva ? 'Ocultar' : 'Ver' }}
              </button>
            </div>
            <p class="text-xs text-gris">Mínimo 8 caracteres, una mayúscula, una minúscula y un número</p>
          </div>

          <div class="flex gap-3">
            <button type="submit" :disabled="cargandoPass"
              class="bg-azulutn text-white font-semibold rounded-lg px-4 py-2 hover:bg-azulutn/90 disabled:opacity-60">
              {{ cargandoPass ? 'Actualizando…' : 'Actualizar contraseña' }}
            </button>
            <button type="button" @click="mostrarContrasena = false; errorPass = ''; mensajePass = ''"
              class="border border-gris text-gris rounded-lg px-4 py-2 hover:bg-gray-100">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>