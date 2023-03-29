function client(){
    const { Client } = require('@elastic/elasticsearch');
    // Adresse du serveur Elasticsearch
    return new Client({node: 'http://localhost:9200'});
}

exports.client = client;