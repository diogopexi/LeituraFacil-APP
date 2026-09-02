const bcrypt = require("bcrypt");
const User = require("../models/User");
const AppError = require("../utils/AppError");

const findUserOrThrow = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("Usuário não encontrado", 404);
  return user;
};

//
// 👤 Criar usuário
//
const createUser = async ({ email, senha, nome }) => {
  try {
    const hashSenha = await bcrypt.hash(senha, 10);

    const user = new User({
      email,
      hashSenha,
      nome,
      configs: {
        espacoLinha: 1.6,
        espacoPalavra: 0,
        espacoLetra: 0,
        tamanhoFonte: 1.6,
        corFundo: "#d6c8bd",
        corFonte: "#2E2E2E",
        corDestaque: "#ffdc32",
        velocidadeVoz: 1,
        nomeFonte: "Arial"
      },
      textos: []
    });

    return user.save();
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError("Este e-mail já está cadastrado", 400);
    }
    if (err.name === "ValidationError") {
      const campos = Object.keys(err.errors).join(", ");
      throw new AppError(`Dados inválidos: ${campos}`, 400);
    }
    throw err;
  }
};

//
// 🔑 Login
//
const login = async ({ email, senha }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("Usuário não encontrado", 401);

  const match = await bcrypt.compare(senha, user.hashSenha);
  if (!match) throw new AppError("Senha inválida", 401);

  return user;
};

//
// 🔍 Buscar usuário
//
const getUserById = async (id) => {
  return findUserOrThrow(id);
};

//
// ⚙️ Atualizar configs
//
const updateConfigs = async (id, configs) => {
  await findUserOrThrow(id);
  return User.findByIdAndUpdate(
    id,
    { configs },
    { new: true }
  );
};

//
// 📚 Criar texto
//
const addTexto = async (userId, { titulo, conteudo }) => {
  const user = await findUserOrThrow(userId);

  user.textos.push({ titulo, conteudo });
  await user.save();

  return user.textos[user.textos.length - 1];
};

//
// 📄 Listar textos
//
const getTextos = async (userId) => {
  const user = await User.findById(userId, { 'textos.conteudo': 0 });
  return user.textos;
};

//
// ✏️ Atualizar texto
//
const updateTexto = async (userId, textoId, data) => {
  const user = await findUserOrThrow(userId);
  const texto = user.textos.id(textoId);

  if (!texto) throw new AppError("Texto não encontrado", 404);

  texto.titulo = data.titulo ?? texto.titulo;
  texto.conteudo = data.conteudo ?? texto.conteudo;
  texto.ultimoAcesso = new Date();

  await user.save();
  return texto;
};

//
// ❌ Remover texto
//
const deleteTexto = async (userId, textoId) => {
  const user = await findUserOrThrow(userId);

  const texto = user.textos.id(textoId);
  if (!texto) throw new AppError("Texto não encontrado", 404);

  texto.remove();
  await user.save();
};

const getTexto = async (userId, textoId) => {
  const user = await findUserOrThrow(userId);
  const texto = user.textos.id(textoId);
  if (!texto) throw new AppError("Texto não encontrado", 404);
  return texto;
};

module.exports = {
  createUser,
  login,
  getUserById,
  updateConfigs,
  addTexto,
  getTextos,
  getTexto,
  updateTexto,
  deleteTexto
};