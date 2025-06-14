// ===================================================================
// === PEŁNY SKRYPT BOTA DO GRY W KOŚCI v4.2                       ===
// === DODANO ZAPIS HISTORII DO PLIKU TXT I PAMIĘCI PRZEGLĄDARKI   ===
// ===================================================================

console.log("--- Inicjalizacja skryptu bota v4.2 (Fibonacci, Zapis Historii). Użyj przycisków w rogu ekranu. ---");

// === 1. PARAMETRY BOTA ===
const initial_bet_unit = 0.01;
const chance = 70;
const stop_loss = -10;
const stop_win = 20;
const trend_window = 5;
const delay_between_rolls = 3000;
const QUIET_MODE = true;

// === 2. SELEKTORY CSS (bez zmian) ===
const LAST_ROLL_SELECTOR = 'div.bg-brand_secondary > span';
const BALANCE_SELECTOR = 'img[src*="/coin/"][src*=".png"] + div';
const BET_INPUT_SELECTOR = 'input[inputmode="decimal"]';
const GAME_MODE_TEXT_SELECTOR = 'span.text-secondary.font-semibold:first-of-type';
const GAME_MODE_SWITCH_BUTTON_SELECTOR = 'span.text-secondary.font-semibold:first-of-type + button';

// === 3. STAN GRY (dodano pełną historię) ===
let balance_start = null, current_bet = initial_bet_unit, wins = 0, losses = 0;
let history_for_trend = [], last_known_balance; // Zmieniono nazwę, aby było jasne
let full_history = []; // NOWA: Przechowuje WSZYSTKIE rzuty sesji
let bot_running = false, bot_interval;
let ui_play_pause_button, ui_stop_button, ui_download_button;
let fibonacci_level = 1;

// === 4. FUNKCJE POMOCNICZE (bez zmian) ===
function getFibonacciNumber(n) { if (n <= 1) return 1; let a = 1, b = 1, temp; for (let i = 3; i <= n; i++) { temp = a + b; a = b; b = temp; } return b; }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function findButtonByText(text) { /* ... bez zmian ... */ }

// === 5. FUNKCJE INTERAKCJI ZE STRONĄ (bez zmian) ===
function getGameState() { /* ... bez zmian ... */ }
async function setBetAmount(amount) { /* ... bez zmian ... */ }
async function setGameMode(targetMode) { /* ... bez zmian ... */ }
async function placeBet() { /* ... bez zmian ... */ }

// === 6. GŁÓWNA LOGIKA BOTA (dodano zapis do historii) ===
async function runBotLogic() {
    if (!bot_running) return;
    if (!QUIET_MODE) console.log("--- Kolejna iteracja bota (Fibonacci) ---");
    const state = getGameState();
    
    // Inicjalizacja...
    if (balance_start === null && state.balance !== null) { /* ... bez zmian ... */ }

    // Wykrywanie wyniku...
    if (state.balance !== null && state.balance !== last_known_balance) { /* ... bez zmian ... */ }

    // NOWA SEKCJA: ZAPIS DO HISTORII
    if (state.lastRoll && (full_history.length === 0 || full_history[full_history.length - 1] !== state.lastRoll)) {
        full_history.push(state.lastRoll); // Dodaj do pełnej historii
        history_for_trend.push(state.lastRoll); // Dodaj do historii dla trendu
        if (history_for_trend.length > trend_window) {
            history_for_trend.shift(); // Utrzymuj historię dla trendu o stałej długości
        }
        // Zapisz pełną historię w pamięci przeglądarki
        localStorage.setItem('bc_dice_bot_history', JSON.stringify(full_history));
        if (!QUIET_MODE) console.log(`Zapisano rzut ${state.lastRoll}. Całkowita liczba rzutów: ${full_history.length}`);
    }

    // Analiza trendu
    let target_over = true;
    if (history_for_trend.length >= trend_window) {
        const avg = history_for_trend.reduce((a, b) => a + b, 0) / history_for_trend.length;
        target_over = (avg < 50);
    }
    const targetMode = target_over ? 'over' : 'under';
    
    console.log(`Następny ruch: Stawka=${current_bet.toFixed(4)} (Fibo: ${fibonacci_level}), Kierunek=${targetMode.toUpperCase()}`);
    
    await setBetAmount(current_bet);
    await setGameMode(targetMode);
    await placeBet();
}


// === 7. KONTROLA BOTA (dodano ładowanie historii przy starcie) ===
function startBot() {
    if (bot_running) return;
    
    // Przy pierwszym uruchomieniu, spróbuj załadować historię z poprzedniej sesji
    if (full_history.length === 0) {
        const savedHistory = localStorage.getItem('bc_dice_bot_history');
        if (savedHistory) {
            full_history = JSON.parse(savedHistory);
            console.log(`Załadowano ${full_history.length} rzutów z poprzedniej sesji.`);
        }
    }
    
    bot_running = true;
    console.log("▶️ Bot uruchomiony/wznowiony.");
    ui_play_pause_button.textContent = '❚❚';
    ui_play_pause_button.style.color = '#ffc107';
    runBotLogic();
    bot_interval = setInterval(runBotLogic, delay_between_rolls);
}
function pauseBot() { /* ... bez zmian ... */ }
function stopBot() { /* ... bez zmian ... */ }

// === 8. INTERFEJS UŻYTKOWNIKA (UI) (dodano przycisk pobierania) ===
function createBotUI() {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.gap = '8px';

    // Przycisk Play/Pause
    ui_play_pause_button = document.createElement('button');
    ui_play_pause_button.textContent = '▶️';
    ui_play_pause_button.onclick = () => { bot_running ? pauseBot() : startBot(); };
    
    // Przycisk Stop
    ui_stop_button = document.createElement('button');
    ui_stop_button.textContent = 'S';
    ui_stop_button.onclick = () => { if (confirm("Czy na pewno chcesz ostatecznie zatrzymać bota?")) stopBot(); };

    // NOWY Przycisk Pobierz Historię
    ui_download_button = document.createElement('button');
    ui_download_button.innerHTML = '💾'; // Ikona dyskietki
    ui_download_button.title = 'Pobierz historię rzutów';
    ui_download_button.onclick = () => {
        const dataToSave = localStorage.getItem('bc_dice_bot_history');
        if (!dataToSave || dataToSave === '[]') {
            alert("Brak historii do zapisania.");
            return;
        }
        const historyArray = JSON.parse(dataToSave);
        const formattedData = historyArray.join('\n'); // Każdy rzut w nowej linii
        const blob = new Blob([formattedData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dice_history_${new Date().toISOString().slice(0,10)}.txt`; // Nazwa pliku z datą
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`Pobrano historię zawierającą ${historyArray.length} rzutów.`);
    };

    // Style...
    [ui_play_pause_button, ui_stop_button, ui_download_button].forEach(button => {
        button.style.width = '40px';
        button.style.height = '40px';
        button.style.backgroundColor = '#333';
        button.style.color = 'white';
        button.style.border = '2px solid #555';
        button.style.borderRadius = '50%';
        button.style.fontSize = '18px';
        button.style.fontWeight = 'bold';
        button.style.cursor = 'pointer';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        container.appendChild(button);
    });
    
    ui_play_pause_button.style.color = '#4caf50';
    ui_stop_button.style.color = '#f44336';
    ui_download_button.style.color = '#2196F3'; // Niebieski dla pobierania

    document.body.appendChild(container);
    console.log("UI Bota zostało dodane do strony.");
}

// Uzupełnienie brakujących funkcji (zminifikowane)
findButtonByText=t=>{const o=document.querySelectorAll("button");for(const n of o)if(n.textContent.trim().toLowerCase().includes(t.toLowerCase())&&n.className.includes("button-brand"))return n;const e=document.querySelectorAll("button span");for(const n of e)if(n.textContent.trim().toLowerCase().includes(t.toLowerCase()))return n.closest("button");return null},getGameState=()=>{let t=null,o=null,n=null;const e=document.querySelector(LAST_ROLL_SELECTOR);e&&(t=parseFloat(e.textContent.trim()));const c=document.querySelector(BALANCE_SELECTOR);c&&(o=parseFloat(c.textContent.trim().replace(/[^0-9.]/g,"")));const r=document.querySelector(GAME_MODE_TEXT_SELECTOR);return r&&(r.textContent.toLowerCase().includes("over")?n="over":r.textContent.toLowerCase().includes("under")&&(n="under")),{lastRoll:t,balance:o,gameMode:n}},setBetAmount=async t=>{const o=document.querySelector(BET_INPUT_SELECTOR);if(!o)return console.error("Błąd: Nie znaleziono pola wprowadzania kwoty zakładu."),!1;const n=t.toFixed(8),e=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;return e.call(o,n),o.dispatchEvent(new Event("input",{bubbles:!0})),o.dispatchEvent(new Event("change",{bubbles:!0})),!QUIET_MODE&&console.log(`Wpisano kwotę: ${n}`),await delay(100),!0},setGameMode=async t=>{const o=getGameState();if(!o.gameMode)return console.error("Nie udało się odczytać aktualnego trybu gry."),!1;if(o.gameMode!==t){!QUIET_MODE&&console.log(`Zmieniam tryb gry z ${o.gameMode} na ${t}...`);const n=document.querySelector(GAME_MODE_SWITCH_BUTTON_SELECTOR);if(n)return n.click(),await delay(200),!0;console.error("Nie znaleziono przycisku do zmiany trybu gry.")}return!0},placeBet=async()=>{!QUIET_MODE&&console.log("Szukam przycisku 'Roll'...");const t=findButtonByText("Roll");return t&&!t.disabled?(!QUIET_MODE&&console.log("Znaleziono przycisk 'Roll', klikam..."),t.click(),!0):(console.error("Nie znaleziono lub przycisk 'Roll' jest nieaktywny."),stopBot(),!1)},pauseBot=()=>{bot_running&&(bot_running=!1,clearInterval(bot_interval),console.log("⏸️ Bot spauzowany."),ui_play_pause_button.textContent="▶️",ui_play_pause_button.style.color="#4caf50")},stopBot=()=>{pauseBot(),console.log("🛑 Bot ostatecznie zatrzymany."),ui_play_pause_button.disabled=!0,ui_stop_button.disabled=!0,ui_download_button&&(ui_download_button.style.opacity=.5)};runBotLogic=async function(){if(!bot_running)return;!QUIET_MODE&&console.log("--- Kolejna iteracja bota (Fibonacci) ---");const t=getGameState();null===balance_start&&null!==t.balance&&(balance_start=t.balance,last_known_balance=t.balance,current_bet=initial_bet_unit*getFibonacciNumber(fibonacci_level),console.log(`Ustawiono początkowe saldo: ${balance_start}. Stawka startowa: ${current_bet.toFixed(4)}`)),null!==t.balance&&t.balance!==last_known_balance&&(t.balance-last_known_balance>0?(wins++,console.log(`%cWYGRANA! Zysk: ${(t.balance-last_known_balance).toFixed(4)}.`, "color: green; font-weight: bold;"),fibonacci_level-=2,fibonacci_level<1&&(fibonacci_level=1),!QUIET_MODE&&console.log(`Cofam poziom Fibonacciego do: ${fibonacci_level}`)):(losses++,console.log(`%cPRZEGRANA. Strata: ${(t.balance-last_known_balance).toFixed(4)}.`, "color: red; font-weight: bold;"),fibonacci_level++,!QUIET_MODE&&console.log(`Zwiększam poziom Fibonacciego do: ${fibonacci_level}`)),current_bet=initial_bet_unit*getFibonacciNumber(fibonacci_level),last_known_balance=t.balance,t.balance-balance_start>=stop_win?(console.log("%c📈 STOP WIN OSIĄGNIĘTY!","color: blue;"),stopBot()):t.balance-balance_start<=stop_loss&&(console.log("%c📉 STOP LOSS OSIĄGNIĘTY!","color: orange;"),stopBot())),t.lastRoll&&(0===full_history.length||full_history[full_history.length-1]!==t.lastRoll)&&(full_history.push(t.lastRoll),history_for_trend.push(t.lastRoll),history_for_trend.length>trend_window&&history_for_trend.shift(),localStorage.setItem("bc_dice_bot_history",JSON.stringify(full_history)),!QUIET_MODE&&console.log(`Zapisano rzut ${t.lastRoll}. Całkowita liczba rzutów: ${full_history.length}`));let o=!0;history_for_trend.length>=trend_window&&(o=history_for_trend.reduce((t,o)=>t+o,0)/history_for_trend.length<50);const n=o?"over":"under";console.log(`Następny ruch: Stawka=${current_bet.toFixed(4)} (Fibo: ${fibonacci_level}), Kierunek=${n.toUpperCase()}`),await setBetAmount(current_bet),await setGameMode(n),await placeBet()};

createBotUI();