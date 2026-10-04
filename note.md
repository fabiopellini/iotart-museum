# Iotart-museum — note di funzionamento

Documento operativo dell'applicazione: cosa fa, come è fatta, come si pubblica e
come si manutiene. Aggiornato al 4 ottobre 2026.

\---

## 1\. Cos'è

**Iotart-museum** è una webapp per la **gestione di eventi museali e mostre**.
Serve una sola pagina web (`index.html`), autonoma e funzionante offline, con due
aree distinte:

* **area utenti (visitatori)** — consultazione delle schede opera, richiesta di
informazioni anche a voce, preferiti, voti con «Mi piace» e commenti;
* **area gestori** — creazione di mostre e schede opera, classifica per like.

Non richiede installazione: si apre dal browser del telefono. Il QR sulla
locandina porta direttamente al catalogo.

|||
|-|-|
|Indirizzo pubblico|https://fabiopellini.github.io/iotart-museum/|
|Repository|https://github.com/fabiopellini/iotart-museum|
|Hosting|GitHub Pages (HTTPS, gratuito)|
|Backend (opzionale)|Cloudflare Worker + KV|

\---

## 2\. Accessi

|Ruolo|Come si entra|Note|
|-|-|-|
|**Visitatore**|apre il link, tocca *Entra come visitatore*|nessuna registrazione|
|**Gestore**|icona profilo → *Area gestori* → **PIN**|PIN demo: `2026`|

Il **codice di presenza** (es. `SALA2026`) è un concetto diverso dal PIN: serve
al **voto** quando il backend è attivo, e viene consegnato ai visitatori dal QR
della locandina (che lo porta nell'indirizzo come `?c=CODICE`) oppure da un
cartello in reception. Il PIN invece protegge l'area gestori.

\---

## 3\. Funzioni dell'area utenti

### 3.1 Catalogo e scheda opera

Ogni opera ha una **scheda** con: autore, titolo, anno, tecnica e misure, sala,
prezzo, testo descrittivo, foto. Il catalogo mostra l'elenco con numero di
catalogo; la scheda si apre a tutto schermo.

### 3.2 Informazioni a voce (STT → risposta → TTS)

Il visitatore tocca il microfono e **parla**: il telefono trascrive (motore
vocale del browser, `it-IT`) e l'app cerca la risposta **dentro i dati della
scheda** — autore, titolo, anno, tecnica, prezzo, sala, descrizione. La risposta
viene **letta ad alta voce** dal sintetizzatore del telefono.

Non c'è alcun modello AI dietro: se un dato non è nella scheda, la voce lo dice
esplicitamente invece di inventarlo. È una scelta deliberata — in una mostra un
prezzo sbagliato è un danno, non un abbaglio.

Sono disponibili anche sei domande rapide e un campo di scrittura, per i
dispositivi senza supporto vocale.

### 3.3 Preferiti

Stella su ogni opera; la scheda *Preferiti* filtra il catalogo su ciò che il
visitatore ha salvato.

### 3.4 «Mi piace» (il voto) e commenti

* **Mi piace**: cuore con contatore, sia sulla scheda del catalogo sia nella
scheda dettaglio. Un tocco attiva, un altro rimuove.
* **Commenti**: campo di testo con **dettatura vocale** (pulsante *Detta il
commento*) che compone il testo nel campo, poi *Pubblica*.

### 3.5 Menu utente

Icona profilo in alto a destra:

|Voce|Effetto|
|-|-|
|**Chi siamo**|descrizione dell'applicazione|
|**Area gestori** / **Torna al catalogo**|cambia ruolo (per i visitatori chiede il PIN)|
|**Logoff**|riporta alla schermata iniziale, azzera la sessione|

Il Logoff **non cancella** i dati: opere inserite e preferiti restano sul
telefono.

\---

## 4\. Funzioni dell'area gestori

1. **Mostre** — crea, modifica ed elimina eventi: nome, data o periodo,
sottotitolo, organizzatore, sede.
2. **Schede opera** — per ogni mostra, inserisce le opere: autore, titolo, anno,
prezzo, tecnica e misure, sala, testo descrittivo e **foto** (ridimensionata
automaticamente per il telefono).
3. **Classifica per like** — opere ordinate dal numero di like decrescente, con
barra proporzionale e conteggio commenti per opera. È qui che si collega il
backend condiviso.
4. **Esporta catalogo** — scarica l'intero stato in JSON, per spostarlo su un
altro dispositivo.
5. **Ripristina dati demo** — riporta l'app ai dati di esempio.

\---

## 5\. Architettura

```
   telefono del visitatore
   ┌──────────────────────────────┐
   │  index.html  (una sola pagina)│
   │  · UI e catalogo              │
   │  · localStorage: stato locale │
   │  · STT/TTS del browser        │
   └───────┬──────────────────────┘
           │  solo like e commenti (se il backend è collegato)
           ▼
   ┌──────────────────────────────┐
   │  Cloudflare Worker + KV       │
   │  · /state /like /comment      │
   │  · /config  /health           │
   │  · Turnstile, rate limit       │
   └──────────────────────────────┘
```

**Senza backend** l'app funziona comunque: catalogo, voce, preferiti, like e
commenti vivono sul singolo telefono. **Con il backend** like e commenti sono
condivisi fra tutti i visitatori e la classifica del gestore li vede tutti.

### 5.1 Dati sul dispositivo

Stato salvato in `localStorage` sotto la chiave `colori-mia-terra.v1`. Contiene:
mostre e opere, preferiti, like locali, commenti locali, codice di presenza,
URL del backend, **`voter`** (identificativo anonimo casuale del dispositivo,
usato per il dedup dei like) e preferenze UI.

> \*\*Nota sul `voter`:\*\* vive nel `localStorage`, quindi \*\*svuotando i dati del
> browser si ottiene un nuovo votante\*\* e si può rivotare la stessa opera. È il
> motivo per cui, laddove il voto conta (concorso), servono il codice di
> presenza e Turnstile: vedi §7.

### 5.2 Icona e installazione

L'app incorpora la propria icona (favicon, apple-touch-icon) e genera a runtime
un **manifest PWA**, così da potersi aggiungere alla schermata Home con nome e
icona corretti. Serve HTTPS: GitHub Pages lo fornisce.

\---

## 6\. Deploy e aggiornamenti

### 6.1 Come è pubblicata

GitHub Pages con il workflow `.github/workflows/deploy.yml`: a ogni push su
`main` il sito viene ripubblicato. Circa un minuto.

### 6.2 Aggiornare l'app

```bash
# sostituire index.html con la nuova versione, poi:
git add index.html
git commit -m "Aggiornamento app"
git push
```

### 6.3 Pubblicazione manuale (senza Actions)

*Settings → Pages → Source: Deploy from a branch* → `main` / `/ (root)` → Save.

### 6.4 Dominio personalizzato (facoltativo)

1. file `CNAME` nella radice con solo il dominio (es. `catalogo.testart.it`);
2. record **CNAME** del provider DNS verso `fabiopellini.github.io`;
3. *Settings → Pages* → inserire il dominio e attivare *Enforce HTTPS*.

> Il repository è \*\*pubblico\*\* perché GitHub Pages sul piano free non supporta i
> repository privati. Nel codice non ci sono segreti: l'URL del backend è
> configurabile dall'area gestori e il codice di presenza non è nel sorgente.

\---

## 7\. Backend condiviso per like e commenti

Serve solo se si vuole che la **classifica veda i voti di tutti**. È un
Cloudflare **Worker + KV** (piano Free sufficiente).

### 7.1 Contratto API

|Metodo|Percorso|Corpo / query|Risposta|
|-|-|-|-|
|GET|`/health`|—|`{ok:true}`|
|GET|`/config`|—|site key Turnstile, `need\_code`, limiti e finestra in uso|
|GET|`/state`|`?event=<id>`|`{event, likes:{id:n}, comments:{id:\[…]}}`|
|POST|`/like`|`{event,work,voter,delta,code,token}`|`{likes:n, liked:bool}`|
|POST|`/comment`|`{event,work,text,voter,code,token}`|`{comments:\[…]}`|

`event` separa una mostra dall'altra; `voter` identifica il dispositivo.

### 7.2 Protezioni (per un concorso, dove i voti contano)

|Livello|Cosa blocca|Default|
|-|-|-|
|**Codice di presenza**|vota solo chi è in mostra|`VOTE\_CODE`|
|**Quota per dispositivo**|abusi dal singolo telefono — **equa anche dietro NAT**|15 like / 5 min|
|**Tetto per IP**|ondate; tenuto **alto** perché il Wi-Fi della mostra è condiviso|2000 like / 5 min|
|**Turnstile** (invisibile)|bot e automazioni, senza attrito per il visitatore|opzionale|

L'IP reale è letto da **`CF-Connecting-IP`** (impostato da Cloudflare), poi da
`X-Forwarded-For`, poi da `CF-Pseudo-IPv4`. Questo header **non è falsificabile**
da un client: un tentativo manuale viene respinto con `403 — error code: 1000`.

### 7.3 Budget di scritture (il vincolo che conta)

Il piano Free di Cloudflare KV consente **1.000 scritture al giorno**
(100.000 letture). Il conteggio dei like non ha una chiave separata: la lista dei
votanti *è* il conteggio.

|Configurazione|Scritture per like|Like al giorno (Free)|
|-|-|-|
|Binding nativi `\[\[ratelimits]]` attivi|**1**|**\~1.000**|
|Fallback con contatori KV|3|\~330|

Con i **binding nativi** (già configurati in `wrangler.toml`) i contatori di
frequenza non consumano scritture KV. Attenzione: l'API nativa accetta solo
finestre di **10 o 60 secondi** ed è *permissiva* (contatori locali alla singola
location Cloudflare) — va bene come rete di sicurezza, il controllo forte resta
il codice di presenza più il dedup per dispositivo.

> KV accetta \*\*1 scrittura al secondo sulla stessa chiave\*\*: un'opera molto
> votata difficilmente supera 1 like/secondo in una mostra. Se dovesse accadere,
> il contatore va spostato su Durable Objects.

### 7.4 Deploy del backend

```bash
cd backend
npm i -g wrangler \&\& wrangler login
wrangler kv namespace create ARTKV     # incollare l'id in wrangler.toml
wrangler secret put TURNSTILE\_SECRET   # solo se si usa Turnstile
wrangler deploy
```

Poi, nell'app: **Area gestori → scheda Like → *Backend condiviso*** → incollare
l'URL del Worker → **Salva e collega**. L'app legge da sé protezioni e limiti
tramite `/config`.

### 7.5 Test

* `node test-worker.mjs` — percorso di fallback KV (dedup, sanitizzazione, 404).
* `node test-native.mjs` — percorso con binding nativi (quote, tetto per IP,
scritture KV per like).
* `node test-dictation.mjs` — la dettatura dei commenti.

\---

## 8\. Limitazioni note

1. **Like e commenti senza backend** restano sul singolo telefono: la classifica
del gestore vede solo quelli di quel dispositivo.
2. **Il `voter` è cancellabile** svuotando i dati del browser: senza Turnstile e
senza controllo all'ingresso, un utente motivato può rivotare. Con Turnstile
e rate limit il costo dell'abuso diventa trascurabile.
3. **Riconoscimento vocale**: affidabile sui browser Chromium su Android; su iOS
Safari il supporto è parziale. Per questo il campo di scrittura è sempre
presente. Richiede HTTPS e il permesso microfono.
4. **Sintesi vocale**: usa la voce del sistema; la lingua è impostata su `it-IT`.
5. **Scrittura su KV**: 1 al secondo per chiave (§7.3).
6. **Il tetto per IP** va alzato se la sede è dietro un solo IP pubblico: i
valori di default (2000 / 15) sono pensati per questo caso.

\---

## 9\. File del progetto

|File|Ruolo|
|-|-|
|`index.html`|l'intera webapp: UI, catalogo, voce, preferiti, like, commenti, area gestori|
|`.github/workflows/deploy.yml`|pubblicazione automatica su GitHub Pages|
|`.nojekyll`|impedisce a Jekyll di processare i file|
|`test-dictation.mjs`|test della dettatura dei commenti|
|`note.md`|questo documento|

Il **backend** è distribuito a parte, come pacchetto `catalogo-mostre-backend.zip`
(Worker, `wrangler.toml`, README, test e una versione eseguibile in Node per le
prove locali).

\---

## 10\. Manutenzione rapida

|Situazione|Cosa fare|
|-|-|
|Aggiornare l'app|sostituire `index.html`, `git push`|
|Cambiare i dati demo|area gestori → *Ripristina dati demo*|
|Spostare il catalogo su un altro telefono|area gestori → *Esporta catalogo (JSON)*|
|Attivare la classifica condivisa|collegare il backend (§7.4)|
|Voti gonfiati|attivare Turnstile e il codice di presenza (§7.2)|
|Deploy fallito|tab *Actions* del repository → leggere il log del run|





Sequenza esatta (clone → push)

Copygit clone https://github.com/fabiopellini/iotart-museum.git

cd iotart-museum

Metti note.md nella cartella iotart-museum appena creata, poi:



Copymd5sum note.md

\# deve dare: 187850edbc5ffd65f7811b1efa03d999



git add note.md

git commit -m "note.md: note di funzionamento dell'applicazione"

git push origin main

