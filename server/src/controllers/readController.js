const AppError = require("../utils/AppError");

const parseText = (req, res, next) => {
    try {
        const text = req.body.text || '';

        const segmenter = new Intl.Segmenter("pt-BR", { granularity: "word" });

        const tokens = [...segmenter.segment(text)].map((token) => ({
            index: token.index,
            text: token.segment,
            isWord: token.isWordLike,
        }));

        res.json(tokens);
    } catch (err) {
        console.error("Erro ao processar texto:", err);
        next(new AppError("Erro ao processar o texto", 400));
    }
};

module.exports = { parseText };