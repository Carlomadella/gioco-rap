const fs = require('fs');
const path = process.argv[2];
if(!path){ console.error('Usage: node fix-mojibake.js <file>'); process.exit(2); }
let s = fs.readFileSync(path, 'utf8');
const map = [
  ['\u00C3\u00A8','\u00E8'], // "Ã¨" -> "è"
  ['\u00C3\u00A0','\u00E0'], // "Ã " -> "à"
  ['\u00C3\u00A9','\u00E9'], // "Ã©" -> "é"
  ['\u00C3\u00B9','\u00F9'], // "Ã¹" -> "ù"
  ['\u00C3\u00B2','\u00F2'], // "Ã²" -> "ò"
  ['\u00C3\u00AE','\u00EE'], // "Ã®" -> "î"
  ['\u00C3\u00A2','\u00E2'], // "Ã¢" -> "â"
  ['\u00C3\u00AC','\u00EC'], // "Ã¬" -> "ì"
  ['\u00C3\u00A7','\u00E7'], // "Ã§" -> "ç"
  ['\u00E2\u0080\u0094','\u2014'], // "â€”" -> em-dash
  ['\u00E2\u0080\u0093','\u2013'], // "â€“" -> en-dash
  ['\u00E2\u0082\u00AC','\u20AC'], // "â‚¬" -> euro
  ['\u00E2\u0080\u0099','\u2019'], // "â€™" -> right single quote
  ['\u00E2\u0080\u009C','\u201C'], // "â€œ" -> left double quote
  ['\u00E2\u0080\u009D','\u201D'], // "â€�" -> right double quote
  ['\u00C2\u00B7','\u00B7'], // "Â·" -> middle dot
  ['\u00C3\u0088','\u00C8'],
  ['\u00C3\u0089','\u00C9'],
  ['\u00C3\u0092','\u00D2'],
  // literal sequences (some files contain these exact bytes after bad conversions)
  ['â€”','—'],
  ['â€“','–'],
  ['â‚¬','€'],
  ['â€™','’'],
  ['â€œ','“'],
  ['â€�','”'],
  ['âˆ’','−'],
  ['â†’','→'],
  ['â†“','↓'],
  ['Â«','«'],
  ['Â»','»'],
  ['Ã—','×'],
  // explicit single-character literal forms that still appear
  ['Ãˆ','È'],
  ['Ã¨','è'],
  // literal sequences
  ['â€”','—'],
  ['â€“','–'],
  ['â‚¬','€'],
  ['â€™','’'],
  ['â€œ','“'],
  ['â€�','”'],
  ['â†’','→'],
  ['Â«','«'],
  ['Â»','»'],
  ['Ã—','×']
];
let original = s;
for(const [from,to] of map){
  s = s.split(from).join(to);
}
if(s === original){
  console.log('No changes made');
  process.exit(0);
}
fs.writeFileSync(path, s, 'utf8');
console.log('Fixed:', path);
