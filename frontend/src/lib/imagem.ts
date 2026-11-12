const LADO_MAX = 1600;
const QUALIDADE = 0.75;

/** Dimensões que cabem em `max` no maior lado, sem ampliar. */
export function dimensoesReduzidas(largura: number, altura: number, max = LADO_MAX) {
  const escala = Math.min(1, max / Math.max(largura, altura));
  return { largura: Math.round(largura * escala), altura: Math.round(altura * escala) };
}

/**
 * Reduz a foto (lado maior ~1600px, JPEG ~0.75) antes do envio: fotos de câmera passam do limite de 5 MB
 * do backend. Se algo falhar (formato não decodificável, sem canvas), devolve o arquivo original.
 */
export async function comprimirImagem(arquivo: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const { largura, altura } = dimensoesReduzidas(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALIDADE));
    // Só vale se encolheu: uma imagem já pequena não deve crescer ao reencodar.
    if (!blob || blob.size >= arquivo.size) return arquivo;
    return new File([blob], arquivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return arquivo;
  }
}
