process.env.NODE_CONFIG = JSON.stringify({
    env: 'development',
  });
  
  import { hashPassword, verifyPassword } from './core/password';
  
  async function main() {
    const password = 'verydifficult';
    const wrongPassword = 'verywrong';
    console.log('The password:', password);
  
    const hash = await hashPassword(password);
    // bekijk hoe de hash opgebouwd is, wat herken je?
    // waar staat de timeCost, memoryCost, salt en de hash zelf?
    console.log('The hash:', hash);
  
    let valid = await verifyPassword(password, hash);
    console.log('The password', password, 'is', valid ? 'valid' : 'incorrect');
    console.log('');
  
    valid = await verifyPassword(wrongPassword, hash);
    console.log(
      'The password',
      wrongPassword,
      'is',
      valid ? 'valid' : 'incorrect',
    );
  }
  
  main();