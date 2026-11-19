import { api } from './api'
import { armarQuery } from '../utils/query'

export const TAMANO_MAX_MB = 10
const TAMANO_MAX_BYTES = TAMANO_MAX_MB * 1024 * 1024
const MENSAJE_FORMATO = `Formato de archivo inválido. Solo se permiten archivos PDF de hasta ${TAMANO_MAX_MB} MB.`

export function validarArchivoPdf(archivo) {
  if (!archivo) return 'Debe adjuntar un archivo PDF.'
  const esPdf = archivo.type === 'application/pdf' && archivo.name.toLowerCase().endsWith('.pdf')
  if (!esPdf || archivo.size > TAMANO_MAX_BYTES) return MENSAJE_FORMATO
  return ''
}

export function cargarApunte({ idMateria, nombre, descripcion, archivo }) {
  const formData = new FormData()
  formData.append('idMateria', idMateria)
  formData.append('nombre', nombre)
  if (descripcion) formData.append('descripcion', descripcion)
  formData.append('archivo', archivo)
  return api.post('/apuntes', formData)
}

export function listarMisApuntes() {
  return api.get('/apuntes/mios')
}

export function eliminarApunte(id) {
  return api.delete(`/apuntes/${id}`)
}

// Devuelve { resultados: [{ id, idMateria, nombre, descripcion, materia, carrera, autor }],
//            paginacion: { pagina, limite, total, totalPaginas } }
export function buscarApuntes({ idMateria, idCarrera, q, page, limit } = {}) {
  return api.get(`/apuntes${armarQuery({ idMateria, idCarrera, q, page, limit })}`)
}

export async function descargarApunte(id, nombre) {
  const blob = await api.getBlob(`/apuntes/${id}/descargar`)
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `${nombre || `apunte-${id}`}.pdf`
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

// Abre el PDF en una pestaña nueva (con el visor de PDF del
// navegador). La pestaña se abre de una en el click: si
// esperamos a la respuesta del servidor, el navegador la
// bloquea como emergente.
export async function abrirApunte(id) {
  const pestaña = window.open('', '_blank')
  if (!pestaña) {
    throw new Error(
      'El navegador bloqueó la ventana. Permití las ventanas emergentes para este sitio.'
    )
  }

  try {
    const blob = await api.getBlob(`/apuntes/${id}/descargar`)
    // El blob conserva el Content-Type (application/pdf), así que
    // el navegador la muestra en su visor en vez de descargarla.
    // No se revoca la URL: la pestaña nueva la sigue usando.
    pestaña.location = URL.createObjectURL(blob)
  } catch (err) {
    pestaña.close()
    throw err
  }
}
