export function mensajeDeError(err) {
  if (err.details?.length) return err.details.join('. ')
  return err.message
}
