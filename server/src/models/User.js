const mongoose = require("mongoose");

const TextoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  conteudo: { type: String, required: true },
  ultimoAcesso: {
    type: Date,
    default: Date.now
  }
});

const ConfigSchema = new mongoose.Schema({
  espacoLinha: Number,
  espacoPalavra: Number,
  espacoLetra: Number,
  tamanhoFonte: Number,
  corFundo: String,
  corFonte: String,
  corDestaque: String,
  velocidadeVoz: Number,
  nomeFonte: String
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  hashSenha: { type: String, required: true },
  nome: { type: String, required: true },
  configs: ConfigSchema,
  textos: [TextoSchema]
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);