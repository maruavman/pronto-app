(() => {
  const KEY = "pronto.tasks.v1";
  const THEME_KEY = "pronto.theme.v1";
  let tasks = loadTasks();
  let currentFilter = "all";
  let toastTimer;
  const $ = (id) => document.getElementById(id);
  const list = $("taskList");
  const backdrop = $("modalBackdrop");
  const form = $("taskForm");

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(saved) ? saved.filter(t => t && typeof t.title === "string") : [];
    } catch { return []; }
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(tasks));
      $("storageLabel").textContent = "Salvo neste aparelho";
    } catch {
      $("storageLabel").textContent = "Não foi possível salvar";
      showToast("O armazenamento do navegador está cheio.");
    }
  }
  function money(value) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
  }
  function dateLabel() {
    return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date()).replace("-feira", "");
  }
  function render() {
    const active = tasks.filter(t => !t.completed);
    const urgent = active.filter(t => t.urgent);
    const paid = active.filter(t => t.paid);
    $("urgentCount").textContent = urgent.length;
    $("paidCount").textContent = paid.length;
    $("allCount").textContent = active.length;
    $("budgetTotal").textContent = money(paid.reduce((sum, t) => sum + (Number(t.cost) || 0), 0));
    $("todayLabel").textContent = dateLabel().toLocaleUpperCase("pt-BR");
    $("summaryText").textContent = active.length ? `${active.length} ${active.length === 1 ? "tarefa esperando" : "tarefas esperando"} por você.` : "Adicione uma tarefa e tire isso da cabeça.";
    const filterTitles = { all: "Sua lista", urgent: "Urgentes", paid: "Com gasto", completed: "Concluídas" };
    $("listTitle").textContent = filterTitles[currentFilter];
    document.querySelectorAll("[data-filter]").forEach(btn => {
      const activeButton = btn.dataset.filter === currentFilter;
      if (btn.classList.contains("filter")) btn.classList.toggle("active", activeButton);
      if (btn.classList.contains("overview-card")) btn.setAttribute("aria-pressed", String(activeButton));
    });
    let shown = tasks.filter(t => {
      if (currentFilter === "all") return !t.completed;
      if (currentFilter === "urgent") return !t.completed && t.urgent;
      if (currentFilter === "paid") return !t.completed && t.paid;
      return t.completed;
    });
    shown.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
    });
    $("visibleCount").textContent = shown.length;
    list.replaceChildren();
    shown.forEach(task => list.appendChild(makeTaskCard(task)));
    const empty = shown.length === 0;
    $("emptyState").style.display = empty ? "block" : "none";
    list.style.display = empty ? "none" : "grid";
    $("emptyState").querySelector("h3").textContent = ({
      all: "Nada por aqui ainda", urgent: "Sem urgências", paid: "Nada aguardando orçamento", completed: "Ainda sem tarefas concluídas"
    })[currentFilter];
    $("emptyState").querySelector("p").textContent = ({
      all: "Comece adicionando uma tarefa. O resto fica mais fácil quando sai da cabeça.",
      urgent: "Nenhuma tarefa marcada como urgente. Você pode respirar.",
      paid: "Nenhuma tarefa com gasto pendente no momento.",
      completed: "Quando você concluir tarefas, elas vão aparecer aqui."
    })[currentFilter];
    $("emptyAddButton").style.display = currentFilter === "all" ? "" : "none";
  }
  function makeTaskCard(task) {
    const card = document.createElement("article");
    card.className = "task-card" + (task.completed ? " is-completed" : "");
    const check = document.createElement("button");
    check.className = "check-button" + (task.completed ? " done" : "");
    check.setAttribute("aria-label", task.completed ? "Reabrir tarefa" : "Concluir tarefa");
    check.textContent = task.completed ? "✓" : "○";
    check.addEventListener("click", () => {
      task.completed = !task.completed; task.updatedAt = Date.now(); persist(); render();
      showToast(task.completed ? "Tarefa concluída" : "Tarefa reaberta");
    });
    const main = document.createElement("div");
    main.className = "task-main";
    main.addEventListener("click", () => openEditor(task.id));
    const title = document.createElement("div");
    title.className = "task-title"; title.textContent = task.title;
    main.appendChild(title);
    if (task.notes && task.notes.trim()) {
      const notes = document.createElement("div"); notes.className = "task-notes"; notes.textContent = task.notes; main.appendChild(notes);
    }
    const tags = document.createElement("div"); tags.className = "tags";
    if (task.urgent) tags.appendChild(tag("↯  Urgente", "urgent"));
    if (task.paid) tags.appendChild(tag(task.cost > 0 ? "＄  " + money(task.cost) : "＄  Com gasto", "paid"));
    if (tags.childNodes.length) main.appendChild(tags);
    const more = document.createElement("button"); more.className = "more-button"; more.textContent = "···"; more.setAttribute("aria-label", "Opções da tarefa");
    more.addEventListener("click", () => {
      const existing = card.querySelector(".task-menu");
      if (existing) { existing.remove(); return; }
      const menu = document.createElement("div"); menu.className = "task-menu";
      const edit = document.createElement("button"); edit.className = "mini-button"; edit.textContent = "Editar"; edit.onclick = () => openEditor(task.id);
      const toggle = document.createElement("button"); toggle.className = "mini-button"; toggle.textContent = task.completed ? "Reabrir" : "Concluir"; toggle.onclick = () => { task.completed = !task.completed; task.updatedAt = Date.now(); persist(); render(); };
      const del = document.createElement("button"); del.className = "mini-button delete"; del.textContent = "Excluir"; del.onclick = () => { tasks = tasks.filter(t => t.id !== task.id); persist(); render(); showToast("Tarefa excluída"); };
      menu.append(edit, toggle, del); card.appendChild(menu);
    });
    card.append(check, main, more);
    return card;
  }
  function tag(text, kind) {
    const span = document.createElement("span"); span.className = "tag " + kind; span.textContent = text; return span;
  }
  function openModal() {
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => $("taskTitle").focus(), 80);
  }
  function closeModal() {
    backdrop.hidden = true; document.body.style.overflow = "";
    form.reset(); $("taskId").value = ""; $("modalTitle").textContent = "Nova tarefa";
    $("saveButton").textContent = "Salvar tarefa"; $("costField").hidden = true; $("formError").textContent = "";
  }
  function openEditor(id) {
    const task = tasks.find(t => t.id === id);
    form.reset(); $("formError").textContent = "";
    if (task) {
      $("taskId").value = task.id; $("taskTitle").value = task.title; $("taskNotes").value = task.notes || "";
      $("taskUrgent").checked = !!task.urgent; $("taskPaid").checked = !!task.paid;
      $("taskCost").value = task.cost ? String(task.cost).replace(".", ",") : "";
      $("modalTitle").textContent = "Editar tarefa"; $("saveButton").textContent = "Salvar alterações";
      $("costField").hidden = !task.paid;
    } else {
      $("modalTitle").textContent = "Nova tarefa"; $("saveButton").textContent = "Salvar tarefa";
      $("costField").hidden = true;
    }
    openModal();
  }
  function parseCost(input) {
    const cleaned = String(input || "").trim().replace(/\s/g, "").replace(/^R\$/i, "");
    if (!cleaned) return 0;
    let normalized;
    if (cleaned.includes(",")) normalized = cleaned.replace(/\./g, "").replace(",", ".");
    else normalized = cleaned;
    const n = Number(normalized);
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
  }
  function showToast(message) {
    const toast = $("toast"); toast.textContent = message; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2100);
  }

  $("addButton").addEventListener("click", () => openEditor(null));
  $("emptyAddButton").addEventListener("click", () => openEditor(null));
  $("closeModal").addEventListener("click", closeModal);
  $("cancelButton").addEventListener("click", closeModal);
  backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModal(); });
  $("taskPaid").addEventListener("change", e => { $("costField").hidden = !e.target.checked; });
  document.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click", () => { currentFilter = btn.dataset.filter; render(); }));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const title = $("taskTitle").value.trim();
    if (!title) { $("formError").textContent = "Digite o nome da tarefa."; return; }
    const paid = $("taskPaid").checked;
    const cost = parseCost($("taskCost").value);
    if (paid && cost === null) { $("formError").textContent = "Informe um custo válido, como 35,90."; return; }
    const id = $("taskId").value;
    if (id) {
      const task = tasks.find(t => t.id === id);
      if (task) Object.assign(task, { title, notes: $("taskNotes").value.trim(), urgent: $("taskUrgent").checked, paid, cost: paid ? cost : 0, updatedAt: Date.now() });
      showToast("Tarefa atualizada");
    } else {
      tasks.push({ id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()), title, notes: $("taskNotes").value.trim(), urgent: $("taskUrgent").checked, paid, cost: paid ? cost : 0, completed: false, createdAt: Date.now(), updatedAt: Date.now() });
      showToast("Tarefa adicionada");
    }
    persist(); closeModal(); render();
  });
  $("themeButton").addEventListener("click", () => {
    const isDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    $("themeIcon").textContent = isDark ? "☼" : "◐";
    document.querySelector('meta[name="theme-color"]').content = isDark ? "#101114" : "#f5f5f7";
  });
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark" || (!savedTheme && matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark"); $("themeIcon").textContent = "☼";
    document.querySelector('meta[name="theme-color"]').content = "#101114";
  }
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
  render();
})();