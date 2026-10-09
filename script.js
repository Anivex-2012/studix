const dateInput = document.getElementById("selectedDate");
const taskForm = document.getElementById("taskForm");
const titleInput = document.getElementById("taskTitle");
const timeInput = document.getElementById("taskTime");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressCount = document.getElementById("progressCount");
const totalCount = document.getElementById("totalCount");
const doneCount = document.getElementById("doneCount");
const dateLabel = document.getElementById("dateLabel");
const filterButtons = document.querySelectorAll(".filter-btn");

const STORAGE_KEY = "dayplan-tasks-v1";

let activeFilter = "all";
let allTasks = loadTasks();

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.warn("Previous tasks could not be loaded.", error);
    return {};
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTasks));
  } catch (error) {
    alert(
      "Tasks could not be saved. Please check your browser settings."
    );
  }
}

function tasksForSelectedDate() {
  return allTasks[dateInput.value] || [];
}

function formatSelectedDate() {
  const selected = new Date(`${dateInput.value}T12:00:00`);

  if (Number.isNaN(selected.getTime())) {
    return "Daily Plan";
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(selected);
}

function render() {
  const tasks = tasksForSelectedDate();
  const done = tasks.filter(task => task.done).length;

  const percent = tasks.length
    ? Math.round((done / tasks.length) * 100)
    : 0;

  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;
  progressCount.textContent = `${done} of ${tasks.length} tasks`;

  totalCount.textContent = tasks.length;
  doneCount.textContent = done;
  dateLabel.textContent = formatSelectedDate();

  const filtered = tasks
    .filter(task => {
      if (activeFilter === "active") return !task.done;
      if (activeFilter === "done") return task.done;
      return true;
    })
    .sort((a, b) => {
      if (!a.time && !b.time) {
        return a.createdAt - b.createdAt;
      }

      if (!a.time) return 1;
      if (!b.time) return -1;

      return a.time.localeCompare(b.time);
    });

  taskList.replaceChildren();

  filtered.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item${task.done ? " is-done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.done;
    checkbox.setAttribute(
      "aria-label",
      `Toggle completion for ${task.title}`
    );

    checkbox.addEventListener("change", () => {
      updateTask(task.id, { done: checkbox.checked });
    });

    const info = document.createElement("div");
    info.className = "task-info";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    info.appendChild(title);

    if (task.time) {
      const time = document.createElement("span");
      time.className = "task-time";
      time.textContent = `◷  ${task.time}`;
      info.appendChild(time);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-btn";
    remove.textContent = "×";
    remove.title = "Delete task";
    remove.setAttribute("aria-label", `Delete ${task.title}`);

    remove.addEventListener("click", () => {
      deleteTask(task.id);
    });

    item.append(checkbox, info, remove);
    taskList.appendChild(item);
  });

  emptyState.classList.toggle("visible", filtered.length === 0);

  if (tasks.length && filtered.length === 0) {
    emptyState.querySelector("strong").textContent =
      "No tasks in this filter";

    emptyState.querySelector("p").textContent =
      "Try selecting a different filter.";
  } else {
    emptyState.querySelector("strong").textContent =
      "No tasks yet";

    emptyState.querySelector("p").textContent =
      "Add your first task and get started!";
  }
}

function updateTask(id, changes) {
  const date = dateInput.value;

  allTasks[date] = (allTasks[date] || []).map(task =>
    task.id === id ? { ...task, ...changes } : task
  );

  saveTasks();
  render();
}

function deleteTask(id) {
  const date = dateInput.value;

  allTasks[date] = (allTasks[date] || []).filter(
    task => task.id !== id
  );

  saveTasks();
  render();
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = titleInput.value.trim();

  if (!title) {
    titleInput.focus();
    return;
  }

  const date = dateInput.value;

  if (!allTasks[date]) {
    allTasks[date] = [];
  }

  allTasks[date].push({
    id:
      window.crypto && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    title,
    time: timeInput.value,
    done: false,
    createdAt: Date.now()
  });

  saveTasks();
  taskForm.reset();
  titleInput.focus();

  render();
});

dateInput.addEventListener("change", render);

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    filterButtons.forEach(item => {
      item.classList.toggle("active", item === button);
    });

    render();
  });
});

dateInput.value = localDateString();

render();

