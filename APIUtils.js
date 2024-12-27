import axios from 'axios';
import {Game} from './Game.js';
import dotenv from 'dotenv';

dotenv.config();

let nbErreur = 0;
let AppidErreur = [];

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const user = "76561198966626304";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
} 

async function getSteamProfile() {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`;

  try {
    const response = await axios.get(url, {
      params: {
        key: STEAM_API_KEY,
        steamids: user,
      },
    });

    console.log('Réponse API Steam :', response.data.response);
  } catch (error) {
    console.error('Erreur lors de la requête Steam API:', error.message);
    console.error('Détails:', error.response?.data || error);
  }
}

async function getAllGames() {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`;

    try {
        const response = await axios.get(url, {
            params: {
                key: STEAM_API_KEY,
                steamid: user,
                include_appinfo: 1,
                include_played_free_games: 1,
            },
        });

        const games = response.data.response.games || [];

        const appIds = games.map(game => game.appid);
        const playtime = games.map(game => game.playtime_forever / 60);

        let gamesList = [];

        for (let i = 0; i < appIds.length; i++) {
          await delay(4000); 
          let name = await getGameName(appIds[i]);
          let price = await getGamePrice(appIds[i]);

          if (price > 75) {
            nbErreur++;
          }


          if (name != null | price != null) {
            gamesList.push(new Game(appIds[i], name, price, playtime[i]));
          } else {
            console.log("Le jeux n'a pas pus être récuperer !!!");
            nbErreur++;
            AppidErreur.push(appIds[i]);
          }

          console.clear();
          getAvancement(appIds.length, i);
        }

        return gamesList;
    } catch (error) {
        console.error('Erreur lors de la requête Steam API:', error.message);
        console.error('Détails:', error.response?.data || error);
    }
}

async function getGamePrice(appid) {
  const url = 'https://store.steampowered.com/api/appdetails';
  
  try {
    const response = await axios.get(url, {
      params: {
        appids: appid
      },
    });

    
    const data = response.data[appid];
    if (data.success) {
      const priceInfo = data.data.price_overview || null;

      return priceInfo ? priceInfo.final /100 : 0;
    }
    

  } catch (error) {
  }
}

async function getGameName(appid) {
    const url = 'https://store.steampowered.com/api/appdetails';
  
    try {
      const reponse = await axios.get(url, {
        params: {
          appids: appid
        },
      });
  
      return reponse.data[appid].data.name;
    } catch (error) {}
  }
  
function Playtime(games) {
    let playtime = 0;
  
    for (let i = 0; i < games.length; i++) {
      playtime += games[i].tmpsDeJeu;
    }
  
    return playtime;
}

function getAllPrices(games) {
    let price = 0;
  
    for (let i = 0; i < games.length; i++) {
      price += games[i].prix;
    }
  
    return price;
  }

  function getAvancement(size, position) {
    console.log(position + 1, ' sur ', size);
    let pourcentage = ((position + 1) / size) * 100;
    console.log(pourcentage, '%');
    let chaineAvancement = "";
     
    for (let i = 0; i < parseInt(pourcentage, 10); i++) {
      chaineAvancement += '█';
    }
     
    for (let i = 0; i < (100 - parseInt(pourcentage, 10)); i++) {
      chaineAvancement += ' ';
    }

    console.log(size);
    console.log('[', chaineAvancement, ']');
}

async function isNewGames(existingGames) {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`;

    try {
        const response = await axios.get(url, {
            params: {
                key: STEAM_API_KEY,
                steamid: user,
                include_appinfo: 1,
                include_played_free_games: 1,
            },
        });

        // Récupération des jeux existants depuis Steam
        const steamGames = response.data.response.games || [];
        const steamAppIds = steamGames.map(game => game.appid);

        // Identifier les nouveaux jeux (non présents dans `existingGames`)
        const existingAppIds = existingGames.map(game => game.appid);
        const newGameAppids = steamAppIds.filter(appid => !existingAppIds.includes(appid));

        console.log(newGameAppids.length, 'nouveau(x) jeu(x).');

        if (newGameAppids.length > 0) {
            console.log('Ajout des nouveau(x) jeu(x)...');

            let gamesList = [];

            for (let i = 0; i < newGameAppids.length; i++) {
                await delay(3000); // Attente pour éviter le spam de l'API
                const appid = newGameAppids[i];

                const name = await getGameName(appid);
                const price = await getGamePrice(appid);
                const playtime = steamGames.find(game => game.appid === appid)?.playtime_forever / 60 || 0;

                if (name != null && price != null && price < 75) {
                    gamesList.push(new Game(appid, name, price, playtime));
                } else {
                    console.log(`Le jeu avec appid ${appid} n'a pas pu être récupéré.`);
                    nbErreur++;
                    AppidErreur.push(newGameAppids[i]);
                }

                console.clear();
                getAvancement(newGameAppids.length, i);
            }

            return gamesList;
        } else {
            console.log('Aucun nouveau jeu trouvé.');
            return [];
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des jeux :', error.message);
    }
}

async function updatePlaytime(existingGames) {
    const url = 'https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/';

    try {
        // Récupérer les jeux récemment joués via l'API Steam
        const response = await axios.get(url, {
            params: {
                key: STEAM_API_KEY,
                steamid: user,
            },
        });

        const recentGames = response.data.response.games || []; // Jeux récemment joués

        // Mettre à jour les temps de jeu pour les jeux existants
        for (const recentGame of recentGames) {
            const matchingGame = existingGames.find(game => game.appid === recentGame.appid);
            if (matchingGame) {
                matchingGame.tmpsDeJeu = recentGame.playtime_forever / 60; // Temps de jeu en heures
            }
        }

        return existingGames; // Retourner la liste mise à jour
    } catch (error) {
        console.error('Erreur lors de la mise à jour des temps de jeu :', error.message);
        return existingGames; // Retourner les jeux existants même en cas d'erreur
    }
}

function getAveragePrice(games) {
  let prices = 0;

  for (let i = 0; i < games.length; i++) {
    prices += games[i].prix;
  }

  return prices / games.length;
}

function getAveragePlaytime(games) {
  let playtime = 0;

  for (let i = 0; i < games.length; i++) {
    playtime += games[i].tmpsDeJeu;
  }

  return playtime / games.length;
}

function getMostPlayedGame(games) {
  let mostPlayedGame = games[0];

  for (let i = 1; i < games.length; i++) {
    if (games[i].tmpsDeJeu > mostPlayedGame.tmpsDeJeu) {
      mostPlayedGame = games[i];
    }
  }

  return mostPlayedGame;
}

function getPrixParHeure(game) {
  return game.prix / game.tmpsDeJeu;
}

export {getAllGames, Playtime, getAllPrices, nbErreur, isNewGames, updatePlaytime, getGamePrice, getAveragePrice, getAveragePlaytime, getMostPlayedGame, getPrixParHeure, AppidErreur};