# BC.Game Dice Bot - Skrypt do Automatyzacji Gry

  <!-- Warto zrobić zrzut ekranu UI i wrzucić na imgur.com -->

## ⚠️ Zastrzeżenie (Disclaimer)

Ten skrypt został stworzony w celach **edukacyjnych i badawczych**, aby przetestować strategie zarządzania kapitałem w grach losowych. Używanie botów może być sprzeczne z regulaminem serwisów hazardowych i prowadzić do zablokowania konta.

**Używasz tego oprogramowania na własną odpowiedzialność. Autor nie ponosi odpowiedzialności za ewentualne straty finansowe.** Hazard może uzależniać. Graj odpowiedzialnie.

---

## O projekcie

Ten skrypt pozwala na automatyzację gry "Classic Dice" na platformie BC.Game. Użytkownik może konfigurować różne parametry, takie jak strategia obstawiania, limity zysku/straty oraz obserwować działanie bota w czasie rzeczywistym.

### Funkcje

- **Elastyczne strategie:** Łatwa zmiana strategii obstawiania (domyślnie Fibonacci).
- **Zarządzanie ryzykiem:** Wbudowane mechanizmy `stop-loss` i `stop-win`.
- **Analiza trendu:** Prosta strategia zmiany kierunku (Over/Under) na podstawie ostatnich rzutów.
- **Interfejs użytkownika:** Wygodne przyciski (Start/Pauza, Stop) dodawane bezpośrednio na stronie gry.
- **Zapis historii:** Możliwość zapisania pełnej historii rzutów do pliku `.txt` w celu późniejszej analizy.
- **Tryb cichy:** Opcja ukrycia szczegółowych logów w konsoli.

---

## Jak używać

1.  **Otwórz grę:** Przejdź do gry "Classic Dice" na stronie BC.Game.
2.  **Otwórz konsolę deweloperską:** Naciśnij klawisz `F12` (lub `Ctrl+Shift+I` / `Cmd+Opt+I`).
3.  **Skopiuj kod:** Otwórz plik `bot.js` z tego repozytorium, zaznacz i skopiuj całą jego zawartość.
4.  **Wklej i uruchom:** Wklej skopiowany kod do konsoli deweloperskiej i naciśnij `Enter`.
5.  **Steruj botem:** W prawym górnym rogu ekranu pojawią się przyciski do sterowania botem:
    - **▶️ / ❚❚:** Uruchamia lub pauzuje bota.
    - **S:** Zatrzymuje bota na stałe w danej sesji.
    - **💾:** Pobiera historię rzutów do pliku `dice_history_RRRR-MM-DD.txt`.

---

## Konfiguracja

Wszystkie parametry bota można łatwo zmienić na początku pliku `bot.js`:

```javascript
// === 1. PARAMETRY BOTA ===
const initial_bet_unit = 0.01; // Jednostka bazowa
const chance = 70;             // Szansa na wygraną w %
const stop_loss = -10;         // Próg straty
const stop_win = 20;           // Próg zysku
const trend_window = 5;        // Okno analizy trendu
const delay_between_rolls = 3000; // Opóźnienie w ms
const QUIET_MODE = true;       // Czy ukrywać logi?