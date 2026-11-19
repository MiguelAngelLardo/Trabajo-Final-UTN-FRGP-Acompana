export function formatearFecha(fecha) {
  if (!fecha) return ''
  const [anio, mes, dia] = String(fecha).slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}
