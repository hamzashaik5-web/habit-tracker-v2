// OG Habit Tracker v2 - features: icons, quotes, chart, avatar, reminders
const STORAGE_KEY = "og_habits_v2";
const XP_PER = 10;
const XP_PER_LEVEL = 100;

let state = {
  habits: [], // each: {id,name,icon,freq,streak,lastDone,xp,history: [dates], reminder:{time,interval,active} }
  totalXP: 0,
  avatarStage: 0
};

// quotes library (themed)
const QUOTES = {
  default: [
    ["Small steps every day.","— OG"],
    ["Consistency builds momentum.","— OG"],
    ["Tiny progress > no progress.","— OG"],
    ["Do it for future you.","— OG"]
  ],
  fitness: [
    ["Push a little more today.","— OG"],
    ["Your body will thank you.","— OG"],
    ["One rep closer.","— OG"]
  ],
  mindfulness: [
    ["Breathe. Be present.","— OG"],
    ["Silence strengthens the mind.","— OG"],
    ["Softness is strength.","— OG"]
  ],
  learning: [
    ["Read to grow.","— OG"],
    ["Learn a little every day.","— OG"],
    ["Curiosity wins.","— OG"]
  ],
  social: [
    ["Reach out — someone needs you.","— OG"],
    ["A short hello keeps bonds alive.","— OG"]
  ]
};

// UI elems
const E = {};
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6) }

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) try{ state = JSON.parse(raw) }catch(e){}
  if(!state.habits) state.habits = [];
  if(!state.totalXP) state.totalXP = 0;
  if(!state.avatarStage) state.avatarStage = 0;
}

function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); }

// init UI refs
function initUI(){
  E.addBtn = document.getElementById("addBtn");
  E.addRow = document.getElementById("addRow");
  E.habitName = document.getElementById("habitName");
  E.iconSelect = document.getElementById("iconSelect");
  E.reminderTime = document.getElementById("reminderTime");
  E.reminderInterval = document.getElementById("reminderInterval");
  E.enableRem = document.getElementById("enableRem");
  E.saveHabit = document.getElementById("saveHabit");
  E.cancelAdd = document.getElementById("cancelAdd");
  E.habitsList = document.getElementById("habitsList");
  E.totalXP = document.getElementById("totalXP");
  E.level = document.getElementById("level");
  E.habitCount = document.getElementById("habitCount");
  E.template = document.getElementById("habitTemplate");
  E.confetti = document.getElementById("confetti");
  E.quoteModal = document.getElementById("quoteModal");
  E.quoteText = document.getElementById("quoteText");
  E.quoteBy = document.getElementById("quoteBy");
  E.closeQuote = document.getElementById("closeQuote");
  E.tabs = document.querySelectorAll(".tab");
  E.habitsTab = document.getElementById("habitsTab");
  E.progressTab = document.getElementById("progressTab");
  E.statsTab = document.getElementById("statsTab");
  E.habitSelectChart = document.getElementById("habitSelectChart");
  E.progressChart = document.getElementById("progressChart");
  E.insights = document.getElementById("insights");
  E.avatar = document.getElementById("avatar");
  E.chartLine = document.getElementById("chartLine");
  E.chartBar = document.getElementById("chartBar");

  // events
  E.addBtn.addEventListener("click", ()=> { E.addRow.hidden = !E.addRow.hidden; E.habitName.focus(); });
  E.cancelAdd.addEventListener("click", ()=> { E.addRow.hidden = true; clearAddForm(); });
  E.saveHabit.addEventListener("click", ()=> {
    const name = E.habitName.value.trim(); if(!name) return alert("Enter a habit name");
    const icon = E.iconSelect.value || "⭐";
    const time = E.reminderTime.value || "";
    const interval = parseInt(E.reminderInterval.value || "60",10);
    const remActive = !!E.enableRem.checked;
    const h = { id: uid(), name, icon, freq:"daily", streak:0, lastDone:null, xp:0, history: [], reminder:{time,interval,active:remActive} };
    state.habits.unshift(h); save(); clearAddForm(); E.addRow.hidden=true;
    populateHabitChartSelect();
  });
  E.closeQuote.addEventListener("click", ()=> { E.quoteModal.classList.add("hidden"); });
  // tabs
  E.tabs.forEach(t=> t.addEventListener("click", (e)=> {
    E.tabs.forEach(x=>x.classList.remove("active"));
    e.currentTarget.classList.add("active");
    const tab = e.currentTarget.dataset.tab;
    showTab(tab);
  }));
  E.habitSelectChart.addEventListener("change", ()=> drawChart());
  E.chartLine.addEventListener("click", ()=> switchChart("line"));
  E.chartBar.addEventListener("click", ()=> switchChart("bar"));

  // request notification permission
  if("Notification" in window){ Notification.requestPermission().then(()=>{}); }

  // start reminder checker
  setInterval(reminderTick, 60*1000); // every minute
  // also run once now
  reminderTick();
}

// helpers
function clearAddForm(){ E.habitName.value=""; E.reminderTime.value=""; E.reminderInterval.value="60"; E.enableRem.checked=true; E.iconSelect.value="📚"; }
function getToday(){ return new Date().toISOString().slice(0,10) }
function formatTimeHHMM(d){ return d.toTimeString().slice(0,5) }
function picksQuoteFor(habit){
  const key = habit.icon && ["💪","🏃"].includes(habit.icon) ? "fitness" : ["🧘"].includes(habit.icon) ? "mindfulness" : ["📚","🧠"].includes(habit.icon) ? "learning" : ["🤝"].includes(habit.icon) ? "social" : "default";
  const arr = QUOTES[key] || QUOTES.default;
  return arr[Math.floor(Math.random()*arr.length)];
}

function markDone(id){
  const h = state.habits.find(x=>x.id===id); if(!h) return;
  const today = getToday();
  if(h.lastDone === today){
    // undo
    h.lastDone = null;
    h.xp = Math.max(0, (h.xp||0)-XP_PER);
    state.totalXP = Math.max(0, state.totalXP - XP_PER);
    h.streak = Math.max(0, (h.streak||0)-1);
    save(); return;
  }
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  if(h.lastDone === yesterday) h.streak = (h.streak||0)+1; else h.streak = 1;
  h.lastDone = today; h.xp = (h.xp||0) + XP_PER; state.totalXP = (state.totalXP||0) + XP_PER;
  h.history = h.history || []; if(!h.history.includes(today)) h.history.push(today);
  // confetti and quote modal
  triggerConfetti(); const q = picksQuoteFor(h); E.quoteText.textContent = q[0]; E.quoteBy.textContent = q[1]; E.quoteModal.classList.remove("hidden");
  // avatar growth
  updateAvatar();
  // stop reminders for this habit
  // save and render
  save();
}

function triggerConfetti(){
  const confetti = E.confetti;
  for(let i=0;i<24;i++){
    const piece = document.createElement("div"); piece.className="piece";
    piece.style.left = Math.random()*100 + "%"; piece.style.background = `hsl(${Math.floor(Math.random()*360)} 80% 60%)`;
    piece.style.transform = `translateY(-200px) rotate(${Math.random()*360}deg)`;
    confetti.appendChild(piece);
    setTimeout(()=> piece.remove(), 1400);
  }
}

// render
function render(){
  E.habitsList.innerHTML = "";
  E.totalXP.textContent = state.totalXP || 0;
  E.level && (E.level.textContent = Math.floor((state.totalXP||0)/XP_PER_LEVEL));
  E.habitCount && (E.habitCount.textContent = state.habits.length);
  state.habits.forEach(h=>{
    const tpl = document.getElementById("habitTemplate").content.cloneNode(true);
    const card = tpl.querySelector(".habit-card");
    card.dataset.id = h.id;
    tpl.querySelector(".title .icon").textContent = h.icon || "⭐";
    tpl.querySelector(".title .name").textContent = h.name;
    tpl.querySelector(".meta").textContent = h.reminder && h.reminder.time ? `Remind: ${h.reminder.time}` : "No reminder";
    tpl.querySelector(".streakCount").textContent = h.streak || 0;
    tpl.querySelector(".xpVal").textContent = h.xp || 0;
    const progress = tpl.querySelector(".progress");
    const pct = Math.min(100, Math.round(((h.streak||0)/7)*100));
    progress.style.width = pct + "%";
    const check = tpl.querySelector(".check-btn");
    if(h.lastDone === getToday()){
      check.style.background = "linear-gradient(180deg,#e6fff4,#bff3d8)";
    } else check.style.background = "";
    check.addEventListener("click", ()=> markDone(h.id));
    tpl.querySelector(".del").addEventListener("click", ()=> { if(confirm("Delete habit?")) { deleteHabit(h.id); } });
    tpl.querySelector(".edit").addEventListener("click", ()=> {
      const newName = prompt("Edit habit name", h.name); if(newName===null) return;
      const newIcon = prompt("Icon (paste emoji) or leave", h.icon) || h.icon;
      h.name = newName.trim(); h.icon = newIcon; save();
    });
    E.habitsList.appendChild(tpl);
  });
  populateHabitChartSelect();
  drawInsights();
}

// delete
function deleteHabit(id){ state.habits = state.habits.filter(h=>h.id!==id); save(); populateHabitChartSelect(); }

// chart
let chart=null; function populateHabitChartSelect(){
  E.habitSelectChart.innerHTML = "";
  state.habits.forEach(h=>{
    const opt = document.createElement("option"); opt.value = h.id; opt.textContent = `${h.icon||"⭐"} ${h.name}`; E.habitSelectChart.appendChild(opt);
  });
  if(state.habits.length>0 && !E.habitSelectChart.value) E.habitSelectChart.value = state.habits[0].id;
  drawChart();
}

function drawChart(type="line"){
  if(!E.habitSelectChart.value) return;
  const hid = E.habitSelectChart.value; const h = state.habits.find(x=>x.id===hid); if(!h) return;
  // build last 30 days dataset
  const days = []; const labels = []; for(let i=29;i>=0;i--){ const d = new Date(Date.now()-i*86400000); const s = d.toISOString().slice(0,10); labels.push(s.slice(5)); days.push(h.history && h.history.includes(s) ? 1 : 0); }
  const ctx = document.getElementById("progressChart").getContext("2d");
  if(chart) chart.destroy();
  const cfg = {
    type: type,
    data: { labels, datasets: [{ label: 'Completed', data: days, borderWidth:1, fill:true, tension:0.3, backgroundColor:'rgba(142,124,249,0.12)', borderColor:'#8E7CF9', pointRadius:4 }] },
    options: { scales:{ y:{ ticks:{display:false}, min:0, max:1 } }, plugins:{ legend:{display:false} } }
  };
  chart = new Chart(ctx, cfg);
}

function switchChart(kind){
  drawChart(kind==="bar" ? "bar" : "line");
}

// insights
function drawInsights(){
  const insights = [];
  if(state.habits.length===0){ E.insights.innerHTML = "<div>No habits yet</div>"; return; }
  // most consistent (max average over last 7 days)
  state.habits.forEach(h=>{
    // count last 7 days
    let cnt=0; for(let i=0;i<7;i++){ const d = new Date(Date.now()-i*86400000).toISOString().slice(0,10); if(h.history && h.history.includes(d)) cnt++; }
    insights.push({name:h.name, cnt, streak:h.streak||0});
  });
  insights.sort((a,b)=>b.cnt-a.cnt);
  const top = insights[0];
  E.insights.innerHTML = `<div class="insight">Most consistent: <strong>${top.name}</strong> — ${top.cnt}/7 days</div>`;
  const longStreak = state.habits.reduce((p,c)=> c.streak>p.streak?c:p, {streak:0,name:"—"});
  E.insights.innerHTML += `<div class="insight">Longest streak: <strong>${longStreak.name}</strong> — ${longStreak.streak} days</div>`;
}

// reminders
function reminderTick(){
  const now = new Date();
  const curHM = now.toTimeString().slice(0,5);
  state.habits.forEach(h=>{
    if(!h.reminder || !h.reminder.active || !h.reminder.time) return;
    if(h.lastDone === getToday()) return;
    if(h._lastNotified && Date.now() - h._lastNotified < 1000*60*h.reminder.interval) return;
    if(curHM === h.reminder.time){
      pushReminder(h);
      h._lastNotified = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  });
}

// push notification & repeated until done
function pushReminder(h){
  const q = picksQuoteFor(h);
  const title = `${h.icon || ""} Time for: ${h.name}`;
  const body = q[0];
  if("Notification" in window && Notification.permission === "granted"){
    try{ new Notification(title, { body: body, tag: h.id }); }catch(e){ console.warn(e); }
  } else {
    E.quoteText.textContent = title + " — " + body; E.quoteModal.classList.remove("hidden");
  }
  const card = document.querySelector(`.habit-card[data-id="${h.id}"]`);
  if(card){ card.animate([{transform:'scale(1)'},{transform:'scale(1.03)'},{transform:'scale(1)'}], {duration:400}); }
}

// avatar growth
function updateAvatar(){
  const stages = ["🌱","🌿","🌳","🌲","🌟"];
  const lvl = Math.floor((state.totalXP||0)/100);
  state.avatarStage = Math.min(stages.length-1, lvl);
  E.avatar.textContent = stages[state.avatarStage] || "🌱";
}

// init
window.addEventListener("load", ()=>{
  load(); initUI(); render(); updateAvatar();
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
  populateHabitChartSelect();
});