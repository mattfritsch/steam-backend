const client = require("../config/elasticsearch-client");

const createIndex = async () => {
    try {
        await client.indices.create({
            index: 'steam_games'
        });
        console.log("Index créé avec succès");
    } catch (err) {
        console.error("Erreur lors de la création de l'index", err);
    }
}
const mapping = async () => {
    try {
        await createIndex();
        await client.indices.putMapping({
            index: 'steam_games',
            body: {
                properties: {
                    id: {
                        type: 'integer',
                    },
                    website: {
                        type: 'text',
                    },
                    support_url: {
                        type: 'text',
                    },
                    support_email: {
                        type: 'text',
                    },
                    name: {
                        type: 'text',
                        fields: {
                            keyword: {
                                type: 'keyword',
                            }
                        }
                    },
                    developer: {
                        type: 'keyword',
                    },
                    publisher: {
                        type: 'keyword',
                    },
                    platforms: {
                        type: 'text',
                    },
                    required_age: {
                        type: 'integer',
                    },
                    categories: {
                        type: 'text',
                    },
                    genres: {
                        type: 'text',
                    },
                    steamspy_tags: {
                        type: 'text',
                    },
                    achievements: {
                        type: 'integer',
                    },
                    positive_ratings: {
                        type: 'integer',
                    },
                    negative_ratings: {
                        type: 'integer',
                    },
                    average_playtime: {
                        type: 'integer',
                    },
                    median_playtime: {
                        type: 'integer',
                    },
                    owners: {
                        type: 'text',
                    },
                    price: {
                        type: 'double',
                    },
                    pc_requirements: {
                        type: 'text',
                    },
                    mac_requirements: {
                        type: 'text',
                    },
                    linux_requirements: {
                        type: 'text',
                    },
                    minimum: {
                        type: 'text',
                    },
                    recommended: {
                        type: 'text',
                    },
                    screenshots: {
                        type: 'text',
                    },
                    background: {
                        type: 'text',
                    },
                    movies: {
                        type: 'text',
                    },
                    detailed_description: {
                        type: 'text',
                    },
                    about_the_game: {
                        type: 'text',
                    },
                    short_description: {
                        type: 'text',
                    }
                },
            },
        });
        console.log('Mapping créé avec succès');
    } catch (error) {
        console.error(error);
    }
}

module.exports = mapping;