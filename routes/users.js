const client = require('../config/elasticsearch-client');
const utils = require('../utils/utils');

const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const dotenv = require('dotenv');
dotenv.config();

const registerUser = async (req, res) => {
    try {
        const schema = Joi.object({
            id: Joi.string(),
            username: Joi.string().required(),
            mail: Joi.string().email().required(),
            password: Joi.string().required(),
            favorite: Joi.array().items(Joi.object())
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        const { username, mail, password } = req.body;

        const indexExists = await client.indices.exists({ index: 'users' });
        if (!indexExists) {
            await client.indices.create({ index: 'users' });
        }

        const usernameExists = await client.search({
            index: 'users',
            body: {
                query: {
                    match: { username }
                }
            }
        });
        if (usernameExists.hits.total.value > 0) {
            return res.status(400).send('Un utilisateur avec ce nom d\'utilisateur existe déjà.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const response = await client.index({
            index: 'users',
            body: {
                id: utils.randomId(),
                mail: mail,
                username: username,
                hashedPassword: hashedPassword,
                favorites: []
            },
        });

        res.send('Compte créé avec succès');
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
}

const loginUser = async (req, res) => {
    try {
        const {username, password} = req.body;

        if (!password || password.trim().length === 0) {
            return res.status(400).send('Mot de passe invalide');
        }

        const body  = await client.search({
            index: 'users',
            body: {
                query: {
                    match: {
                        username: username
                    }
                }
            }
        });


        if (body.hits.total.value === 0) {
            return res.status(400).send('Nom d\'utilisateur incorrect');
        }

        const user = body.hits.hits[0]._source;
        const passwordIsValid = await bcrypt.compare(password, user.hashedPassword);
        if(!passwordIsValid) {
            return res.status(400).send('Mot de passe incorrect');
        }

        const token = jwt.sign({ id: body.hits.hits[0]._id }, process.env.TOKEN_SECRET, { expiresIn: '1h' });

        res.send({ token });
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
}

const addFavorite = async (req, res) => {
    try {
        const userId = utils.getCurrentUserId(req);

        // Récupérer le jeu Steam avec l'id passé en paramètre
        const gameId = req.params.id;

        if (!gameId) {
            return res.status(400).send('ID de jeu manquant');
        }

        const game = await client.get({
            index: 'steam_games',
            id: gameId
        });

        // Vérifier que le jeu existe
        if (!game.found) {
            return res.status(404).send('Jeu introuvable');
        }

        const response = await client.update({
            index: 'users',
            id: userId,
            body: {
                script: {
                    source: "if (!ctx._source.favorites.contains(params.game)) { ctx._source.favorites.add(params.game) }",
                    lang: "painless",
                    params: {
                        game: {
                            _id: game._id,
                            _source: game._source
                        }
                    }
                }
            }
        });

        res.send('Jeu ajouté aux favoris');
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
}

const removeFavorite = async (req, res) => {
    try {
        // Récupérer l'utilisateur couramment connecté à partir du token JWT
        const userId = utils.getCurrentUserId(req);

        // Récupérer le jeu Steam avec l'id passé en paramètre
        const gameId = req.params.id;

        if (!gameId) {
            return res.status(400).send('ID de jeu manquant');
        }

        const game = await client.get({
            index: 'steam_games',
            id: gameId
        });

        // Vérifier que le jeu existe
        if (!game.found) {
            return res.status(404).send('Jeu introuvable');
        }

        const response = await client.update({
            index: 'users',
            id: userId,
            body: {
                script: {
                    source: "if (ctx._source.favorites.contains(params.game)) { ctx._source.favorites.remove(ctx._source.favorites.indexOf(params.game)) }",
                    lang: "painless",
                    params: {
                        game: {
                            _id: game._id,
                            _source: game._source
                        }
                    }
                }
            }
        });

        res.send('Jeu retiré des favoris');
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
}

const getFavorites = async (req, res) => {
    try {
        const userId = utils.getCurrentUserId(req);

        const response = await client.get({
            index: 'users',
            id: userId
        });

        if (!response.found) {
            return res.status(404).send('Utilisateur introuvable');
        }

        const favorites = response._source.favorites;

        res.send(favorites);
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
}

module.exports = {
    registerUser,
    loginUser,
    addFavorite,
    removeFavorite,
    getFavorites
};