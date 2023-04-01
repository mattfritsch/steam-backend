const express = require('express');
const app = express();

const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node: 'http://localhost:9200' })

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
                            should: [
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
                                            max_expansions: 50
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
app.listen(8080, () => {    console.log("Serveur à l'écoute")})

