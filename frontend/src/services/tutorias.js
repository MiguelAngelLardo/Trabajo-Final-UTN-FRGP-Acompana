import { api } from './api'

export function buscarTutores({ carrera, materia }) {
  const params = new URLSearchParams()
  if (carrera) params.set('carrera', carrera)
  if (materia) params.set('materia', materia)
  return api.get(`/tutores?${params}`)
}

export function solicitarTutoria(dniTutor, idMateria, { medioContacto, apoyo } = {}) {
  return api.post('/solicitudes', { dniTutor, idMateria, medioContacto, apoyo })
}

export function postularmeComoTutor(materias, descripcion) {
  return api.post('/tutorias/postulaciones', { materias, descripcion })
}

export function obtenerSolicitudesRecibidas(estado) {
  return api.get(estado ? `/solicitudes/recibidas?estado=${estado}` : '/solicitudes/recibidas')
}

export function responderSolicitud(idSolicitud, decision) {
  return api.patch(`/solicitudes/${idSolicitud}`, { decision })
}

export async function obtenerAvisos() {
  const data = await api.get('/solicitudes/avisos')
  return data.avisos
}
