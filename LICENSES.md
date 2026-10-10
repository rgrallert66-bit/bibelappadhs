# Bibeltexte und Nutzungsrechte

## Enthaltene Übersetzungen

| Übersetzung | Rechteinhaber | Copyright-Vermerk (in der App angezeigt) |
|---|---|---|
| Elberfelder Bibel (Revision 2006, aktueller Textstand 33) | SCM R.Brockhaus in der SCM Verlagsgruppe GmbH, Witten/Holzgerlingen | „Bibeltext: Elberfelder Bibel (Revision 2006, Textstand 33), © SCM R.Brockhaus …“ |
| New King James Version (NKJV) | Thomas Nelson / HarperCollins Christian Publishing | „Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.“ |

Beide Übersetzungen sind urheberrechtlich geschützt. Es gibt **keine** freie Lizenz für die Volltexte.

## Was die App enthält

- 43 ausgewählte Lernverse (≈ 50 Verse inkl. Versbereiche) je Übersetzung, in `src/data/verses.ts`.
- Das liegt weit unter den üblichen Zitiergrenzen (NKJV: gratis bis 500 bzw. 1.000 Verse, < 25–50 % eines
  Buches, mit Quellenvermerk). Für die Elberfelder Bibel veröffentlicht SCM R.Brockhaus keine pauschale
  Zitiergrenze; hier ist eine Anfrage beim Verlag nötig.
- Eigene Verse, die Nutzer selbst eintippen, werden ausschließlich lokal auf dem Gerät gespeichert.

## Vor einer öffentlichen Veröffentlichung (App Store, Web) unbedingt

1. **Texte verifizieren.** Die Verse wurden ohne Zugriff auf eine lizenzierte Online-Quelle erfasst
   (die Bibelportale waren aus der Entwicklungsumgebung nicht erreichbar). Jeder Vers muss Wort für Wort
   gegen eine autorisierte Ausgabe geprüft werden – NKJV verlangt ausdrücklich exakte Übereinstimmung.
2. **Genehmigungen einholen.**
   - NKJV: HarperCollins Christian Publishing, Permissions (Formular unter harpercollinschristian.com/permissions).
     Digitale Apps fallen nach aktueller Lesart nicht sicher unter die Gratis-Regeln.
   - Elberfelder: SCM R.Brockhaus, Lizenz-/Rechteabteilung (scm-brockhaus.de).
3. **Alternative für Volltexte:** Eine lizenzierte API (z. B. API.Bible für NKJV, sofern freigeschaltet)
   kann über die `Verse`-Struktur in `src/data/verses.ts` angebunden werden.
