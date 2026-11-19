import { api } from './api'
import { armarQuery } from '../utils/query'
// ============================================================
// Lectura (alumno y admin)
// ============================================================

// estado: 'true' | 'false' | 'todos'. El alumno solo puede pedir activas.
export function listarCarreras({ estado, q } = {}) {
  return api.get(`/catalogo/carreras${armarQuery({ estado, q })}`)
}

export function listarMaterias({ estado, q, idCarrera } = {}) {
  return api.get(`/catalogo/materias${armarQuery({ estado, q, idCarrera })}`)
}

// Para selectores: siempre solo activas, también si el que pide es admin
export function obtenerCarrerasActivas() {
  return listarCarreras({ estado: 'true' })
}

export function obtenerMateriasDeCarrera(idCarrera) {
  return listarMaterias({ estado: 'true', idCarrera })
}

// ============================================================
// Gestión (solo admin)
// ============================================================

export function crearCarrera(nombre) {
  return api.post('/catalogo/carreras', { nombre })
}

export function crearMateria({ nombre, idCarrera }) {
  return api.post('/catalogo/materias', { nombre, idCarrera })
}

export function renombrarCarrera(id, nombre) {
  return api.patch(`/catalogo/carreras/${id}`, { nombre })
}

export function renombrarMateria(id, nombre) {
  return api.patch(`/catalogo/materias/${id}`, { nombre })
}

// Baja lógica. La de carrera devuelve { carrera, materiasDadasDeBaja, materias }
export function bajaCarrera(id) {
  return api.patch(`/catalogo/carreras/${id}/baja`)
}

export function bajaMateria(id) {
  return api.patch(`/catalogo/materias/${id}/baja`)
}

// La de carrera devuelve { carrera, materiasReactivadas, totalMaterias }
export function reactivarCarrera(id) {
  return api.patch(`/catalogo/carreras/${id}/reactivar`)
}

export function reactivarMateria(id) {
  return api.patch(`/catalogo/materias/${id}/reactivar`)
}

// Eliminación física: 409 si tiene dependencias. Devuelve { id, nombre }
export function eliminarCarrera(id) {
  return api.delete(`/catalogo/carreras/${id}`)
}

export function eliminarMateria(id) {
  return api.delete(`/catalogo/materias/${id}`)
}

// ============================================================
// R3 (alumno)
// ============================================================

export async function obtenerMisCarreras() {
  const data = await api.get('/catalogo/mis-carreras')
  return data.carreras
}

export async function obtenerMateriasAprobadas(idCarrera) {
  const data = await api.get(`/materias-aprobadas?idCarrera=${idCarrera}`)
  return data.materias
}