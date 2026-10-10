/**
 * Starter collection of memory verses.
 *
 * Rights & sources (see LICENSES.md):
 *  - Deutsch: Elberfelder Bibel, © SCM R.Brockhaus in der SCM Verlagsgruppe GmbH,
 *    Witten/Holzgerlingen. Current edition: Revision 2006, Textstand 33.
 *  - English: New King James Version®, © 1982 by Thomas Nelson. Used by permission.
 *    All rights reserved.
 *
 * The collection is deliberately small (well below the publishers' gratis quotation
 * limits) and is the only Scripture text bundled with the app. Before any public
 * distribution the texts must be checked against a licensed source and written
 * permission must be obtained from both publishers (see LICENSES.md).
 */

export type TranslationId = 'elb' | 'nkjv'

export type BookId =
  | 'gen' | 'jos' | 'ps' | 'prov' | 'isa' | 'jer' | 'mic'
  | 'matt' | 'john' | 'rom' | '1cor' | '2cor' | 'gal' | 'eph' | 'phil'
  | '1thess' | '2tim' | 'heb' | 'jas' | '1pet' | '1john'

export const BOOKS: Record<BookId, { elb: string; nkjv: string; ot: boolean }> = {
  gen: { elb: '1. Mose', nkjv: 'Genesis', ot: true },
  jos: { elb: 'Josua', nkjv: 'Joshua', ot: true },
  ps: { elb: 'Psalm', nkjv: 'Psalm', ot: true },
  prov: { elb: 'Sprüche', nkjv: 'Proverbs', ot: true },
  isa: { elb: 'Jesaja', nkjv: 'Isaiah', ot: true },
  jer: { elb: 'Jeremia', nkjv: 'Jeremiah', ot: true },
  mic: { elb: 'Micha', nkjv: 'Micah', ot: true },
  matt: { elb: 'Matthäus', nkjv: 'Matthew', ot: false },
  john: { elb: 'Johannes', nkjv: 'John', ot: false },
  rom: { elb: 'Römer', nkjv: 'Romans', ot: false },
  '1cor': { elb: '1. Korinther', nkjv: '1 Corinthians', ot: false },
  '2cor': { elb: '2. Korinther', nkjv: '2 Corinthians', ot: false },
  gal: { elb: 'Galater', nkjv: 'Galatians', ot: false },
  eph: { elb: 'Epheser', nkjv: 'Ephesians', ot: false },
  phil: { elb: 'Philipper', nkjv: 'Philippians', ot: false },
  '1thess': { elb: '1. Thessalonicher', nkjv: '1 Thessalonians', ot: false },
  '2tim': { elb: '2. Timotheus', nkjv: '2 Timothy', ot: false },
  heb: { elb: 'Hebräer', nkjv: 'Hebrews', ot: false },
  jas: { elb: 'Jakobus', nkjv: 'James', ot: false },
  '1pet': { elb: '1. Petrus', nkjv: '1 Peter', ot: false },
  '1john': { elb: '1. Johannes', nkjv: '1 John', ot: false },
}

/** Chapter + verse span. German and English Psalter numbering can differ. */
export interface Span {
  c: number
  v: number
  to?: number
}

export interface Verse {
  id: string
  book: BookId
  ref: Span
  /** Only set where the English numbering differs from the German one. */
  refNkjv?: Span
  text: Record<TranslationId, string>
  /** User-created verses carry their own reference label and single text. */
  custom?: { label: string; translation: TranslationId }
}

const v = (
  id: string,
  book: BookId,
  ref: Span,
  elb: string,
  nkjv: string,
  refNkjv?: Span,
): Verse => ({ id, book, ref, refNkjv, text: { elb, nkjv } })

export const VERSES: Verse[] = [
  // — Wurzeln: das Wort selbst
  v('ps119-11', 'ps', { c: 119, v: 11 },
    'In meinem Herzen habe ich dein Wort verwahrt, damit ich nicht gegen dich sündige.',
    'Your word I have hidden in my heart, That I might not sin against You.'),
  v('ps119-105', 'ps', { c: 119, v: 105 },
    'Eine Leuchte für meinen Fuß ist dein Wort, ein Licht für meinen Pfad.',
    'Your word is a lamp to my feet And a light to my path.'),
  v('john1-1', 'john', { c: 1, v: 1 },
    'Im Anfang war das Wort, und das Wort war bei Gott, und das Wort war Gott.',
    'In the beginning was the Word, and the Word was with God, and the Word was God.'),
  v('gen1-1', 'gen', { c: 1, v: 1 },
    'Im Anfang schuf Gott die Himmel und die Erde.',
    'In the beginning God created the heavens and the earth.'),
  v('ps1-3', 'ps', { c: 1, v: 3 },
    'Und er ist wie ein Baum, gepflanzt an Wasserbächen, der seine Frucht bringt zu seiner Zeit, und sein Laub verwelkt nicht; alles, was er tut, gelingt ihm.',
    'He shall be like a tree Planted by the rivers of water, That brings forth its fruit in its season, Whose leaf also shall not wither; And whatever he does shall prosper.'),
  v('jas1-22', 'jas', { c: 1, v: 22 },
    'Seid aber Täter des Wortes und nicht allein Hörer, die sich selbst betrügen!',
    'But be doers of the word, and not hearers only, deceiving yourselves.'),
  v('heb13-8', 'heb', { c: 13, v: 8 },
    'Jesus Christus ist derselbe gestern und heute und in Ewigkeit.',
    'Jesus Christ is the same yesterday, today, and forever.'),

  // — Fundament: das Evangelium
  v('john3-16', 'john', { c: 3, v: 16 },
    'Denn so hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, damit jeder, der an ihn glaubt, nicht verloren geht, sondern ewiges Leben hat.',
    'For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.'),
  v('rom3-23', 'rom', { c: 3, v: 23 },
    'denn alle haben gesündigt und erlangen nicht die Herrlichkeit Gottes',
    'for all have sinned and fall short of the glory of God,'),
  v('rom6-23', 'rom', { c: 6, v: 23 },
    'Denn der Lohn der Sünde ist der Tod, die Gnadengabe Gottes aber ewiges Leben in Christus Jesus, unserm Herrn.',
    'For the wages of sin is death, but the gift of God is eternal life in Christ Jesus our Lord.'),
  v('rom5-8', 'rom', { c: 5, v: 8 },
    'Gott aber erweist seine Liebe zu uns darin, dass Christus, als wir noch Sünder waren, für uns gestorben ist.',
    'But God demonstrates His own love toward us, in that while we were still sinners, Christ died for us.'),
  v('eph2-8', 'eph', { c: 2, v: 8, to: 9 },
    'Denn aus Gnade seid ihr errettet durch Glauben, und das nicht aus euch, Gottes Gabe ist es; nicht aus Werken, damit niemand sich rühme.',
    'For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, lest anyone should boast.'),
  v('rom10-9', 'rom', { c: 10, v: 9 },
    'dass, wenn du mit deinem Mund Jesus als Herrn bekennen und in deinem Herzen glauben wirst, dass Gott ihn aus den Toten auferweckt hat, du gerettet werden wirst.',
    'that if you confess with your mouth the Lord Jesus and believe in your heart that God has raised Him from the dead, you will be saved.'),
  v('1john1-9', '1john', { c: 1, v: 9 },
    'Wenn wir unsere Sünden bekennen, ist er treu und gerecht, dass er uns die Sünden vergibt und uns reinigt von jeder Ungerechtigkeit.',
    'If we confess our sins, He is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.'),
  v('2cor5-17', '2cor', { c: 5, v: 17 },
    'Daher, wenn jemand in Christus ist, so ist er eine neue Schöpfung; das Alte ist vergangen, siehe, Neues ist geworden.',
    'Therefore, if anyone is in Christ, he is a new creation; old things have passed away; behold, all things have become new.'),
  v('john14-6', 'john', { c: 14, v: 6 },
    'Jesus spricht zu ihm: Ich bin der Weg und die Wahrheit und das Leben. Niemand kommt zum Vater als nur durch mich.',
    'Jesus said to him, “I am the way, the truth, and the life. No one comes to the Father except through Me.'),
  v('john11-25', 'john', { c: 11, v: 25 },
    'Jesus sprach zu ihr: Ich bin die Auferstehung und das Leben. Wer an mich glaubt, wird leben, auch wenn er gestorben ist;',
    'Jesus said to her, “I am the resurrection and the life. He who believes in Me, though he may die, he shall live.'),

  // — Mut & Kraft
  v('jos1-9', 'jos', { c: 1, v: 9 },
    'Habe ich dir nicht geboten: Sei stark und mutig? Erschrick nicht und fürchte dich nicht! Denn mit dir ist der HERR, dein Gott, wohin du auch gehst.',
    'Have I not commanded you? Be strong and of good courage; do not be afraid, nor be dismayed, for the LORD your God is with you wherever you go.'),
  v('isa41-10', 'isa', { c: 41, v: 10 },
    'Fürchte dich nicht, denn ich bin mit dir! Hab keine Angst, denn ich bin dein Gott! Ich stärke dich, ja, ich helfe dir, ja, ich halte dich mit der Rechten meiner Gerechtigkeit.',
    'Fear not, for I am with you; Be not dismayed, for I am your God. I will strengthen you, Yes, I will help you, I will uphold you with My righteous right hand.'),
  v('phil4-13', 'phil', { c: 4, v: 13 },
    'Alles vermag ich in dem, der mich kräftigt.',
    'I can do all things through Christ who strengthens me.'),
  v('2tim1-7', '2tim', { c: 1, v: 7 },
    'Denn Gott hat uns nicht einen Geist der Furchtsamkeit gegeben, sondern der Kraft und der Liebe und der Zucht.',
    'For God has not given us a spirit of fear, but of power and of love and of a sound mind.'),
  v('isa40-31', 'isa', { c: 40, v: 31 },
    'aber die auf den HERRN hoffen, gewinnen neue Kraft; sie heben die Schwingen empor wie die Adler, sie laufen und ermatten nicht, sie gehen und ermüden nicht.',
    'But those who wait on the LORD Shall renew their strength; They shall mount up with wings like eagles, They shall run and not be weary, They shall walk and not faint.'),
  v('ps46-2', 'ps', { c: 46, v: 2 },
    'Gott ist uns Zuflucht und Stärke, als Beistand in Nöten reichlich gefunden.',
    'God is our refuge and strength, A very present help in trouble.',
    { c: 46, v: 1 }),

  // — Frieden & Vertrauen
  v('ps23-1', 'ps', { c: 23, v: 1 },
    'Der HERR ist mein Hirte, mir wird nichts mangeln.',
    'The LORD is my shepherd; I shall not want.'),
  v('prov3-5', 'prov', { c: 3, v: 5, to: 6 },
    'Vertraue auf den HERRN mit deinem ganzen Herzen und stütze dich nicht auf deinen Verstand! Auf all deinen Wegen erkenne nur ihn, dann ebnet er selbst deine Pfade.',
    'Trust in the LORD with all your heart, And lean not on your own understanding; In all your ways acknowledge Him, And He shall direct your paths.'),
  v('phil4-6', 'phil', { c: 4, v: 6, to: 7 },
    'Seid um nichts besorgt, sondern in allem sollen durch Gebet und Flehen mit Danksagung eure Anliegen vor Gott kundwerden; und der Friede Gottes, der allen Verstand übersteigt, wird eure Herzen und eure Gedanken bewahren in Christus Jesus.',
    'Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving, let your requests be made known to God; and the peace of God, which surpasses all understanding, will guard your hearts and minds through Christ Jesus.'),
  v('1pet5-7', '1pet', { c: 5, v: 7 },
    'Alle eure Sorge werft auf ihn! Denn er ist besorgt für euch.',
    'casting all your care upon Him, for He cares for you.'),
  v('matt11-28', 'matt', { c: 11, v: 28 },
    'Kommt her zu mir, alle ihr Mühseligen und Beladenen! Und ich werde euch Ruhe geben.',
    'Come to Me, all you who labor and are heavy laden, and I will give you rest.'),
  v('ps37-5', 'ps', { c: 37, v: 5 },
    'Befiehl dem HERRN deinen Weg, und vertraue auf ihn, so wird er handeln',
    'Commit your way to the LORD, Trust also in Him, And He shall bring it to pass.'),
  v('jer29-11', 'jer', { c: 29, v: 11 },
    'Denn ich kenne ja die Gedanken, die ich über euch denke, spricht der HERR, Gedanken des Friedens und nicht zum Unheil, um euch Zukunft und Hoffnung zu gewähren.',
    'For I know the thoughts that I think toward you, says the LORD, thoughts of peace and not of evil, to give you a future and a hope.'),
  v('rom8-28', 'rom', { c: 8, v: 28 },
    'Wir wissen aber, dass denen, die Gott lieben, alle Dinge zum Guten mitwirken, denen, die nach dem Vorsatz berufen sind.',
    'And we know that all things work together for good to those who love God, to those who are the called according to His purpose.'),

  // — Leben im Licht
  v('rom12-2', 'rom', { c: 12, v: 2 },
    'Und seid nicht gleichförmig dieser Welt, sondern werdet verwandelt durch die Erneuerung des Sinnes, dass ihr prüfen mögt, was der Wille Gottes ist: das Gute und Wohlgefällige und Vollkommene.',
    'And do not be conformed to this world, but be transformed by the renewing of your mind, that you may prove what is that good and acceptable and perfect will of God.'),
  v('matt6-33', 'matt', { c: 6, v: 33 },
    'Trachtet aber zuerst nach dem Reich Gottes und nach seiner Gerechtigkeit! Und dies alles wird euch hinzugefügt werden.',
    'But seek first the kingdom of God and His righteousness, and all these things shall be added to you.'),
  v('matt5-14', 'matt', { c: 5, v: 14 },
    'Ihr seid das Licht der Welt; eine Stadt, die oben auf einem Berg liegt, kann nicht verborgen sein.',
    'You are the light of the world. A city that is set on a hill cannot be hidden.'),
  v('john15-5', 'john', { c: 15, v: 5 },
    'Ich bin der Weinstock, ihr seid die Reben. Wer in mir bleibt und ich in ihm, der bringt viel Frucht, denn getrennt von mir könnt ihr nichts tun.',
    'I am the vine, you are the branches. He who abides in Me, and I in him, bears much fruit; for without Me you can do nothing.'),
  v('gal5-22', 'gal', { c: 5, v: 22, to: 23 },
    'Die Frucht des Geistes aber ist: Liebe, Freude, Friede, Langmut, Freundlichkeit, Güte, Treue, Sanftmut, Enthaltsamkeit. Gegen diese ist das Gesetz nicht gerichtet.',
    'But the fruit of the Spirit is love, joy, peace, longsuffering, kindness, goodness, faithfulness, gentleness, self-control. Against such there is no law.'),
  v('mic6-8', 'mic', { c: 6, v: 8 },
    'Er hat dir mitgeteilt, Mensch, was gut ist. Und was fordert der HERR von dir, als Recht zu üben und Güte zu lieben und demütig zu gehen mit deinem Gott?',
    'He has shown you, O man, what is good; And what does the LORD require of you But to do justly, To love mercy, And to walk humbly with your God?'),
  v('1cor13-13', '1cor', { c: 13, v: 13 },
    'Nun aber bleiben Glaube, Hoffnung, Liebe, diese drei; die größte aber von diesen ist die Liebe.',
    'And now abide faith, hope, love, these three; but the greatest of these is love.'),
  v('john13-34', 'john', { c: 13, v: 34 },
    'Ein neues Gebot gebe ich euch, dass ihr einander liebt, damit, wie ich euch geliebt habe, auch ihr einander liebt.',
    'A new commandment I give to you, that you love one another; as I have loved you, that you also love one another.'),
  v('1thess5-16', '1thess', { c: 5, v: 16, to: 18 },
    'Freut euch allezeit! Betet unablässig! Sagt in allem Dank! Denn dies ist der Wille Gottes in Christus Jesus für euch.',
    'Rejoice always, pray without ceasing, in everything give thanks; for this is the will of God in Christ Jesus for you.'),
  v('ps139-14', 'ps', { c: 139, v: 14 },
    'Ich preise dich darüber, dass ich auf eine erstaunliche, ausgezeichnete Weise gemacht bin. Wunderbar sind deine Werke, und meine Seele erkennt es sehr wohl.',
    'I will praise You, for I am fearfully and wonderfully made; Marvelous are Your works, And that my soul knows very well.'),
  v('heb11-1', 'heb', { c: 11, v: 1 },
    'Der Glaube aber ist eine Wirklichkeit dessen, was man hofft, ein Überführtsein von Dingen, die man nicht sieht.',
    'Now faith is the substance of things hoped for, the evidence of things not seen.'),
  v('john8-32', 'john', { c: 8, v: 32 },
    'und ihr werdet die Wahrheit erkennen, und die Wahrheit wird euch frei machen.',
    'And you shall know the truth, and the truth shall make you free.'),
]

export interface Path {
  id: string
  title: Record<TranslationId, string>
  subtitle: Record<TranslationId, string>
  /** Hue used for the path's accents (oklch hue angle). */
  hue: number
  verses: string[]
}

export const PATHS: Path[] = [
  {
    id: 'wurzeln',
    title: { elb: 'Wurzeln', nkjv: 'Roots' },
    subtitle: { elb: 'Das Wort, das trägt', nkjv: 'The Word that holds' },
    hue: 150,
    verses: ['ps119-11', 'ps119-105', 'john1-1', 'gen1-1', 'ps1-3', 'jas1-22', 'heb13-8'],
  },
  {
    id: 'fundament',
    title: { elb: 'Fundament', nkjv: 'Foundation' },
    subtitle: { elb: 'Die gute Nachricht', nkjv: 'The good news' },
    hue: 60,
    verses: ['john3-16', 'rom3-23', 'rom6-23', 'rom5-8', 'eph2-8', 'rom10-9', '1john1-9', '2cor5-17', 'john14-6', 'john11-25'],
  },
  {
    id: 'mut',
    title: { elb: 'Mut & Kraft', nkjv: 'Courage & Strength' },
    subtitle: { elb: 'Wenn es schwer wird', nkjv: 'When it gets hard' },
    hue: 30,
    verses: ['jos1-9', 'isa41-10', 'phil4-13', '2tim1-7', 'isa40-31', 'ps46-2'],
  },
  {
    id: 'frieden',
    title: { elb: 'Frieden', nkjv: 'Peace' },
    subtitle: { elb: 'Vertrauen statt Sorge', nkjv: 'Trust instead of worry' },
    hue: 220,
    verses: ['ps23-1', 'prov3-5', 'phil4-6', '1pet5-7', 'matt11-28', 'ps37-5', 'jer29-11', 'rom8-28'],
  },
  {
    id: 'licht',
    title: { elb: 'Leben im Licht', nkjv: 'Walking in Light' },
    subtitle: { elb: 'Nachfolge im Alltag', nkjv: 'Following day by day' },
    hue: 85,
    verses: ['rom12-2', 'matt6-33', 'matt5-14', 'john15-5', 'gal5-22', 'mic6-8', '1cor13-13', 'john13-34', '1thess5-16', 'ps139-14', 'heb11-1', 'john8-32'],
  },
]

export const COPYRIGHT: Record<TranslationId, { name: string; short: string; notice: string }> = {
  elb: {
    name: 'Elberfelder Bibel',
    short: 'ELB',
    notice:
      'Bibeltext: Elberfelder Bibel (Revision 2006, Textstand 33), © SCM R.Brockhaus in der SCM Verlagsgruppe GmbH, Witten/Holzgerlingen.',
  },
  nkjv: {
    name: 'New King James Version',
    short: 'NKJV',
    notice:
      'Scripture taken from the New King James Version®. Copyright © 1982 by Thomas Nelson. Used by permission. All rights reserved.',
  },
}

const spanText = (s: Span, sep: string) => `${s.c}${sep}${s.v}${s.to ? `–${s.to}` : ''}`

export function reference(verse: Verse, t: TranslationId): string {
  if (verse.custom) return verse.custom.label
  if (t === 'elb') return `${BOOKS[verse.book].elb} ${spanText(verse.ref, ',')}`
  return `${BOOKS[verse.book].nkjv} ${spanText(verse.refNkjv ?? verse.ref, ':')}`
}

export function bookName(verse: Verse, t: TranslationId): string {
  if (verse.custom) return verse.custom.label.replace(/\s*\d.*$/, '')
  return BOOKS[verse.book][t]
}

export function verseText(verse: Verse, t: TranslationId): string {
  return verse.text[t]
}
