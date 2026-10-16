# How to reuse this app for a new event

Everything that changes between events lives in **two places**:

1. `config.js` — names, dates, place, prices, bank info, meals
2. `assets/` — three pictures: `logo.png`, `banner.jpg`, `bank.jpg`

You never need to edit the `.html`, `shared.js` or `api/` files.

## One-time setup (do this once)
1. On GitHub, open your finished repo → **Settings** → tick **Template repository**.

## For each new event (about 10 minutes)
1. **Create the repo:** open the template repo → **Use this template** → *Create a new repository* (e.g. `retiro-mujeres-2027`).
2. **Edit `config.js`** (pencil icon on GitHub). Change:
   - `nombre`, `tema`, `anio`, `siglas` (ID prefix, e.g. `MUJ` → codes like `MUJ-K7M2QX`)
   - `lugar`, `fechaTexto`, `fechaInicio` (YYYY-MM-DD, used to calculate age), `fechaLimite`
   - `precioTotal`, `reserva`, `edadAviso` (age that triggers the purple "Menor" tag)
   - `banco` (bank, account number, account holder, optional note)
   - `comidas` (the list of meals; add or remove lines — tallies, scanner and Excel adapt automatically)
   - `colorAcento` / `colorAcentoOscuro` (optional button color)
3. **Replace the pictures** in `assets/` (upload with the same file names):
   - `logo.png` — square, ~512×512
   - `banner.jpg` — ~1400×770 (the event name/theme is part of this picture)
   - `bank.jpg` — photo/screenshot of your bank card or account details
4. **Create a Vercel project:** Vercel → Add New → Project → import the new repo → Deploy.
5. **Database** (Vercel project → Storage / Marketplace → Upstash Redis). Pick one:
   - **Separate database per event (simplest, fully isolated):** create/connect a new Upstash Redis to each project.
   - **One shared database:** connect the same database, then in *Settings → Environment Variables* add `EVENT_ID` with a different short value per event (e.g. `muj2027`). Data is then kept separate.
6. **PINs** (Environment Variables, per project): `ADMIN_PIN` and `SCANNER_PIN`. There are no default PINs in the code: if a variable is missing, that login stays closed. Redeploy after adding them.
7. **Test:** register once, approve it in `/admin`, scan it in `/scanner`, then delete the test record.

## Checklist
- [ ] config.js edited (name, siglas, dates, place, prices, bank, meals)
- [ ] logo / banner / bank images replaced
- [ ] Vercel project + Upstash connected (and `EVENT_ID` if sharing a database)
- [ ] ADMIN_PIN and SCANNER_PIN set
- [ ] Test registration approved and scanned, then deleted

## Notes
- Your current CIY deployment keeps working as is: with no `EVENT_ID`, its data stays where it is.
- Each event gets its own website address, so old events stay intact as an archive.
- Download the Excel from `/admin` after each event, then you can delete that project's data.
