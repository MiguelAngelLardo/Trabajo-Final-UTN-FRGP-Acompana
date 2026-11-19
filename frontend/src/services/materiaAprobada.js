import { api } from './api'

export function listarMateriasAprobadas(idCarrera) {
  const params = new URLSearchParams()
  if (idCarrera) params.set('idCarrera', idCarrera)
  return api.get(`/materias-aprobadas?${params}`)
}

export function listarMateriasDisponibles(idCarrera) {
  const params = new URLSearchParams()
  if (idCarrera) params.set('idCarrera', idCarrera)
  return api.get(`/materias-aprobadas/disponibles?${params}`)
}

export function registrarMateriaAprobada(idMateria) {
  return api.post('/materias-aprobadas', { idMateria })
}
