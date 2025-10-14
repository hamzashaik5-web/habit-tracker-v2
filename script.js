
// --- Element references ---
const E = {
    habitsList: document.getElementById("habits-list"),
    addHabitBtn: document.getElementById("add-habit-btn"),
    habitNameInput: document.getElementById("habit-name"),
    habitIconInput: document.getElementById("habit-icon"),
    habitColorInput: document.getElementById("habit-color"),
    quoteModal: document.getElementById("quote-modal"),
    quoteText: document.getElementById("quote-text"),
    quoteBy: document.getElementById("quote-by"),
    closeQuote: document.getElementById("close-quote"),
    confetti: document.getElementById("confetti"),
    chartCanvas: document.getElementById("progress-chart"),
    avatar: document.getElementById("avatar"),
};

let habits = JSON.parse(localStorage.getItem("habits")) || [];
let totalXP = parseInt(localStorage.getItem("totalXP")) || 0;

// --- Motivational quotes library ---
const quotes = [
    { text: "Great job!", by: "Habit Tracker" },
    { text: "Keep it up, you're leveling!", by: "Motivation" },
    { text: "Consistency is power!", by: "Wise Words" },
    { text: "Every step counts!", by: "Encouragement" },
    { text: "You're doing amazing!", by: "App" }
];

// --- Utility functions ---
function saveHabits() {
    localStorage.setItem("habits", JSON.stringify(habits));
    localStorage.setItem("totalXP", totalXP);
}

function triggerConfetti() {
    const confetti = E.confetti;
    confetti.innerHTML = "";
    for (let i = 0; i < 12; i++) {
        const piece = document.createElement("div");
        piece.className = "piece";
        piece.style.left = Math.random() * 100 + "%";
        piece.style.background = `hsl(${Math.floor(Math.random() * 360)} 80% 60%)`;
        piece.style.transform = `translateY(-200px) rotate(${Math.random() * 360}deg)`;
        confetti.appendChild(piece);
        setTimeout(() => piece.remove(), 1400);
    }
}

function showQuote() {
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    E.quoteText.textContent = q.text;
    E.quoteBy.textContent = q.by;
    E.quoteModal.classList.remove("hidden");
    triggerConfetti();
}

// --- Habit completion ---
function completeHabit(index) {
    habits[index].completed = true;
    habits[index].streak = (habits[index].streak || 0) + 1;
    totalXP += 10;
    saveHabits();
    renderHabits();
    showQuote();
    updateAvatar();
}

// --- Render habits ---
function renderHabits() {
    E.habitsList.innerHTML = "";
    habits.forEach((h, i) => {
        const li = document.createElement("li");
        li.className = "habit-card";
        li.style.background = h.color || "#FFF";
        li.innerHTML = `
            <span class="icon">${h.icon || "⭐"}</span>
            <span class="name">${h.name}</span>
            <button class="complete-btn">${h.completed ? "✔️" : "Mark"}</button>
        `;
        li.querySelector(".complete-btn").addEventListener("click", () => completeHabit(i));
        E.habitsList.appendChild(li);
    });
}

// --- Add habit ---
E.addHabitBtn.addEventListener("click", () => {
    const name = E.habitNameInput.value.trim();
    if (!name) return alert("Enter habit name");
    habits.push({
        name,
        icon: E.habitIconInput.value || "⭐",
        color: E.habitColorInput.value || "#BFD7EA",
        completed: false,
        streak: 0,
        points: 0
    });
    saveHabits();
    renderHabits();
    E.habitNameInput.value = "";
});

// --- Modal close ---
E.closeQuote.addEventListener("click", () => {
    E.quoteModal.classList.add("hidden");
    E.quoteText.textContent = "";
    E.quoteBy.textContent = "";
});

// --- Avatar update ---
function updateAvatar() {
    const level = Math.floor(totalXP / 50);
    const stages = ["😐","🙂","😎","🦸","👑"];
    E.avatar.textContent = stages[Math.min(level, stages.length-1)];
}

// --- Chart rendering ---
function renderChart() {
    const labels = habits.map(h => h.name);
    const data = habits.map(h => h.streak || 0);
    if (window.progressChart) window.progressChart.destroy();
    window.progressChart = new Chart(E.chartCanvas, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Streaks', data, backgroundColor: 'rgba(100,149,237,0.6)' }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

// --- Initialize ---
renderHabits();
updateAvatar();
renderChart();
