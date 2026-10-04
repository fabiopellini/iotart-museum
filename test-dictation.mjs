/**
 * Testa la funzione REALE cmConsumeResults estratta da index.html
 * simulando la sequenza di eventi del motore vocale in modalita' continua,
 * dove l'API riemette gli stessi risultati finali a ogni evento.
 */
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const A = "/*CM_CONSUME_START*/", B = "/*CM_CONSUME_END*/";
const src = html.slice(html.indexOf(A) + A.length, html.indexOf(B));
if (!src.trim()) { console.log("FUNZIONE NON TROVATA"); process.exit(1); }
const cmConsumeResults = eval("(" + src.replace("function cmConsumeResults", "function") + ")");

/** Simula la dettatura "come un browser": applica la funzione a ogni evento. */
function dettatura(eventi, testoIniziale = "") {
  let value = testoIniziale, idx = 0;
  for (const ev of eventi) {
    const c = cmConsumeResults(ev, idx);
    idx = c.idx;
    if (c.add) value = (value.replace(/\s+$/, "") ? value.replace(/\s+$/, "") + " " : "") + c.add;
  }
  return value;
}
/** Riproduce la LOGICA VECCHIA (buggata) per confronto. */
function dettaturaVecchia(eventi, testoIniziale = "") {
  let value = testoIniziale;
  for (const ev of eventi) {
    let fin = "";
    for (let i = 0; i < ev.length; i++) if (ev[i].isFinal) fin += ev[i][0].transcript;
    if (fin) value = (value.replace(/\s+$/, "") ? value.replace(/\s+$/, "") + " " : "") + fin.trim();
  }
  return value;
}
const R = (t, f) => ({ 0: { transcript: t }, isFinal: f, length: 1 });

// ── La frase dell'utente: "non vedo il mare", con riemissione dei finali ──
const sequenza = [
  [R("non", false)],
  [R("non", true), R("vedo", false)],
  [R("non", true), R("vedo", true), R("il", false)],
  [R("non", true), R("vedo", true), R("il", true), R("mare", false)],
  [R("non", true), R("vedo", true), R("il", true), R("mare", true)],
];
const atteso = "non vedo il mare";
const nuova = dettatura(sequenza);
const vecchia = dettaturaVecchia(sequenza);

// ── Riemissione aggressiva: lo stesso evento finale ripetuto 4 volte ──
const ripetuta = [
  [R("non", true)],
  [R("non", true)], [R("non", true)], [R("non", true)],
  [R("non", true), R("vedo", true)],
  [R("non", true), R("vedo", true), R("il", true)],
  [R("non", true), R("vedo", true), R("il", true), R("mare", true)],
];
const nuova2 = dettatura(ripetuta);

// ── Continuazione su testo gia' scritto a mano ──
const nuova3 = dettatura([[R("bellissimo", true)]], "L'opera è");

// ── Riavvio della dettatura (l'indice si azzera) ──
const nuova4 = dettatura([[R("secondo", true)]], "primo");

const out = {
  vecchia_logica: vecchia,
  nuova_logica: nuova,
  riemissione_ripetuta: nuova2,
  con_testo_esistente: nuova3,
  dopo_riavvio: nuova4,
};
console.log(JSON.stringify(out, null, 2));

const ok =
  nuova === atteso &&
  vecchia !== atteso &&                 // il test dimostra il bug nella logica vecchia
  nuova2 === atteso &&
  nuova3 === "L'opera è bellissimo" &&
  nuova4 === "primo secondo";
console.log(`
frase attesa ..................... "${atteso}"
logica VECCHIA (buggata) ......... "${vecchia}"   <- riproduce il difetto
logica NUOVA ..................... "${nuova}"
con riemissione aggressiva ....... "${nuova2}"
continuazione su testo esistente . "${nuova3}"
dopo riavvio ..................... "${nuova4}"`);
console.log(ok ? "\nTEST_DICTATION: TUTTI_OK" : "\nTEST_DICTATION: FALLITO");
process.exit(ok ? 0 : 1);
