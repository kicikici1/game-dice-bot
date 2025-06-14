// ===================================================================
// === PEŁNY SKRYPT BOTA DO GRY W KOŚCI v5.0                       ===
// === DODANO DASHBOARD ZE STATYSTYKAMI I WYBÓR STRATEGII          ===
// ===================================================================

console.log("--- Inicjalizacja skryptu bota v5.0 (Dashboard & Multi-Strategy). ---");

// === 1. PARAMETRY BOTA ===
const initial_bet_unit = 0.01;
const chance = 70;
const stop_loss = -10;
const stop_win = 20;
const trend_window = 5;
const delay_between_rolls = 3000;
const QUIET_MODE = true;
const paroli_win_streak_limit = 3; // Limit wygranych z rzędu dla strategii Paroli

// === 2. SELEKTORY CSS (bez zmian) ===
const LAST_ROLL_SELECTOR = 'div.bg-brand_secondary > span';
const BALANCE_SELECTOR = 'img[src*="/coin/"][src*=".png"] + div';
const BET_INPUT_SELECTOR = 'input[inputmode="decimal"]';
const GAME_MODE_TEXT_SELECTOR = 'span.text-secondary.font-semibold:first-of-type';
const GAME_MODE_SWITCH_BUTTON_SELECTOR = 'span.text-secondary.font-semibold:first-of-type + button';

// === 3. STAN GRY (rozbudowany) ===
let balance_start = null, current_bet = initial_bet_unit, wins = 0, losses = 0;
let history_for_trend = [], last_known_balance;
let full_history_log = [];
let bot_running = false, bot_interval;
let ui_play_pause_button, ui_stop_button, ui_download_button, ui_strategy_selector;
let ui_wins_span, ui_losses_span, ui_profit_span, ui_bet_span;
// Zmienne strategii
let currentStrategyName = 'fibonacci'; // Domyślna strategia
let strategy_level = 1; // Uniwersalny 'poziom' dla strategii (Fibo, d'Alembert, Paroli)

// === 4. LOGIKA STRATEGII (NOWA, MODUŁOWA STRUKTURA) ===
const strategies = {
    'fibonacci': {
        name: 'Fibonacci',
        reset: () => { strategy_level = 1; return initial_bet_unit * getFibonacciNumber(strategy_level); },
        onWin: () => {
            strategy_level -= 2;
            if (strategy_level < 1) strategy_level = 1;
            return initial_bet_unit * getFibonacciNumber(strategy_level);
        },
        onLoss: () => {
            strategy_level++;
            return initial_bet_unit * getFibonacciNumber(strategy_level);
        }
    },
    'martingale': {
        name: 'Martingale',
        reset: () => { strategy_level = 1; return initial_bet_unit; },
        onWin: () => initial_bet_unit,
        onLoss: (currentBet) => currentBet * 2
    },
    'dalembert': {
        name: "d'Alembert",
        reset: () => { strategy_level = 1; return initial_bet_unit; },
        onWin: () => {
            strategy_level--;
            if (strategy_level < 1) strategy_level = 1;
            return initial_bet_unit * strategy_level;
        },
        onLoss: () => {
            strategy_level++;
            return initial_bet_unit * strategy_level;
        }
    },
    'paroli': {
        name: 'Paroli (Anti-Martingale)',
        reset: () => { strategy_level = 0; return initial_bet_unit; }, // level to licznik wygranych
        onWin: (currentBet) => {
            strategy_level++;
            if (strategy_level >= paroli_win_streak_limit) {
                strategy_level = 0; // Reset serii
                return initial_bet_unit;
            }
            return currentBet * 2;
        },
        onLoss: () => {
            strategy_level = 0; // Reset serii
            return initial_bet_unit;
        }
    }
};

// === 5. FUNKCJE POMOCNICZE ===
function getFibonacciNumber(n) { if (n <= 1) return 1; let a = 1, b = 1, temp; for (let i = 3; i <= n; i++) { temp = a + b; a = b; b = temp; } return b; }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function findButtonByText(text) { const btns=document.querySelectorAll("button");for(const b of btns)if(b.textContent.trim().toLowerCase().includes(text.toLowerCase())&&b.className.includes("button-brand"))return b;const spans=document.querySelectorAll("button span");for(const s of spans)if(s.textContent.trim().toLowerCase().includes(text.toLowerCase()))return s.closest("button");return null; }

// === 6. FUNKCJE INTERAKCJI ZE STRONĄ ===
function getGameState() { let r=null,b=null,m=null;const lr=document.querySelector(LAST_ROLL_SELECTOR);lr&&(r=parseFloat(lr.textContent.trim()));const be=document.querySelector(BALANCE_SELECTOR);be&&(b=parseFloat(be.textContent.trim().replace(/[^0-9.]/g,"")));const me=document.querySelector(GAME_MODE_TEXT_SELECTOR);return me&&(me.textContent.toLowerCase().includes("over")?m="over":me.textContent.toLowerCase().includes("under")&&(m="under")),{lastRoll:r,balance:b,gameMode:m}; }
async function setBetAmount(amount) { const i=document.querySelector(BET_INPUT_SELECTOR);if(!i)return!1;const v=amount.toFixed(8),s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;s.call(i,v),i.dispatchEvent(new Event("input",{bubbles:!0})),i.dispatchEvent(new Event("change",{bubbles:!0}));if(!QUIET_MODE)console.log(`Wpisano kwotę: ${v}`);await delay(100);return!0; }
async function setGameMode(targetMode) { const s=getGameState();if(!s.gameMode)return!1;if(s.gameMode!==targetMode){const b=document.querySelector(GAME_MODE_SWITCH_BUTTON_SELECTOR);if(b){b.click();await delay(200);return!0;}}return!0; }
async function placeBet() { const b=findButtonByText("Roll");if(b&&!b.disabled){b.click();return!0;}stopBot();return!1; }

// === 7. GŁÓWNA LOGIKA BOTA (używa obiektu strategii) ===
async function runBotLogic() {
    if (!bot_running) return;
    const state = getGameState();
    const betToPlace = current_bet;
    const direction = history_for_trend.length >= trend_window ? (history_for_trend.reduce((a, b) => a + b, 0) / history_for_trend.length < 50 ? 'over' : 'under') : 'over';

    if (balance_start === null && state.balance !== null) { balance_start = state.balance; last_known_balance = state.balance; }

    if (state.balance !== null && state.balance !== last_known_balance) {
        const profit = state.balance - last_known_balance;
        const gameResult = profit > 0 ? 'Win' : 'Loss';
        
        const logEntry = [full_history_log.length+1, state.lastRoll, betToPlace.toFixed(4), direction.toUpperCase(), gameResult, state.balance.toFixed(4)].join(',');
        full_history_log.push(logEntry);
        localStorage.setItem('bc_dice_bot_history_csv', full_history_log.join('\n'));
        
        if (gameResult === 'Win') {
            wins++;
            current_bet = strategies[currentStrategyName].onWin(current_bet);
        } else {
            losses++;
            current_bet = strategies[currentStrategyName].onLoss(current_bet);
        }
        
        last_known_balance = state.balance;
        updateUIStats(); // Aktualizuj statystyki w UI
        
        if (state.balance - balance_start >= stop_win) { console.log(`%c📈 STOP WIN`, "color: blue;"); stopBot(); return; }
        if (state.balance - balance_start <= stop_loss) { console.log(`%c📉 STOP LOSS`, "color: orange;"); stopBot(); return; }
    }
    
    if (state.lastRoll && (history_for_trend.length === 0 || history_for_trend[history_for_trend.length - 1] !== state.lastRoll)) {
        history_for_trend.push(state.lastRoll);
        if (history_for_trend.length > trend_window) history_for_trend.shift();
    }

    console.log(`Następny ruch: Stawka=${current_bet.toFixed(4)}, Kierunek=${direction.toUpperCase()}, Strat: ${currentStrategyName}`);
    
    await setBetAmount(current_bet);
    await setGameMode(direction);
    await placeBet();
}

// === 8. KONTROLA BOTA I UI ===
function updateUIStats() {
    if (ui_wins_span) ui_wins_span.textContent = wins;
    if (ui_losses_span) ui_losses_span.textContent = losses;
    if (ui_profit_span && last_known_balance !== null) {
        const profit = last_known_balance - balance_start;
        ui_profit_span.textContent = profit.toFixed(4);
        ui_profit_span.style.color = profit >= 0 ? '#4caf50' : '#f44336';
    }
    if (ui_bet_span) ui_bet_span.textContent = current_bet.toFixed(4);
}
function resetBotState() {
    current_bet = strategies[currentStrategyName].reset();
    wins = 0;
    losses = 0;
    balance_start = last_known_balance; // Reset P/L
    updateUIStats();
}
function startBot() { if(bot_running)return; if(full_history_log.length === 0){ const h = localStorage.getItem('bc_dice_bot_history_csv'); if(h) full_history_log=h.split('\n'); } bot_running = true; ui_play_pause_button.textContent = '❚❚'; ui_strategy_selector.disabled = true; runBotLogic(); bot_interval = setInterval(runBotLogic, delay_between_rolls); }
function pauseBot() { if(!bot_running)return; bot_running=false; clearInterval(bot_interval); ui_play_pause_button.textContent = '▶️'; ui_strategy_selector.disabled = false; }
function stopBot() { pauseBot(); ui_play_pause_button.disabled = true; ui_stop_button.disabled = true; ui_download_button.disabled = true; ui_strategy_selector.disabled = true; }
function createBotUI() {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed; top:10px; right:10px; z-index:9999; background:rgba(40,40,40,0.9); border:1px solid #555; border-radius:8px; color:white; font-family:monospace; padding:10px; display:flex; flex-direction:column; gap:8px;';

    // Sekcja statystyk
    const statsContainer = document.createElement('div');
    statsContainer.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:5px;';
    
    const createStat = (label, id) => {
        const p = document.createElement('p');
        p.style.margin = '0';
        p.innerHTML = `${label}: <span id="${id}">0</span>`;
        statsContainer.appendChild(p);
        return document.getElementById(id);
    };

    ui_wins_span = createStat('W', 'bot-wins');
    ui_losses_span = createStat('L', 'bot-losses');
    ui_profit_span = createStat('P/L', 'bot-profit');
    ui_bet_span = createStat('Bet', 'bot-bet');

    // Sekcja kontrolek
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = 'display:flex; gap:8px; align-items:center;';

    ui_play_pause_button = document.createElement('button');
    ui_stop_button = document.createElement('button');
    ui_download_button = document.createElement('button');
    ui_strategy_selector = document.createElement('select');

    // Konfiguracja przycisków
    ui_play_pause_button.textContent = '▶️';
    ui_play_pause_button.onclick = () => { bot_running ? pauseBot() : startBot(); };
    ui_stop_button.textContent = 'S';
    ui_stop_button.onclick = () => { if (confirm("Zatrzymać bota na stałe?")) stopBot(); };
    ui_download_button.innerHTML = '💾';
    ui_download_button.onclick = () => {
        const data = localStorage.getItem('bc_dice_bot_history_csv'); if(!data)return;
        const blob = new Blob(["Round,Roll,Bet,Direction,Result,Balance\n" + data], {type:'text/csv;charset=utf-8;'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url; a.download=`dice_history_${new Date().toISOString().slice(0,10)}.csv`;
        a.click(); window.URL.revokeObjectURL(url);
    };
    
    // Konfiguracja menu strategii
    for (const key in strategies) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = strategies[key].name;
        ui_strategy_selector.appendChild(option);
    }
    ui_strategy_selector.value = currentStrategyName;
    ui_strategy_selector.onchange = (e) => {
        currentStrategyName = e.target.value;
        console.log(`Zmieniono strategię na: ${strategies[currentStrategyName].name}`);
        resetBotState();
    };
    ui_strategy_selector.style.cssText = 'flex-grow:1; background:#555; color:white; border:1px solid #777; border-radius:4px;';
    
    [ui_play_pause_button, ui_stop_button, ui_download_button].forEach(b => {
        b.style.cssText = 'width:35px; height:35px; background:#333; color:white; border:1px solid #555; border-radius:4px; font-size:16px; cursor:pointer;';
    });
    
    controlsContainer.appendChild(ui_play_pause_button);
    controlsContainer.appendChild(ui_stop_button);
    controlsContainer.appendChild(ui_download_button);

    container.appendChild(statsContainer);
    container.appendChild(document.createElement('hr'));
    container.appendChild(ui_strategy_selector);
    container.appendChild(controlsContainer);
    
    document.body.appendChild(container);
    resetBotState(); // Zainicjuj UI
    console.log("UI Bota zostało dodane do strony.");
}

createBotUI();
