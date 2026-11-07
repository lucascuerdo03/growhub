// Cambios optimistas: la lista se actualiza al instante y, si Firestore falla,
// se revierte y se relanza el error para que la vista muestre el mensaje.

// `pendiente` marca el elemento mientras no tiene id real: aún no se puede editar.
export async function insertarOptimista(lista, item, guardar) {
  const tempId = `tmp-${Date.now()}-${Math.random()}`
  lista.value.unshift({ ...item, id: tempId, pendiente: true })
  try {
    const id = await guardar()
    const actual = lista.value.find((x) => x.id === tempId)
    if (actual) {
      actual.id = id
      actual.pendiente = false
    }
    return id
  } catch (e) {
    lista.value = lista.value.filter((x) => x.id !== tempId)
    throw e
  }
}

export async function quitarOptimista(lista, item, borrar) {
  const indice = lista.value.indexOf(item)
  lista.value = lista.value.filter((x) => x !== item)
  try {
    await borrar()
  } catch (e) {
    lista.value.splice(Math.min(indice, lista.value.length), 0, item)
    throw e
  }
}
