# Barrierefreiheits-Baseline

Der technische Start verwendet semantische Landmarken, eine sichtbare Fokusführung, ausreichende Kontraste, Systemschrift, mindestens 16 px Basisgröße und eine responsive Einspaltenansicht ab kleinen Breiten.

Die UI-Primitives sichern native Link-/Button-Semantik, eine tokenbasierte
`focus-visible`-Darstellung, mindestens 44 px hohe Aktionsziele und sichtbaren Statustext
zusätzlich zu Farbindikatoren ab. Forced-Colors-Darstellung wird in den Basisstilen
berücksichtigt.

Playwright prüft den Demo-Kernweg auf Desktop, Mobil und 320 px. axe-core blockiert
automatisch erkennbare WCAG-A-/AA-Verstöße; der Tastatur-Sprunglink ist als Browserweg
abgesichert.

Eine WCAG-2.2-AA-/BITV-Abnahme ist damit nicht erfolgt. 200-%-Zoom, High Contrast,
Textabstände, Screenreader, die verbindliche Browsermatrix und Tests mit
Assistenztechnik-Nutzenden bleiben manuelle beziehungsweise organisatorische
Abnahmeschritte.
