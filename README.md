# Shinobi Duel

Juego de combate por turnos 2D en el navegador (HTML5, CSS3 y JavaScript puro, sin librerías) con personajes de Naruto (Naruto, Sasuke, Rock Lee, Gaara, Kakashi, Itachi, Tsunade y Jiraiya). Elige a un shinobi y derrota a cinco rivales aleatorios en un torneo: hay diálogos entre combates, gestión de vida y chakra, estados (aturdimiento, quemadura, mejoras) y una IA rival básica.

## Cómo jugar
Los módulos ES y `fetch` necesitan un servidor local (no funciona abriendo el `index.html` con doble clic):
- VS Code: extensión **Live Server** → "Open with Live Server".
- O desde la carpeta del proyecto: `python -m http.server` y abrir http://localhost:8000.

Controles: ratón o teclas `1`-`6` para elegir habilidad, clic/`Enter` para avanzar diálogos.

## Arquitectura (POO)
| Clase | Responsabilidad |
|---|---|
| `Game` | Orquesta el flujo: menú, historia, combates y resultado |
| `BattleSystem` | Reglas del combate (turnos, daño, estados). Devuelve eventos, no toca el DOM |
| `Fighter` | Estado de un personaje (vida, chakra, buffs, estados) |
| `Skill` | Datos de una habilidad |
| `EnemyAI` | Decide la acción del rival |
| `DialogueManager` | Diálogos con efecto máquina de escribir |
| `UIManager` | Todo el DOM: pantallas, barras, animaciones, registro |
| `AudioManager` | Efectos de sonido sintetizados con Web Audio |

Personajes, habilidades y textos de historia están en `data/game.json`.

## Créditos
- Naruto y sus personajes © Masashi Kishimoto / Shueisha. Proyecto educativo sin ánimo de lucro.
- Retratos: imágenes en `assets/characters/` (ver el README de esa carpeta). Si falta alguna, se muestra un kanji sobre un degradado.
- Imágenes de personajes: añade aquí la fuente de cada una (web y autor).
- Sonidos generados con Web Audio, sin archivos de audio externos.
