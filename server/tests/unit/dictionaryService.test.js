const { getWordDefinition } = require("../../src/services/dictionaryService");

jest.mock("axios");

describe("DictionaryService", () => {
  describe("normalize", () => {
    const { DictionaryService } = require("../../src/services/dictionaryService");

    it("remove acentos de palavras com ç e til", () => {
      expect(DictionaryService.normalize("coração")).toBe("coracao");
    });

    it("remove acento agudo", () => {
      expect(DictionaryService.normalize("ação")).toBe("acao");
    });

    it("remove acento grave", () => {
      expect(DictionaryService.normalize("à")).toBe("a");
    });

    it("remove acento circunflexo", () => {
      expect(DictionaryService.normalize("você")).toBe("voce");
    });

    it("remove trema", () => {
      expect(DictionaryService.normalize("pingüim")).toBe("pinguim");
    });

    it("retorna string vazia para entrada vazia", () => {
      expect(DictionaryService.normalize("")).toBe("");
    });

    it("mantém palavras sem acento inalteradas", () => {
      expect(DictionaryService.normalize("palavra")).toBe("palavra");
    });

    it("remove múltiplos acentos", () => {
      expect(DictionaryService.normalize("órgão")).toBe("orgao");
    });
  });
});
