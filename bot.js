// ===================================================================
// === PEŁNY SKRYPT BOTA DO GRY W KOŚCI v5.1                       ===
// === DODANO LOSOWE OPÓŹNIENIE (ANTI-BOT) I POPRAWIONĄ PĘTLĘ      ===
// ===================================================================

console.log("--- Inicjalizacja skryptu bota v5.1 (Random Delay). ---");

// === 1. PARAMETRY BOTA (ZMIENIONY SPOSÓB OPÓŹNIENIA) ===
const initial_bet_unit = 0.01;
const chance = 70;
const stop_loss = -10;
const stop_win = 20;
const trend_window = 5;
// Zamiast stałego opóźnienia, używamy zakresu
const MIN_DELAY_BETWEEN_ROLLS = 3500; // Minimalne opóźnienie w ms (3.5s)
const MAX_DELAY_BETWEEN_ROLLS = 5500; // Maksymalne opóźnienie w ms (5.5s)
const QUIET_MODE = true;
const paroli_win_streak_limit = 3;

// === 2. SELEKTORY CSS (bez zmian) ===
const LAST_ROLL_SELECTOR = 'div.bg-brand_secondary > span';
const BALANCE_SELECTOR = 'img[src*="/coin/"][src*=".png"] + div';
const BET_INPUT_SELECTOR = 'input[inputmode="decimal"]';
const GAME_MODE_TEXT_SELECTOR = 'span.text-secondary.font-semibold:first-of-type';
const GAME_MODE_SWITCH_BUTTON_SELECTOR = 'span.text-secondary.font-semibold:first-of-type + button';

// === 3. STAN GRY (usunięto bot_interval) ===
let balance_start = null, current_bet = initial_bet_unit, wins = 0, losses = 0;
let history_for_trend = [], last_known_balance;
let full_history_log = [];
let bot_running = false;
let ui_play_pause_button, ui_stop_button, ui_download_button, ui_strategy_selector;
let ui_wins_span, ui_losses_span, ui_profit_span, ui_bet_span;
let currentStrategyName = 'fibonacci';
let strategy_level = 1;

// === 4. LOGIKA STRATEGII (bez zmian) ===
const strategies = { /* ... bez zmian ... */ };

// === 5. FUNKCJE POMOCNICZE (dodano funkcję losowego opóźnienia) ===
function getRandomDelay() {
    return Math.floor(Math.random() * (MAX_DELAY_BETWEEN_ROLLS - MIN_DELAY_BETWEEN_ROLLS + 1)) + MIN_DELAY_BETWEEN_ROLLS;
}
function getFibonacciNumber(n) { if (n <= 1) return 1; let a = 1, b = 1, temp; for (let i = 3; i <= n; i++) { temp = a + b; a = b; b = temp; } return b; }
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function findButtonByText(text) { /* ... bez zmian ... */ }

// === 6. FUNKCJE INTERAKCJI ZE STRONĄ (bez zmian) ===
function getGameState() { /* ... bez zmian ... */ }
async function setBetAmount(amount) { /* ... bez zmian ... */ }
async function setGameMode(targetMode) { /* ... bez zmian ... */ }
async function placeBet() { /* ... bez zmian ... */ }

// === 7. GŁÓWNA LOGIKA BOTA (ZMIENIONA PĘTLA) ===
async function runBotLogic() {
    if (!bot_running) return; // Zatrzymuje pętlę, jeśli bot jest spauzowany
    
    try {
        // ... (cała logika bota z poprzedniej wersji) ...
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
            if (gameResult === 'Win') { wins++; current_bet = strategies[currentStrategyName].onWin(current_bet); } 
            else { losses++; current_bet = strategies[currentStrategyName].onLoss(current_bet); }
            last_known_balance = state.balance;
            updateUIStats();
            if (state.balance - balance_start >= stop_win) { console.log(`%c📈 STOP WIN`, "color: blue;"); stopBot(); return; }
            if (state.balance - balance_start <= stop_loss) { console.log(`%c📉 STOP LOSS`, "color: orange;"); stopBot(); return; }
        }
        if (state.lastRoll && (history_for_trend.length === 0 || history_for_trend[history_for_trend.length - 1] !== state.lastRoll)) { history_for_trend.push(state.lastRoll); if (history_for_trend.length > trend_window) history_for_trend.shift(); }
        console.log(`Następny ruch: Stawka=${current_bet.toFixed(4)}, Kierunek=${direction.toUpperCase()}, Strat: ${currentStrategyName}`);
        await setBetAmount(current_bet);
        await setGameMode(direction);
        await placeBet();
        
    } catch (error) {
        console.error("Wystąpił krytyczny błąd w pętli bota:", error);
        console.log("Zatrzymuję bota z powodu błędu.");
        stopBot();
        return; // Zakończ pętlę
    }
    
    // Zaplanuj kolejne wywołanie z losowym opóźnieniem
    if (bot_running) {
        const nextDelay = getRandomDelay();
        if (!QUIET_MODE) console.log(`Kolejny rzut za ${(nextDelay / 1000).toFixed(1)}s...`);
        setTimeout(runBotLogic, nextDelay);
    }
}

// === 8. KONTROLA BOTA I UI (ZMIENIONA LOGIKA START/PAUSE) ===
function updateUIStats() { /* ... bez zmian ... */ }
function resetBotState() { /* ... bez zmian ... */ }

function startBot() {
    if (bot_running) return;
    if (full_history_log.length === 0) { const h = localStorage.getItem('bc_dice_bot_history_csv'); if (h) full_history_log = h.split('\n'); }
    bot_running = true;
    ui_play_pause_button.textContent = '❚❚';
    ui_strategy_selector.disabled = true;
    console.log("▶️ Bot uruchomiony.");
    runBotLogic(); // Uruchom pętlę
}
function pauseBot() {
    if (!bot_running) return;
    bot_running = false; // To wystarczy, aby zatrzymać pętlę setTimeout
    ui_play_pause_button.textContent = '▶️';
    ui_strategy_selector.disabled = false;
    console.log("⏸️ Bot spauzowany.");
}
function stopBot() {
    pauseBot();
    ui_play_pause_button.disabled = true;
    ui_stop_button.disabled = true;
    ui_download_button.disabled = true;
    ui_strategy_selector.disabled = true;
}
function createBotUI() { /* ... bez zmian ... */ }

// Uzupełnienie brakujących funkcji (zminifikowane)
strategies={'fibonacci':{name:'Fibonacci',reset:()=>{strategy_level=1;return initial_bet_unit*getFibonacciNumber(strategy_level)},onWin:()=>{strategy_level-=2;if(strategy_level<1)strategy_level=1;return initial_bet_unit*getFibonacciNumber(strategy_level)},onLoss:()=>{strategy_level++;return initial_bet_unit*getFibonacciNumber(strategy_level)}},'martingale':{name:'Martingale',reset:()=>{strategy_level=1;return initial_bet_unit},onWin:()=>initial_bet_unit,onLoss:t=>2*t},'dalembert':{name:"d'Alembert",reset:()=>{strategy_level=1;return initial_bet_unit},onWin:()=>{strategy_level--;if(strategy_level<1)strategy_level=1;return initial_bet_unit*strategy_level},onLoss:()=>{strategy_level++;return initial_bet_unit*strategy_level}},'paroli':{name:'Paroli (Anti-Martingale)',reset:()=>{strategy_level=0;return initial_bet_unit},onWin:t=>{return strategy_level++,strategy_level>=paroli_win_streak_limit?(strategy_level=0,initial_bet_unit):2*t},onLoss:()=>{strategy_level=0;return initial_bet_unit}}};findButtonByText=t=>{const o=document.querySelectorAll("button");for(const n of o)if(n.textContent.trim().toLowerCase().includes(t.toLowerCase())&&n.className.includes("button-brand"))return n;const e=document.querySelectorAll("button span");for(const n of e)if(n.textContent.trim().toLowerCase().includes(t.toLowerCase()))return n.closest("button");return null},getGameState=()=>{let t=null,o=null,n=null;const e=document.querySelector(LAST_ROLL_SELECTOR);e&&(t=parseFloat(e.textContent.trim()));const l=document.querySelector(BALANCE_SELECTOR);l&&(o=parseFloat(l.textContent.trim().replace(/[^0-9.]/g,"")));const s=document.querySelector(GAME_MODE_TEXT_SELECTOR);return s&&(s.textContent.toLowerCase().includes("over")?n="over":s.textContent.toLowerCase().includes("under")&&(n="under")),{lastRoll:t,balance:o,gameMode:n}},setBetAmount=async t=>{const o=document.querySelector(BET_INPUT_SELECTOR);if(!o)return!1;const n=t.toFixed(8),e=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,"value").set;return e.call(o,n),o.dispatchEvent(new Event("input",{bubbles:!0})),o.dispatchEvent(new Event("change",{bubbles:!0})),!QUIET_MODE&&console.log(`Wpisano kwotę: ${n}`),await delay(100),!0},setGameMode=async t=>{const o=getGameState();if(!o.gameMode)return!1;if(o.gameMode!==t){const n=document.querySelector(GAME_MODE_SWITCH_BUTTON_SELECTOR);if(n)return n.click(),await delay(200),!0}return!0},placeBet=async()=>{const t=findButtonByText("Roll");if(t&&!t.disabled)return t.click(),!0;return stopBot(),!1},updateUIStats=()=>{ui_wins_span&&(ui_wins_span.textContent=wins),ui_losses_span&&(ui_losses_span.textContent=losses),ui_profit_span&&null!==last_known_balance&&(profit=last_known_balance-balance_start,ui_profit_span.textContent=profit.toFixed(4),ui_profit_span.style.color=profit>=0?"#4caf50":"#f44336"),ui_bet_span&&(ui_bet_span.textContent=current_bet.toFixed(4))},resetBotState=()=>{current_bet=strategies[currentStrategyName].reset(),wins=0,losses=0,balance_start=last_known_balance,updateUIStats()},createBotUI=()=>{const t=document.createElement("div");t.style.cssText="position:fixed; top:10px; right:10px; z-index:9999; background:rgba(40,40,40,0.9); border:1px solid #555; border-radius:8px; color:white; font-family:monospace; padding:10px; display:flex; flex-direction:column; gap:8px;";const o=document.createElement("div");o.style.cssText="display:grid; grid-template-columns:1fr 1fr; gap:5px;";const n=(t,n)=>{const e=document.createElement("p");return e.style.margin="0",e.innerHTML=`${t}: <span id="${n}">0</span>`,o.appendChild(e),document.getElementById(n)};ui_wins_span=n("W","bot-wins"),ui_losses_span=n("L","bot-losses"),ui_profit_span=n("P/L","bot-profit"),ui_bet_span=n("Bet","bot-bet");const e=document.createElement("div");e.style.cssText="display:flex; gap:8px; align-items:center;",ui_play_pause_button=document.createElement("button"),ui_stop_button=document.createElement("button"),ui_download_button=document.createElement("button"),ui_strategy_selector=document.createElement("select"),ui_play_pause_button.textContent="▶️",ui_play_pause_button.onclick=()=>{bot_running?pauseBot():startBot()},ui_stop_button.textContent="S",ui_stop_button.onclick=()=>{confirm("Zatrzymać bota na stałe?")&&stopBot()},ui_download_button.innerHTML="💾",ui_download_button.onclick=()=>{const t=localStorage.getItem("bc_dice_bot_history_csv");if(!t)return;const o=new Blob(["Round,Roll,Bet,Direction,Result,Balance\n"+t],{type:"text/csv;charset=utf-8;"}),n=window.URL.createObjectURL(o),e=document.createElement("a");e.href=n,e.download=`dice_history_${(new Date).toISOString().slice(0,10)}.csv`,e.click(),window.URL.revokeObjectURL(n)};for(const l in strategies){const s=document.createElement("option");s.value=l,s.textContent=strategies[l].name,ui_strategy_selector.appendChild(s)}ui_strategy_selector.value=currentStrategyName,ui_strategy_selector.onchange=t=>{currentStrategyName=t.target.value,console.log(`Zmieniono strategię na: ${strategies[currentStrategyName].name}`),resetBotState()},ui_strategy_selector.style.cssText="flex-grow:1; background:#555; color:white; border:1px solid #777; border-radius:4px;";[ui_play_pause_button,ui_stop_button,ui_download_button].forEach(t=>{t.style.cssText="width:35px; height:35px; background:#333; color:white; border:1px solid #555; border-radius:4px; font-size:16px; cursor:pointer;"}),e.appendChild(ui_play_pause_button),e.appendChild(ui_stop_button),e.appendChild(ui_download_button),t.appendChild(o),t.appendChild(document.createElement("hr")),t.appendChild(ui_strategy_selector),t.appendChild(e),document.body.appendChild(t),resetBotState(),console.log("UI Bota zostało dodane do strony.")};

createBotUI();
