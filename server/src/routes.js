const router = require("express").Router();
const userController = require("./controllers/userController");
const readController = require("./controllers/readController");
const dictionaryController = require("./controllers/dictionaryController");
const authMiddleware = require("./middleware/auth");

// Usuários
router.post("/users", userController.createUser);
router.post("/login", userController.login);
router.get("/users/:id", authMiddleware, userController.getUser);
router.put("/users/:id/configs", authMiddleware, userController.updateConfigs);
router.post("/users/:id/textos", authMiddleware, userController.addTexto);
router.get("/users/:id/textos", authMiddleware, userController.getTextos);
router.get("/users/:userId/textos/:textoId", authMiddleware, userController.getTexto);
router.put("/users/:userId/textos/:textoId", authMiddleware, userController.updateTexto);
router.delete("/users/:userId/textos/:textoId", authMiddleware, userController.deleteTexto);

// Parse do texto
router.post("/read", readController.parseText);

// Dicionário
router.get("/word/:word", dictionaryController.getWordDefinition);

module.exports = router;