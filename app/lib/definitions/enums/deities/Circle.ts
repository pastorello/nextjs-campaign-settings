/**
 * Thematic magic circles from the original setting design.
 *
 * **Deliberately kept although nothing imports it.** Spells were first meant to
 * be grouped into these circles; the design later moved to D&D 5e subclasses
 * doing that job, and the `circolo` field now holds subclass ids while showing
 * the label "Sottoclassi". This list is the surviving half of the older idea
 * and is expected to come back in a future direction of the game.
 *
 * Do not remove it as dead code. See CLAUDE.md, "Decisions and rejected
 * approaches".
 */
enum Circle {
  Incubo = "Incubo",
  Illusione = "Illusione",
  NonMorti = "Non Morti",
  Aberrazioni = "Aberrazioni",
  Maledizioni = "Maledizioni",
  Ombra = "Ombra",
  Ammaliamento = "Ammaliamento",
  Fede = "Fede",
  Veleno = "Veleno",
  Luce = "Luce",
  Oracolo = "Oracolo",
  Sogni = "Sogni",
  Magnetismo = "Magnetismo",
  Tempo = "Tempo",
  Rune = "Rune",
  Aria = "Aria",
  Esorcismo = "Esorcismo",
  Terra = "Terra",
  Fuoco = "Fuoco",
  Acqua = "Acqua",
  Natura = "Natura",
  Sole = "Sole",
  Infinito = "Infinito",
}

export default Circle;
