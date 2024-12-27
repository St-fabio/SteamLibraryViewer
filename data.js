import fs from 'fs';
import readline from 'readline';

function write(games) {
    fs.writeFile('data.json', '', 'utf8', (err) => {
        if (err) {
            console.error("Erreur lors de l'initialisation du fichier :", err);
            return;
        }

        games.forEach(element => {
            const line = JSON.stringify(element) + '\n';
            fs.appendFile('data.json', line, 'utf8', (err) => {
                if (err) {
                    console.log('Erreur dans l écriture.')
                }
            })
        });
    })
}
    
function read() {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream('data.json');

        fileStream.on('error', (error) => {
            console.error('Erreur lors de l’ouverture du fichier :', error.message);
            reject(error);
        });

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        const objects = [];
        rl.on('line', (line) => {
            try {
                const obj = JSON.parse(line);
                objects.push(obj);
            } catch (error) {
                console.error('Erreur de parsing JSON pour la ligne :', line);
            }
        });

        rl.on('close', () => {
            console.log('Lecture terminée !');
            resolve(objects);
        });
    });
}

export {write, read};