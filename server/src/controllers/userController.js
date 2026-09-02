const userService = require("../services/userService");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const handleError = (err, next) => {
  if (err.isOperational) return next(err);
  console.error("Erro inesperado no controller de usuário:", err);
  next(new AppError("Erro interno do servidor", 500));
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    handleError(err, next);
  }
};

const login = async (req, res, next) => {
  try {
    const user = await userService.login(req.body);
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    handleError(err, next);
  }
};

const getUser = async (req, res, next) => {
  try {
    if (!req.userId || req.userId !== req.params.id) return res.status(403).json({ erro: 'Acesso negado' });
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    handleError(err, next);
  }
};

const updateConfigs = async (req, res, next) => {
  try {
    if (!req.userId || req.userId !== req.params.id) return res.status(403).json({ erro: 'Acesso negado' });
    const user = await userService.updateConfigs(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    handleError(err, next);
  }
};

const addTexto = async (req, res, next) => {
  try {
    if (!req.userId || req.userId !== req.params.id) return res.status(403).json({ erro: 'Acesso negado' });
    const textos = await userService.addTexto(req.params.id, req.body);
    res.json(textos);
  } catch (err) {
    handleError(err, next);
  }
};

const getTextos = async (req, res, next) => {
  try {
    if (!req.userId || req.userId !== req.params.id) return res.status(403).json({ erro: 'Acesso negado' });
    const textos = await userService.getTextos(req.params.id);
    res.json(textos);
  } catch (err) {
    handleError(err, next);
  }
};

const updateTexto = async (req, res, next) => {
  try {
    if (!req.userId || req.userId !== req.params.userId) return res.status(403).json({ erro: 'Acesso negado' });
    const texto = await userService.updateTexto(
      req.params.userId,
      req.params.textoId,
      req.body
    );
    res.json(texto);
  } catch (err) {
    handleError(err, next);
  }
};

const getTexto = async (req, res, next) => {
  try {
    if (!req.userId || req.userId !== req.params.userId) return res.status(403).json({ erro: 'Acesso negado' });
    const texto = await userService.getTexto(req.params.userId, req.params.textoId);
    res.json(texto);
  } catch (err) {
    handleError(err, next);
  }
};

const deleteTexto = async (req, res, next) => {
  try {
    if (!req.userId || req.userId !== req.params.userId) return res.status(403).json({ erro: 'Acesso negado' });
    await userService.deleteTexto(
      req.params.userId,
      req.params.textoId
    );
    res.json({ message: "Texto removido" });
  } catch (err) {
    handleError(err, next);
  }
};

module.exports = {
  createUser,
  login,
  getUser,
  updateConfigs,
  addTexto,
  getTextos,
  getTexto,
  updateTexto,
  deleteTexto
};