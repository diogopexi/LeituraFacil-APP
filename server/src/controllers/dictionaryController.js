const dictionaryService = require("../services/dictionaryService");
const AppError = require("../utils/AppError");

const getWordDefinition = async (req, res, next) => {
    const word = req.params.word;
    try {
        const definitions = await dictionaryService.getWordDefinition(word);
        res.json({ word, definitions });
    }
    catch (err) {
        if (err.isOperational) return next(err);
        console.error("Erro inesperado no dicionário:", err);
        next(new AppError("Erro ao buscar significado", 502));
    }
};

module.exports = { getWordDefinition };