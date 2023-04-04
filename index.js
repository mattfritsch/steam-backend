const express = require('express');
const app = express();
const gamesController = require('./routes/games');
const usersController = require('./routes/users');
const bodyParser = require('body-parser');
const cors = require('cors');

app.listen(8080, () => {    console.log("Serveur à l'écoute")})

app.use(cors()); // utilise le middleware cors
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//GET : récupère la liste des jeux en utilisant la pagination (from et size)
app.get('/games/from/:from/size/:size', gamesController.getGamesByPagination);
//GET : récupère un jeu en utilisant son id
app.get('/games/:id', gamesController.getGameById);
//GET : récupère la liste des jeux en utilisant la pagination (from et size) et le tri (field : champs à trier et order: ordre du tri)
app.get('/games/from/:from/size/:size/field/:field/order/:order', gamesController.getGamesByPaginationAndSort);
//GET : récupère la liste des jeux en utilisant la pagination (from et size) et la recherche (search)
app.get('/games/size/:size/search/:search', gamesController.searchGames);

//POST : enregistre un utilisateur
app.post('/user/register', usersController.registerUser);
//POST : connecte un utilisateur et renvoie un token de connexion pour l'utilisateur
app.post('/user/login', usersController.loginUser);
//POST : ajoute un jeu à la liste des favoris d'un utilisateur
app.post('/user/add/favorite/:id', usersController.addFavorite);
//POST : supprime un jeu de la liste des favoris d'un utilisateur
app.post('/user/remove/favorite/:id', usersController.removeFavorite);
//GET : récupère la liste des favoris d'un utilisateur
app.get('/user/favorites', usersController.getFavorites);

