const bcrypt = require('bcryptjs'); 
const SALT_ROUNDS = 10; //2^10 veces (1024 repeticiones)

const contrasenas = [
  ['admin (Laura, pass 1)', '1'],
  ['admin2 (Roberto)', 'admin2'],
  ['alumno (Miguel, pass 1)', '1'],
  ['lourdes1', 'lourdes1'],
  ['ella1', 'ella1'],
  ['lautaro1', 'lautaro1'],
  ['natalia1', 'natalia1'],
  ['carlos1', 'carlos1'],
  ['sandra1', 'sandra1'],
  ['raul1', 'raul1'],
];
 
(async () => {
  console.log('Generando hashes bcrypt...\n');
  for (const [nombre, pass] of contrasenas) {
    const hash = await bcrypt.hash(pass, SALT_ROUNDS); //pauso aca pero el servidor sigue ok
    console.log(`-- ${nombre}`);
    console.log(`UPDATE Personas SET Contrasena_P = '${hash}' WHERE Contrasena_P = '${pass}';`);
    console.log('');
  }
})();
 