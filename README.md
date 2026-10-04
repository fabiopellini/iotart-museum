# Catalogo mostra d'arte — deploy su GitHub Pages

Webapp a file singolo (`index.html`, autonomo e offline) pubblicata su **GitHub Pages**.
GitHub Pages serve in **HTTPS**, che è la condizione necessaria perché il
**microfono** (riconoscimento vocale) e la **sintesi vocale** funzionino dal telefono.

---

## 1. Pubblica (una volta sola)

Serve un account GitHub e la `git` installata. Dal terminale, dentro questa cartella:

```bash
git init
git add .
git commit -m "Webapp catalogo mostra"
git branch -M main
git remote add origin https://github.com/<TUO-UTENTE>/<NOME-REPO>.git
git push -u origin main
```

> Sostituisci `<TUO-UTENTE>` e `<NOME-REPO>` con i tuoi. Se il repo non esiste,
> crealo prima su GitHub (vuoto, senza README) — oppure crea il repo dal sito e
> poi fai il push.

## 2. Attiva GitHub Pages

Nel repository, sul sito GitHub:

**Settings → Pages → Build and deployment → Source: `GitHub Actions`**

Non serve altro: il workflow in `.github/workflows/deploy.yml` parte a ogni push.

## 3. Trova il tuo indirizzo

Tab **Actions** del repository → l'ultima esecuzione di *Deploy su GitHub Pages*
mostra l'URL pubblicato, in genere:

```
https://<TUO-UTENTE>.github.io/<NOME-REPO>/
```

Apri quell'indirizzo dal telefono. È in HTTPS, quindi microfono e voce funzionano.

---

## Aggiornare l'app in futuro

Sostituisci `index.html` con la nuova versione e:

```bash
git add index.html
git commit -m "Aggiornamento app"
git push
```

In circa un minuto il sito si aggiorna da solo.

---

## Alternativa senza workflow (zero configurazione)

Se preferisci non usare GitHub Actions:

**Settings → Pages → Source: `Deploy from a branch`** →
Branch: `main` / cartella: `/ (root)` → **Save**.

GitHub pubblicherà `index.html` direttamente dalla radice. Il workflow incluso
resta inutilizzato (puoi anche cancellarlo), ma con la sorgente su branch Pages
funziona comunque.

---

## Dominio personalizzato (facoltativo)

Se possiedi un dominio (es. `catalogo.testart.it`):

1. Crea nella radice del repo un file `CNAME` con dentro **solo** il dominio:
   ```
   catalogo.testart.it
   ```
2. Nel pannello del tuo provider DNS aggiungi un record **CNAME** verso
   `<TUO-UTENTE>.github.io`.
3. Sempre in **Settings → Pages**, inserisci il dominio e attiva *Enforce HTTPS*.

---

## Note sul backend dei like

L'app contiene già la configurazione per il **backend condiviso** (Cloudflare
Worker) dei like e dei commenti. Quando hai l'URL del Worker:

**Area gestori → scheda Like → *Backend condiviso* → incolla l'URL → Salva e collega**

L'app legge da sé protezioni e limiti dal Worker (`/config`). Finché non lo
colleghi, like e commenti restano sul singolo telefono: tutto il resto
(catalogo, voce, preferiti) funziona comunque.

---

## Cosa c'è in questa cartella

| File | Ruolo |
|---|---|
| `index.html` | l'intera webapp (autonoma, nessuna dipendenza esterna) |
| `.github/workflows/deploy.yml` | pubblicazione automatica su GitHub Pages |
| `.nojekyll` | impedisce a Jekyll di processare i file |
| `.gitignore` | esclude i file di sistema |
| `README.md` | questa guida |
