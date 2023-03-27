const fs = require('fs');
const csv = require('fast-csv');
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' }); // Adresse du serveur Elasticsearch

const files = ['../csv/steam.csv', '../csv/steam_description_data.csv', '../csv/steam_requirements_data.csv','../csv/steam_support_info.csv', '../csv/steam_media_data.csv']; // Liste des fichiers à traiter
let results = {}; // Objet pour stocker les résultats

// Fonction pour traiter chaque fichier CSV
async function processFile(file) {
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(file);
        let idFieldName = 'steam_appid'; // nom de l'ID par défaut

        if (file === '../csv/steam.csv') {
            idFieldName = 'appid'; // nom de l'ID pour le fichier steam.csv
        }

        csv.parseStream(stream, { headers: true })
            .on('data', (data) => {
                const id = data[idFieldName];
                delete data[idFieldName];

                if (results[id]) {
                    Object.assign(results[id], data);
                } else {
                    results[id] = data;
                }
            })
            .on('end', () => {
                resolve();
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}

// Fonction pour traiter tous les fichiers en parallèle
async function processFiles() {
    await Promise.all(files.map(processFile));

    // Convertit l'objet des résultats en un tableau trié par ID croissant
    const sortedResults = Object.entries(results)
        .map(([id, data]) => ({ id: id, ...data }))
        .sort((a, b) => parseInt(a.id) - parseInt(b.id));

    // Afficher les résultats
    console.log(sortedResults);
    return sortedResults;
}

async function indexData() {
    // Appel de la fonction pour traiter les fichiers CSV
    const results = await processFiles();

    // Indexe chaque objet dans Elasticsearch
    for (const result of results) {
        await client.index({
            index: 'steam_games',
            body: result
        });
    }
    console.log('Données indexées dans Elasticsearch');
}

// Appel de la fonction principale
indexData();