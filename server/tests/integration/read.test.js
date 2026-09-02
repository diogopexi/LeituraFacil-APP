const request = require("supertest");
const app = require("../../src/app");

describe("POST /api/read", () => {
  it("retorna tokens para texto simples", async () => {
    const res = await request(app)
      .post("/api/read")
      .send({ text: "Olá mundo" })
      .expect(200);

    expect(res.body).toEqual([
      { index: 0, text: "Olá", isWord: true },
      { index: 3, text: " ", isWord: false },
      { index: 4, text: "mundo", isWord: true },
    ]);
  });

  it("retorna array vazio para texto vazio", async () => {
    const res = await request(app)
      .post("/api/read")
      .send({ text: "" })
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it("retorna array vazio quando campo text não enviado", async () => {
    const res = await request(app)
      .post("/api/read")
      .send({})
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it("separa pontuação corretamente", async () => {
    const res = await request(app)
      .post("/api/read")
      .send({ text: "Olá, mundo!" })
      .expect(200);

    expect(res.body).toEqual([
      { index: 0, text: "Olá", isWord: true },
      { index: 3, text: ",", isWord: false },
      { index: 4, text: " ", isWord: false },
      { index: 5, text: "mundo", isWord: true },
      { index: 10, text: "!", isWord: false },
    ]);
  });
});
