document.documentElement.classList.add("js-enabled");

const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

function setMenuOpen(isOpen) {
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Zavrieť navigáciu" : "Otvoriť navigáciu");
  primaryNav.classList.toggle("is-open", isOpen);
}

menuToggle.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

primaryNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenuOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenuOpen(false);
});

const year = document.querySelector("#current-year");
year.textContent = String(new Date().getFullYear());

const revealItems = document.querySelectorAll(".reveal");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskStatus = document.querySelector("#task-status");
const taskStorageKey = "hurhov-web-tasks";
let tasks = [];
let taskStorageReady = true;

function showTaskStatus(message) {
  taskStatus.textContent = message;
}

function renderTasks() {
  taskList.replaceChildren();

  if (tasks.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "task-empty";
    emptyMessage.textContent = taskStorageReady
      ? "Zatiaľ tu nemáš žiadne úlohy."
      : "Zoznam úloh nie je dostupný.";
    taskList.append(emptyMessage);
    return;
  }

  tasks.forEach((task, index) => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " is-complete" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.className = "task-check";
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Označiť úlohu „${task.text}“ ako ${task.completed ? "nesplnenú" : "hotovú"}`);
    checkbox.addEventListener("change", () => {
      const updatedTasks = tasks.map((currentTask, taskIndex) => (
        taskIndex === index ? { ...currentTask, completed: checkbox.checked } : currentTask
      ));
      saveTasks(updatedTasks, checkbox.checked ? "Úloha je hotová." : "Úloha je znova nesplnená.");
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "task-delete";
    deleteButton.type = "button";
    deleteButton.textContent = "Vymazať";
    deleteButton.setAttribute("aria-label", `Vymazať úlohu „${task.text}“`);
    deleteButton.addEventListener("click", () => {
      const updatedTasks = tasks.filter((_, taskIndex) => taskIndex !== index);
      saveTasks(updatedTasks, "Úloha bola vymazaná.");
    });

    item.append(checkbox, text, deleteButton);
    taskList.append(item);
  });
}

function saveTasks(updatedTasks, successMessage) {
  try {
    window.localStorage.setItem(taskStorageKey, JSON.stringify(updatedTasks));
  } catch {
    showTaskStatus("Úlohu sa nepodarilo uložiť. Skontroluj nastavenia úložiska prehliadača a skús znova.");
    renderTasks();
    return false;
  }

  tasks = updatedTasks;
  renderTasks();
  showTaskStatus(successMessage);
  return true;
}

try {
  const savedTasks = window.localStorage.getItem(taskStorageKey);
  if (savedTasks !== null) {
    const parsedTasks = JSON.parse(savedTasks);
    if (!Array.isArray(parsedTasks) || parsedTasks.some((task) => (
      typeof task?.text !== "string" || typeof task?.completed !== "boolean"
    ))) {
      throw new Error("Neplatný formát uložených úloh.");
    }
    tasks = parsedTasks;
  }
} catch {
  taskStorageReady = false;
  taskForm.querySelectorAll("input, button").forEach((control) => {
    control.disabled = true;
  });
  showTaskStatus("Úlohy sa nepodarilo načítať z úložiska prehliadača. Zoznam nie je možné bezpečne upravovať.");
}

renderTasks();

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!taskStorageReady) return;

  const text = taskInput.value.trim();
  if (!text) {
    taskInput.focus();
    return;
  }

  if (saveTasks([...tasks, { text, completed: false }], "Úloha bola pridaná.")) {
    taskInput.value = "";
  }
});
