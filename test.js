const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

async function searchIndex() {
    const { body } = await client.search({
        index: 'steam_games',
        size: 1000,
        body: {
            query: {
                query_string: {
                    query: "*"
                }
            },
        }
    });

    if (body.hits) {
        console.log(body.hits.hits);
    } else {
        console.log('Aucun résultat trouvé');
    }
}

searchIndex()