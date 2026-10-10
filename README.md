# Scripture — Gottes Wort im Herzen

Eine mobile Bibel-Lern-App (PWA), die das Auswendiglernen von Bibelversen wissenschaftlich fundiert,
spielerisch und – vor allem – *satisfying* macht. Ein lebendiger Baum wächst mit jedem Lerntag;
deine Verse hängen als Keim, Spross, Knospe, Blüte und goldene Frucht in seinen Zweigen.

## Starten

```bash
npm install
npm run dev        # Entwicklungsserver, http://localhost:5173
npm test           # Unit-Tests (Lernalgorithmus, Chunking, Streak, Baum)
npm run build      # Produktions-Build (PWA, offline-fähig) nach dist/
npm run screenshots -- http://localhost:5173/ screenshots   # spielt die App per Playwright durch
```

## Was die App ausmacht

**Lernsystem (siehe `src/lib/`)**
- **FSRS-5** (`fsrs.ts`) plant jede Wiederholung genau dann, wenn die Erinnerung auf ~90 % fällt (Spacing-Effekt).
- **Verblassende Hilfen**: Entdecken → Ordnen → Lücke → Wortkette → Anfangsbuchstaben (mit Geisterschrift) →
  Anfangsbuchstaben (nur Wortformen) → ganz aus dem Herzen. Fast fehlerfreier Einstieg, wachsende Anstrengung.
- **Anfangsbuchstaben-Methode** mit eigener In-App-Tastatur: jedes Wort wird abgerufen, im Rhythmus.
- **Chunking** (`text.ts`) in 3–7-Wort-Phrasen entlang Satzzeichen und Konjunktionen.
- **Interleaving** der Karten verschiedener Verse, **Schlaf-Konsolidierung** (neuer Vers kommt morgen wieder),
  **adaptive Schwierigkeit** Richtung 85 % Erfolgsquote.

**Spielsystem**
- Der Baum wächst pro **Lerntag** (Tagesgang abgeschlossen), nie durch Wiederholungs-Marathons, und schrumpft nie.
- Serie mit **Ruhetag-Gnade**: ein verpasster Tag pro Woche wird automatisch überbrückt.
- Combo-Serie mit pentatonisch aufsteigenden Tönen, drei **Tagesziele** (alle = goldenes Blatt am Baum),
  16 **Meilensteine**, fünf **Pfade**, eigene Verse.

**Design**
- Fraunces (Serif) + Inter, warmes Pergament / tiefes Waldgrün / Blattgold, Hell- und Dunkelmodus.
- Canvas-Baum mit Wind, Tageszeit-Himmel, echten Jahreszeiten, Glühwürmchen bei Nacht.
- Synthetisierte, leise Klänge (WebAudio) und Haptik – abschaltbar.

## Bibeltexte & Rechte

Siehe [LICENSES.md](LICENSES.md). Kurz: Die App enthält nur eine kleine Auswahl an Lernversen
(Elberfelder Bibel, NKJV). Vor einer öffentlichen Veröffentlichung müssen die Texte gegen eine lizenzierte
Quelle geprüft und schriftliche Genehmigungen beider Verlage eingeholt werden.
