// Arma "?a=1&b=2" omitiendo valores vacíos
export function armarQuery(params) {
    // Codifica los caracteres especiales (%, &, espacios, tildes) 
    // // vía URLSearchParams, así que un q con % llega bien al backend.
    // .
  const qs = new URLSearchParams()
  for (const [clave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      qs.append(clave, valor)
    }
  }
  const texto = qs.toString()
  return texto ? `?${texto}` : ''
}