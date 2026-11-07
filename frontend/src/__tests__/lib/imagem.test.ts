import { comprimirImagem, dimensoesReduzidas } from "@/lib/imagem";

describe("dimensoesReduzidas", () => {
  it("reduz o maior lado para 1600 mantendo a proporção", () => {
    expect(dimensoesReduzidas(4000, 3000)).toEqual({ largura: 1600, altura: 1200 });
    expect(dimensoesReduzidas(3000, 4000)).toEqual({ largura: 1200, altura: 1600 });
  });

  it("não amplia imagens pequenas", () => {
    expect(dimensoesReduzidas(800, 600)).toEqual({ largura: 800, altura: 600 });
  });
});

describe("comprimirImagem", () => {
  it("devolve o arquivo original quando o navegador não decodifica a imagem", async () => {
    const arquivo = new File(["x"], "foto.png", { type: "image/png" });
    // jsdom não tem createImageBitmap: cai no caminho de falha
    expect(await comprimirImagem(arquivo)).toBe(arquivo);
  });
});
