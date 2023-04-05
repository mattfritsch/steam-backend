const client = require('../config/elasticsearch-client');

const getGamesByPagination = async (req, res) => {
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

const getGameById = async (req, res) => {
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
};

const getGamesByPaginationAndSort = async (req, res) => {
    try{
        const from = parseInt(req.params.from);
        const size = parseInt(req.params.size);
        let field = req.params.field;
        if(field === "name"){
            field = "name.keyword";
        }
        const order = req.params.order;
        const response = await client.search({
            index: 'steam_games',
            from: from,
            size: size,
            body: {
                sort: [
                    {
                        [field]: {
                            order: order,
                        }
                    }
                ],
                query: {
                    "match_all": {},
                },
                ...(req.params.field === "release_date" ? {
                    sort: [
                        {
                            [field]: {
                                order: order,
                                unmapped_type: "date",
                                format: "yyyy-MM-dd"
                            }
                        }
                    ]
                } : {})
            }
        })
        res.send(response.hits.hits)
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

const searchGames = async (req, res) => {
    try{
        const search = req.params.search;
        const from = parseInt(req.params.from);
        const size = parseInt(req.params.size);
        const response = await client.search({
            index: 'steam_games',
            from: from,
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
};

module.exports = {
    getGamesByPagination,
    getGameById,
    getGamesByPaginationAndSort,
    searchGames
};