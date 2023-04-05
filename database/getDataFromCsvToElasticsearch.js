const fs = require('fs');
const csv = require('fast-csv');
const client = require('../config/elasticsearch-client');
const bcrypt = require('bcrypt');
const utils = require("../utils/utils");
const mapping = require("./mapping");

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

                // Convertit les champs numériques en nombres
                for (const [key, value] of Object.entries(data)) {
                    if (!isNaN(value)) {
                        data[key] = Number(value);
                    }
                }

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
    await mapping();
    // Appel de la fonction pour traiter les fichiers CSV
    const results = await processFiles();

    // Indexe chaque objet dans Elasticsearch
    for (const result of results) {
        await client.index({
            index: 'steam_games',
            body: result
        });
    }
    console.log('Données indexées dans Elasticsearch !');

    // Ajoute deux utilisateurs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('mdp123', salt);
    await client.index({
        index: 'users',
        body: {
            id: utils.randomId(),
            username: 'matthieu',
            mail: 'mattfritsch@gmail.com',
            hashedPassword: hashedPassword,
            favorites: []
        }
    });
    await client.index({
        index: 'users',
        body: {
            id: utils.randomId(),
            username: 'noe',
            mail: 'noecarl@gmail.com',
            hashedPassword: hashedPassword,
            favorites: []
        }
    });
    console.log('Deux utilisateurs ont été ajoutés à l\'index users');
}

// Appel de la fonction principale
indexData();
