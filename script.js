const habitsContainer = document.getElementById('habitsContainer');
const habitNameInput = document.getElementById('habitName');
const addHabitButton = document.getElementById('addHabit');
const popup = document.getElementById('popup');
const popupQuote = document.getElementById('popupQuote');
const closePopup = document.getElementById('closePopup');
const chartSelect = document.getElementById('chartSelect');
const habitChartCtx = document.getElementById('habitChart').getContext('2d');

let habits = JSON.parse(localStorage.getItem('habits')) || {};
let currentChart = null;

const quotes = [
  'Keep going, you are building greatness!',
  'Each day counts. You’re leveling up!',
  'Discipline is destiny — keep it up!',
  'Tiny steps make huge impacts!',
  'Success is built on daily effort!'
];

function saveHabits() { localStorage.setItem('habits', JSON.stringify(habits)); renderHabits(); }

function renderHabits() {
  habitsContainer.innerHTML = '';
  for (let [name, data] of Object.entries(habits)) {
    const div = document.createElement('div');
    div.className = 'habit-item';
    div.innerHTML = `<span>${name} (${data.streak}🔥)</span>
      <button onclick="completeHabit('${name}')">Done</button>
      <button onclick="deleteHabit('${name}')">🗑</button>`;
    habitsContainer.appendChild(div);
  }
  populateChartSelect();
}

function addHabit() {
  const name = habitNameInput.value.trim();
  if (!name || habits[name]) return;
  habits[name] = { streak: 0, history: [] };
  saveHabits();
  habitNameInput.value = '';
}

function completeHabit(name) {
  const today = new Date().toLocaleDateString();
  if (habits[name].history.includes(today)) return;
  habits[name].history.push(today);
  habits[name].streak++;
  saveHabits();
  showPopup();
  updateChart(name);
}

function deleteHabit(name) {
  delete habits[name];
  saveHabits();
}

function showPopup() {
  popupQuote.innerText = quotes[Math.floor(Math.random() * quotes.length)];
  popup.classList.remove('hidden');
}

closePopup.onclick = () => popup.classList.add('hidden');

function populateChartSelect() {
  chartSelect.innerHTML = '';
  Object.keys(habits).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    chartSelect.appendChild(option);
  });
  if (chartSelect.value) updateChart(chartSelect.value);
}

chartSelect.onchange = () => updateChart(chartSelect.value);

function updateChart(name) {
  if (!name || !habits[name]) return;
  const labels = habits[name].history;
  const data = labels.map((_, i) => i + 1);
  if (currentChart) currentChart.destroy();
  currentChart = new Chart(habitChartCtx, {
    type: 'line',
    data: { labels, datasets: [{ label: name, data, borderColor: '#ffb6c1', fill: false, tension: 0.3 }] },
    options: { scales: { y: { beginAtZero: true } } }
  });
}

renderHabits();
