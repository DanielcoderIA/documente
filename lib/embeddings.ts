// lib/embeddings.ts

/**
 * Genera un embedding vectorial de 384 dimensiones utilizando un algoritmo 
 * TF-IDF hash local en JavaScript puro.
 * No consume APIs externas ni requiere dependencias nativas complejas.
 *
 * @param texto Texto del cual se extraerá el vector 
 * @returns Array de 384 flotantes normalizados
 */
export function generarEmbeddingLocal(texto: string): number[] {
  // Limpieza inicial: minúsculas, elimina caracteres especiales y separa en array
  const palabras = texto.toLowerCase()
    .replace(/[^a-záéíóúñ0-9\s]/g, " ")
    .split(/\s+/)
    .filter(p => p.length > 2);

  // Inicializa el tensor de 384 dimensiones en 0
  const vector = new Array(384).fill(0);
  
  // Algoritmo de Hashing: DJB2 variante adaptada para distribución rápida
  for (const palabra of palabras) {
    let hash = 0;
    for (let i = 0; i < palabra.length; i++) {
      hash = ((hash << 5) - hash) + palabra.charCodeAt(i);
      hash = hash & hash; // Convertir a entero de 32bits
    }
    
    // Asignación en el grid vectorial basado en módulo
    const idx = Math.abs(hash) % 384;
    vector[idx] += 1; // Incremento de frecuencia
  }
  
  // Normalización L2 (Magnitud euclidiana a 1)
  const magnitud = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitud === 0) return vector;
  
  return vector.map(v => v / magnitud);
}
