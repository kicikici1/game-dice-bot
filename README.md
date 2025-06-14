# BC.Game Dice Bot

An educational script to automate and test strategies for the BC.Game "Classic Dice" game.

 
<!-- Sugestia: Zrób zrzut ekranu UI bota, wgraj na https://imgur.com/upload i wklej tutaj link -->

## ⚠️ Disclaimer

This script is intended for **educational and research purposes only**. It was created to test various capital management strategies in a game of chance. Using bots may be against the Terms of Service (ToS) of the platform and could lead to account suspension.

**Use this software at your own risk. The author assumes no responsibility for any financial losses incurred.** Gambling can be addictive. Please play responsibly.

---

## About The Project

This script allows for the automation of the "Classic Dice" game on the BC.Game platform. It enables users to configure various parameters, such as betting strategies and risk management limits, and to observe the bot's performance in real-time.

### Features

-   **Flexible Strategies:** Easily implement and switch between different betting strategies (default is Fibonacci).
-   **Risk Management:** Built-in `stop-loss` and `stop-win` mechanisms to protect your bankroll.
-   **Trend Analysis:** A simple strategy to switch between betting Over/Under based on recent roll history.
-   **User Interface (UI):** A convenient on-screen overlay with Start/Pause, Stop, and Download buttons.
-   **History Logging:** Saves the complete game history to a `.csv` file for later analysis in spreadsheet software.
-   **Quiet Mode:** An option to hide detailed step-by-step logs from the console for a cleaner view.

---

## How to Use

1.  **Open the Game:** Navigate to the "Classic Dice" game on the BC.Game website.
2.  **Open the Developer Console:** Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Opt+I` (Mac).
3.  **Copy the Code:** Open the `bot.js` file from this repository, select all its content, and copy it to your clipboard.
4.  **Paste and Run:** Paste the copied code into the developer console and press `Enter`. This will load the bot and its UI.
5.  **Control the Bot:** Use the buttons in the top-right corner of the screen to control the bot:
    -   **▶️ / ❚❚:** Starts or pauses the bot.
    -   **S:** Permanently stops the bot for the current session.
    -   **💾:** Downloads the session history to a `dice_history_YYYY-MM-DD.csv` file.

---

## Configuration

All bot parameters can be easily configured at the beginning of the `bot.js` file:

```javascript
// === 1. BOT PARAMETERS ===
const initial_bet_unit = 0.01;      // The base unit for betting strategies
const chance = 70;                  // Target win chance in %
const stop_loss = -10;              // Stop if the balance drops by this amount
const stop_win = 20;                // Stop if the balance increases by this amount
const trend_window = 5;             // How many recent rolls to analyze for the trend
const delay_between_rolls = 3000;   // Delay between bets in milliseconds
const QUIET_MODE = true;            // Set to true to hide detailed console logs
