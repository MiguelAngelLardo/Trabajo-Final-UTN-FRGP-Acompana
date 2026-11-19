<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../../services/api'
import { mensajeDeError } from '../../utils/errores'

// --- Listado con paginación ---
const busqueda = ref('')
const usuarios = ref([])
const pagina = ref(1)
const totalPaginas = ref(1)
const total = ref(0)
const error = ref('')
const cargando = ref(false)

async function cargarUsuarios(pag = 1) {
  error.value = ''
  cargando.value = true
  try {
    const params = `?pagina=${pag}&porPagina=10${busqueda.value.trim() ? '&q=' + encodeURIComponent(busqueda.value.trim()) : ''}`
    const data = await api.get(`/usuarios${params}`)
    usuarios.value = data.usuarios
    pagina.value = data.pagina
    totalPaginas.value = data.totalPaginas
    total.value = data.total
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargando.value = false
  }
}

function buscar() {
  cargarUsuarios(1)
}

// --- Toggle estado ---
const cargandoEstado = ref(null)

async function toggleEstado(usuario) {
  cargandoEstado.value = usuario.dni
  try {
    await api.patch(`/usuarios/${usuario.dni}/estado`, { estado: !usuario.estado })
    usuario.estado = !usuario.estado
  } catch (err) {
    error.value = mensajeDeError(err)
  } finally {
    cargandoEstado.value = null
  }
}

// --- Crear usuario ---
const mostrarCrear = ref(false)
const carreras = ref([])
const formCrear = ref(formCrearVacio())
const errorCrear = ref('')
const detallesCrear = ref([])
const cargandoCrear = ref(false)
const exitoCrear = ref('')

function formCrearVacio() {
  return { dni: '', nombre: '', apellido: '', correo: '', sexo: '', direccion: '', telefono: '', legajo: '', contrasena: '', carrera: '' }
}

async function abrirCrear() {
  formCrear.value = formCrearVacio()
  errorCrear.value = ''
  detallesCrear.value = []
  exitoCrear.value = ''
  mostrarCrear.value = true
  if (!carreras.value.length) {
    try {
      carreras.value = await api.get('/auth/carreras')
    } catch (err) {
      errorCrear.value = 'No se pudieron cargar las carreras'
    }
  }
}

async function crearUsuario() {
  errorCrear.value = ''
  detallesCrear.value = []
  cargandoCrear.value = true
  try {
    const resultado = await api.post('/usuarios', formCrear.value)
    exitoCrear.value = `Usuario ${resultado.nombre} ${resultado.apellido} creado`
    formCrear.value = formCrearVacio()
    await cargarUsuarios(pagina.value)
  } catch (err) {
    errorCrear.value = err.message
    detallesCrear.value = err.details || []
  } finally {
    cargandoCrear.value = false
  }
}


//funcion para resetear busqueda al borrar caracteres en barra
function alCambiarBusqueda() {
  if (!busqueda.value.trim()) {
    cargarUsuarios(1)
  }
}

// --- Editar usuario ---
const mostrarEditar = ref(false)
const usuarioEditando = ref(null)
const formEditar = ref({ Nombre_P: '', Apellido_P: '', CorreoInstitucional_P: '', Legajo_A: '' })
const errorEditar = ref('')
const detallesEditar = ref([])
const cargandoEditar = ref(false)
const exitoEditar = ref('')

function abrirEditar(usuario) {
  usuarioEditando.value = usuario
  formEditar.value = {
    Nombre_P: usuario.nombre || '',
    Apellido_P: usuario.apellido || '',
    CorreoInstitucional_P: usuario.correo || '',
    Legajo_A: usuario.legajo || ''
  }
  errorEditar.value = ''
  detallesEditar.value = []
  exitoEditar.value = ''
  mostrarEditar.value = true
}

async function guardarEdicion() {
  errorEditar.value = ''
  detallesEditar.value = []
  cargandoEditar.value = true
  try {
    await api.patch(`/usuarios/${usuarioEditando.value.dni}`, formEditar.value)
    exitoEditar.value = 'Usuario actualizado'
    usuarioEditando.value.nombre = formEditar.value.Nombre_P
    usuarioEditando.value.apellido = formEditar.value.Apellido_P
    usuarioEditando.value.correo = formEditar.value.CorreoInstitucional_P
    usuarioEditando.value.legajo = formEditar.value.Legajo_A
  } catch (err) {
    errorEditar.value = err.message
    detallesEditar.value = err.details || []
  } finally {
    cargandoEditar.value = false
  }
}

onMounted(() => cargarUsuarios(1))
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 px-4 space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-azuloscuro">Gestionar usuarios</h1>
      <button @click="abrirCrear"
        class="bg-azulutn text-white font-semibold rounded-lg px-4 py-2 hover:bg-azulutn/90">
        + Nuevo usuario
      </button>
    </div>

    <!-- Buscador -->
    <form @submit.prevent="buscar" class="flex gap-3">
      <input v-model="busqueda" type="text" placeholder="Buscar por DNI, legajo, correo o nombre"
      @input="alCambiarBusqueda"
        class="flex-1 border border-gris rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
      <button type="submit" :disabled="cargando"
        class="bg-azulutn text-white rounded-lg px-6 py-2 font-semibold hover:bg-azulutn/90 disabled:opacity-60">
        Buscar
      </button>
    </form>

    <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    <p v-if="cargando" class="text-gris text-sm">Cargando…</p>

    <!-- Info de resultados -->
    <p v-if="!cargando && usuarios.length" class="text-sm text-gris">
      {{ total }} usuario{{ total !== 1 ? 's' : '' }} encontrado{{ total !== 1 ? 's' : '' }}
    </p>

    <!-- Tabla -->
    <div v-if="usuarios.length" class="bg-white rounded-xl shadow overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-azuloscuro text-white">
          <tr>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-left">Legajo</th>
            <th class="px-4 py-3 text-left">Correo</th>
            <th class="px-4 py-3 text-center">Estado</th>
            <th class="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.dni" class="border-t border-gray-100 hover:bg-fondo">
            <td class="px-4 py-3">{{ u.nombre }} {{ u.apellido }}</td>
            <td class="px-4 py-3">{{ u.legajo || '—' }}</td>
            <td class="px-4 py-3">{{ u.correo }}</td>
            <td class="px-4 py-3 text-center">
              <span :class="u.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                class="px-3 py-1 rounded-full text-xs font-semibold">
                {{ u.estado ? 'Habilitado' : 'Deshabilitado' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-2">
                <button @click="abrirEditar(u)"
                  class="w-16 text-center text-turquesa font-semibold hover:underline text-sm">
                  Editar
                </button>
                <button @click="toggleEstado(u)" :disabled="cargandoEstado === u.dni"
                  class="w-24 text-center font-semibold hover:underline text-sm"
                  :class="u.estado ? 'text-red-500' : 'text-green-600'">
                  {{ cargandoEstado === u.dni ? '…' : (u.estado ? 'Deshabilitar' : 'Habilitar') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-if="!cargando && !usuarios.length && !error" class="text-gris text-sm">No se encontraron usuarios</p>

    <!-- Paginador -->
    <div v-if="totalPaginas > 1" class="flex justify-center items-center gap-4">
      <button @click="cargarUsuarios(pagina - 1)" :disabled="pagina <= 1"
        class="text-sm font-semibold text-azulutn hover:underline disabled:text-gris disabled:no-underline">
        Anterior
      </button>
      <span class="text-sm text-gris">Página {{ pagina }} de {{ totalPaginas }}</span>
      <button @click="cargarUsuarios(pagina + 1)" :disabled="pagina >= totalPaginas"
        class="text-sm font-semibold text-azulutn hover:underline disabled:text-gris disabled:no-underline">
        Siguiente
      </button>
    </div>

    <!-- Modal Crear -->
    <div v-if="mostrarCrear" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <h2 class="text-xl font-bold text-azuloscuro">Nuevo usuario</h2>
        <p class="text-sm text-gris">El alumno podrá cambiar su contraseña al ingresar</p>

        <div v-if="exitoCrear" class="bg-green-100 text-green-800 rounded-lg p-3 text-sm">{{ exitoCrear }}</div>
        <div v-if="errorCrear" class="bg-red-50 text-red-600 rounded-lg p-3 text-sm space-y-1">
          <p class="font-semibold">{{ errorCrear }}</p>
          <ul v-if="detallesCrear.length" class="list-disc list-inside">
            <li v-for="(d, i) in detallesCrear" :key="i">{{ d }}</li>
          </ul>
        </div>

        <form @submit.prevent="crearUsuario" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="block text-sm font-semibold text-azuloscuro">DNI</label>
              <input v-model="formCrear.dni" type="text" required maxlength="8"
                class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
            </div>
            <div class="space-y-1">
              <label class="block text-sm font-semibold text-azuloscuro">Legajo</label>
              <input v-model="formCrear.legajo" type="text" required maxlength="5"
                class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="block text-sm font-semibold text-azuloscuro">Nombre</label>
              <input v-model="formCrear.nombre" type="text" required maxlength="50"
                class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
            </div>
            <div class="space-y-1">
              <label class="block text-sm font-semibold text-azuloscuro">Apellido</label>
              <input v-model="formCrear.apellido" type="text" required maxlength="50"
                class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Correo institucional</label>
            <input v-model="formCrear.correo" type="email" required
              class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="block text-sm font-semibold text-azuloscuro">Teléfono</label>
              <input v-model="formCrear.telefono" type="tel" required maxlength="20"
                class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
            </div>
            <div class="space-y-1">
              <label class="block text-sm font-semibold text-azuloscuro">Sexo</label>
              <select v-model="formCrear.sexo" required
                class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa">
                <option value="" disabled>Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="X">Otro</option>
              </select>
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Dirección</label>
            <input v-model="formCrear.direccion" type="text" required maxlength="100"
              class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Carrera</label>
            <select v-model="formCrear.carrera" required
              class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa">
              <option value="" disabled>Seleccionar carrera</option>
              <option v-for="c in carreras" :key="c.IdCarrera_Ca" :value="c.IdCarrera_Ca">
                {{ c.Nombre_Ca }}
              </option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Contraseña</label>
            <input v-model="formCrear.contrasena" type="password" required
              class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
            <p class="text-xs text-gris">Mínimo 8 caracteres, una mayúscula, una minúscula y un número</p>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="cargandoCrear"
              class="bg-azulutn text-white font-semibold rounded-lg px-4 py-2 hover:bg-azulutn/90 disabled:opacity-60">
              {{ cargandoCrear ? 'Creando…' : 'Crear usuario' }}
            </button>
            <button type="button" @click="mostrarCrear = false"
              class="border border-gris text-gris rounded-lg px-4 py-2 hover:bg-gray-100">
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Editar -->
    <div v-if="mostrarEditar" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 class="text-xl font-bold text-azuloscuro">Editar usuario</h2>
        <p class="text-sm text-gris">DNI: {{ usuarioEditando.dni }}</p>

        <div v-if="exitoEditar" class="bg-green-100 text-green-800 rounded-lg p-3 text-sm">{{ exitoEditar }}</div>
        <div v-if="errorEditar" class="bg-red-50 text-red-600 rounded-lg p-3 text-sm space-y-1">
          <p class="font-semibold">{{ errorEditar }}</p>
          <ul v-if="detallesEditar.length" class="list-disc list-inside">
            <li v-for="(d, i) in detallesEditar" :key="i">{{ d }}</li>
          </ul>
        </div>

        <form @submit.prevent="guardarEdicion" class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="block text-sm font-semibold text-azuloscuro">Nombre</label>
              <input v-model="formEditar.Nombre_P" type="text" required maxlength="50"
                @input="exitoEditar = ''; errorEditar = ''"
                class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
            </div>
            <div class="space-y-1">
              <label class="block text-sm font-semibold text-azuloscuro">Apellido</label>
              <input v-model="formEditar.Apellido_P" type="text" required maxlength="50"
                @input="exitoEditar = ''; errorEditar = ''"  
                class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Correo institucional</label>
            <input v-model="formEditar.CorreoInstitucional_P" type="email" required
              @input="exitoEditar = ''; errorEditar = ''"  
             class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
          </div>
          <div class="space-y-1">
            <label class="block text-sm font-semibold text-azuloscuro">Legajo</label>
            <input v-model="formEditar.Legajo_A" type="text" required maxlength="5"
              @input="exitoEditar = ''; errorEditar = ''" 
              class="w-full border border-gris rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-turquesa" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="cargandoEditar"
              class="bg-azulutn text-white font-semibold rounded-lg px-4 py-2 hover:bg-azulutn/90 disabled:opacity-60">
              {{ cargandoEditar ? 'Guardando…' : 'Guardar cambios' }}
            </button>
            <button type="button" @click="mostrarEditar = false"
              class="border border-gris text-gris rounded-lg px-4 py-2 hover:bg-gray-100">
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>