import { orcamentoEditavel } from "@/lib/orcamentoStatus";

describe("orcamentoEditavel", () => {
  it("trava orçamento aprovado e o alias concluido", () => {
    expect(orcamentoEditavel("aprovado")).toBe(false);
    expect(orcamentoEditavel("concluido")).toBe(false);
  });

  it("libera os demais status", () => {
    for (const s of ["em_elaboracao", "pendente", "recusado", "cancelado", null, undefined]) {
      expect(orcamentoEditavel(s)).toBe(true);
    }
  });
});
