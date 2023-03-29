const express = require('express');
const app = express();

const { Client } = require('@elastic/elasticsearch')
const {query, response} = require("express");
const client = new Client({ node: 'http://localhost:9200' })

app.get(
    '/games',
    async (req, res) => {
        try{
            const response = await client.search({
                index: 'steam_games',
                size: 50,
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
            const { id } = req.params;
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
    '/games/sort/:field/:orderBy',
    async (req, res) => {
        try{
            const {field} = '"' + req.params.field + '.keyword' + '"';
            const {orderBy} = req.params.orderBy;
            const response = await client.search({
                index: 'steam_games',
                body: {
                    size: 50,
                    sort: [{ field : {"order": orderBy} }],
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

app.listen(8080, () => {    console.log("Serveur à l'écoute")})

