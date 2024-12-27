import {write, read} from './data.js'
import { getAllGames, Playtime, getAllPrices, nbErreur, isNewGames, updatePlaytime, getAveragePrice, getAveragePlaytime, getMostPlayedGame, getPrixParHeure, AppidErreur} from './APIUtils.js';

let games = await read();

if (games.length == 0) {
  games = await getAllGames();
} else {
  let newGames = await isNewGames(games);

  if (newGames != null) {
    for (let i = 0; i < newGames.length; i++) {
      games.push(newGames[i]);
    }
  }
}

games = await updatePlaytime(games);

console.clear();

for (let i  = 0; i < games.length; i++) {
  if (games[i].prix > 75) {
    console.log('nom : ', games[i].nom, ', prix : ', games[i].prix);
  }
}

console.log('\n---------------------------------------- Resultats ----------------------------------------');
console.log('Nombre de jeux : ', games.length);
console.log(Playtime(games), ' heures de jeu.');
console.log(getAllPrices(games), '€');
console.log('Prix moyen : ', getAveragePrice(games), '€');
console.log('Temps de jeu moyen : ', getAveragePlaytime(games), 'h');

let bestGame = getMostPlayedGame(games);

console.log("Jeu le plus joué : ", bestGame.nom, ', ', bestGame.tmpsDeJeu, 'h', ', prix par heure : ', getPrixParHeure(bestGame), '€/h');
console.log(nbErreur, 'erreurs');

console.log('-------------------------------------------------------------------------------------------');


write(games); 
