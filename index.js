const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const dotenv = require('dotenv');
dotenv.config();

app.get(
    '/games/from/:from/size/:size',
    async (req, res) => {
        const from = parseInt(req.params.from);
        const size = parseInt(req.params.size);
        try{
            const response = await client.search({
                index: 'steam_games',
                from: from,
                size: size,
                body: {
                    query: {
                        "match_all": {}
                    }
                }
            })
            res.send(response.hits.hits)
        } catch (error) {
            console.error(error);
            res.status(500).send(error.message);
        }
    }
)

app.get(
    '/games/get/:id',
    async (req, res) => {
        try{
            const id = req.params.id;
            const response = await client.get({
                index: 'steam_games',
                id
            });
            res.send(response)
        }
        catch (error){
            console.error(error);
            res.status(500).send(error.message);
        }
    }
)

app.get(
    '/games/from/:from/size/:size/sort/:field/order/:order',
    async (req, res) => {
        try{
            const from = parseInt(req.params.from);
            const size = parseInt(req.params.size);
            const field = req.params.field + '.keyword';
            const order = req.params.order;
            const response = await client.search({
                index: 'steam_games',
                from: from,
                size: size,
                body: {
                    sort: [{[field]: {order: order}}],
                    query: {
                        "match_all": {},
                    },
                }
            })
            res.send(response.hits.hits)
        } catch (error) {
            console.error(error);
            res.status(500).send(error.message);
        }
    }
)

app.get(
    '/games/from/:from/size/:size/search/:search',
    async (req, res) => {
        try{
            const search = req.params.search;
            const size = parseInt(req.params.size);
            const response = await client.search({
                index: 'steam_games',
                size: size,
                body: {
                    query: {
                        bool: {
                            must: [
                                {
                                    match: {
                                        name: {
                                            query: search,
                                            fuzziness: "AUTO"
                                        }
                                    }
                                },
                                {
                                    match_phrase_prefix: {
                                        name: {
                                            query: search,
                                            max_expansions: 10
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            })
            res.send(response.hits.hits)
        } catch (error) {
            console.error(error);
            res.status(500).send(error.message);
        }
    }
)

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.post(
    '/user/register',
    async (req, res) => {
        try {
            const schema = Joi.object({
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
                    username,
                    mail,
                    hashedPassword,
                    favorite: []
                },
            });

            res.send('Compte créé avec succès');
        }
        catch (error) {
            console.error(error);
            res.status(500).send(error.message);
        }
    }
);

app.post(
    '/user/login',
    async (req, res) => {
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

            const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' });

            res.send({ token });
        }
        catch (error) {
            console.error(error);
            res.status(500).send(error.message);
        }
    }
)


app.listen(8080, () => {    console.log("Serveur à l'écoute")})
