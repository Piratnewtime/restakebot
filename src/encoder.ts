import clc from "cli-color";
import Password from "./classes/protection/Password";
import { askSecret, askPublic } from "./classes/Questionnaire";

let attempts = 0;
let pass;
do {
	pass = askSecret('Set-up your password');
	if (pass.length >= 6) break;
	console.error(clc.red('Your password should contain minimum 6 symbols'));
	attempts++;
} while (attempts < 3)

if (attempts >= 3) console.log('Goodbye'), process.exit(1);

attempts = 0;
do {
  const pass_check = askSecret('Repeat your password');
  if (pass === pass_check) break;
  console.error(clc.red('Passwords don\'t match'));
  attempts++;
} while (attempts < 3)

if (attempts >= 3) console.log('Goodbye'), process.exit(1);

console.log(clc.bgYellow(clc.black('   All Right! Let\'s begin!   ')));

const password = new Password(pass);

while (true) {
  const sk = askPublic('Private key');
  if (!sk.length) {
    console.error(clc.red('Empty key'));
    continue;
  }
  const encrypted = password.encrypt(sk);
  console.log('Encrypted:', clc.bgWhite(' ' + clc.black(encrypted) + ' '));
}