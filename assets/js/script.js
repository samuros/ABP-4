import { MASTER_KEY, ACCESS_KEY, BIN_ID } from "./var.js";

class TaskManager {
  constructor() {
    this.tBody = document.querySelector("#tasks-table tbody");
    this.saveTaskButton = document.querySelector("#button-save-new-task");
    this.inputNew = document.querySelector("#input-text-new-task");
    this.inputEdit = document.querySelector("#input-text-edit-task");
    this.editTaskButton = document.querySelector("#button-save-edit-task");
    this.modals = document.querySelectorAll(".modal");
    this.editingTaskId = null;
    this.tasks = [];

    // Parámetros que se le deben enviar a la API  según la documentación
    this.apiData = {
      url: () => `https://api.jsonbin.io/v3/b/${BIN_ID}`,
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": MASTER_KEY,
        "X-Access-Key": ACCESS_KEY,
      },
    };
  }

  async init() {
    this.registerEventListeners();
    this.tasks = await this.getTasks();
    this.renderTasks(this.tasks);

    // Renderiza las tareas automaticamente cada un minuto
    setInterval(() => {
      this.renderTasks(this.tasks);
    }, 60000);
  }

  // Lee las tareas del objeto guardado en el BIN de la API
  async readTasksOnApi() {
    try {
      const res = await fetch(`${this.apiData.url()}/latest`, {
        method: "GET",
        headers: this.apiData.headers,
      });
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      if (!Array.isArray(data.record)) {
        return null;
      }
      return data.record;
    } catch (err) {
      return null;
    }
  }

  // Guarda las tareas en la API
  async saveTasksOnApi(tasks) {
    try {
      const dataToSave =
        Array.isArray(tasks) && tasks.length === 0 ? { tasks: [] } : { tasks };
      const res = await fetch(this.apiData.url(), {
        method: "PUT",
        headers: this.apiData.headers,
        body: JSON.stringify(dataToSave),
      });
      if (!res.ok) {
        console.error("Error API:", res.status, await res.text());
        return false;
      }
      const data = await res.json();
      console.log("Datos guardados:", data);
      return true;
    } catch (err) {
      console.error("Ocurrió un error inesperado:", err);
      return false;
    }
  }

  // Lee los datos guardados en el almacenamiento persistente del navegador
  readLocalStorage() {
    const memoryTasks = localStorage.getItem("memoryTasks");
    if (!memoryTasks) {
      return [];
    }
    try {
      const tasks = JSON.parse(memoryTasks);
      if (!Array.isArray(tasks)) {
        return [];
      }
      return tasks;
    } catch (err) {
      return [];
    }
  }

  // Transforma a string y guarda los datos en el almacenamiento persistente
  saveLocalStorage(tasks) {
    localStorage.setItem("memoryTasks", JSON.stringify(tasks));
  }

  // Obtén las tareas de la API, si la API no está disponible usa .localStorage
  async getTasks() {
    const apiTasks = await this.readTasksOnApi();
    if (apiTasks !== null) {
      this.saveLocalStorage(apiTasks);
      return apiTasks;
    }
    return this.readLocalStorage();
  }

  // Envía los datos efectivamente a la API y guarda en el almacenamiento persistente
  async saveTasks(tasks) {
    this.tasks = tasks;
    await this.saveTasksOnApi(tasks);
    this.saveLocalStorage(tasks);
  }

  // Crea el id de la tarea (autoincrementable)
  createTaskId(tasks = this.tasks) {
    if (tasks.length === 0) {
      return 1;
    }
    return Math.max(...tasks.map((t) => Number(t.id))) + 1;
  }

  // Gestión de tareas con límite de tiempo
  getDeadlineStatus(deadlineString) {
    if (!deadlineString)
      return { text: "Sin límite", badgeClass: "bg-secondary" };

    const now = new Date();
    const deadline = new Date(deadlineString);
    const diffMs = deadline - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
      return { text: "Vencida", badgeClass: "bg-danger" };
    } else if (diffHours <= 24) {
      return { text: "Por vencer", badgeClass: "bg-warning text-dark" };
    } else {
      return { text: "A tiempo", badgeClass: "bg-success" };
    }
  }

  // Renderiza las tareas en la tabla del DOM
  renderTasks(tasks = this.tasks) {
    this.tBody.innerHTML = "";
    if (!tasks || tasks.length === 0) {
      this.tBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        ℹ No hay tareas registradas
                    </td>
                </tr>`;
      return;
    }
    tasks.forEach((t) => {
      const status = this.getDeadlineStatus(t.deadline);
      const formattedDate = t.deadline
        ? new Date(t.deadline).toLocaleString()
        : "Sin fecha";

      this.tBody.innerHTML += `
                <tr>
                    <th scope="row">${t.id}</th>
                    <td>${t.task}</td>
                    <td>
                        <small class="d-block text-muted">${formattedDate}</small>
                        <span class="badge ${status.badgeClass}">${status.text}</span>
                    </td>
                    <td class="text-center ">
                        <button
                            role="button"
                            title="Eliminar tarea"
                            data-id="${t.id}"
                            class="task-del btn btn-transparent border-0"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                class="bi bi-trash"
                                viewBox="0 0 16 16"
                            >
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                            </svg>
                        </button>
                        <button
                            role="button"
                            title="Editar tarea"
                            class="task-edit btn btn-transparent border-0"
                            type="button"
                            data-id="${t.id}"
                            data-bs-toggle="modal"
                            data-bs-target="#edit-task-modal"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                fill="currentColor"
                                class="bi bi-pen"
                                viewBox="0 0 16 16"
                            >
                                <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001m-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708z"/>
                            </svg>
                        </button>
                    </td>
                </tr>`;
    });
  }

  // Actualiza el listado de las tareas sin las tareas eliminadas (filtradas)
  async deleteTask(id) {
    const tasks = await this.getTasks();
    const updatedTasks = tasks.filter((t) => Number(t.id) !== Number(id));
    await this.saveTasks(updatedTasks);
    this.renderTasks(updatedTasks);
  }

  // Actualiza la tarea editada con el valor del modal actualizado por el usuario
  async editTask(id) {
    const tasks = await this.getTasks();
    const currentTask = tasks.find((t) => Number(t.id) === Number(id));
    if (!currentTask || typeof currentTask !== "object") {
      return;
    }
    this.editingTaskId = id;
    const modalBody = document.querySelector("#edit-task-modal .modal-body");
    if (modalBody) {
      const deadlineVal = currentTask.deadline || "";
      modalBody.innerHTML = `
                <div class="mb-3">
                    <label for="input-text-edit-task" class="form-label">Tarea</label>
                    <input
                        type="text"
                        id="input-text-edit-task"
                        class="form-control"
                        value="${currentTask.task}"
                        aria-label="Campo editar tarea"
                    />
                </div>
                <div class="mb-3">
                    <label for="input-date-edit-task" class="form-label">Fecha Límite</label>
                    <input
                        type="datetime-local"
                        id="input-date-edit-task"
                        class="form-control"
                        value="${deadlineVal}"
                    />
                </div>`;
    }
  }

  // Función que se usa para cerrar los modales después de guardar los datos
  closeModal(id) {
    const modalElement = document.getElementById(id);
    const modal = bootstrap.Modal.getInstance(modalElement);

    if (modalElement) {
      modalElement.setAttribute("aria-hidden", "true");
    }
    if (modal) {
      modal.hide();
    }
  }

  notify() {
    const opt = {
      body: "Tabla actualizada después de 2s.",
    };
    const n = new Notification("Datos actualizados", opt);
    n.onclick = function () {
      window.focus();
      n.close();
    };
  }

  // Solicita el permiso del usuario para mostrar notificaciones y muestra la notificacion
  requestPermission() {
    Notification.requestPermission().then((permit) => {
      if (permit === "granted") {
        this.notify();
        return;
      }
      console.info("Acceso denegado. No se mostrarán notificaciones");
    });
  }

  registerEventListeners() {
    // Renderiza la tabla con nuevos registros
    this.saveTaskButton.addEventListener("click", async () => {
      if (typeof this.inputNew.value !== "string") {
        alert("El tipo de la tarea ingresada es inválido");
        return;
      }
      if (this.inputNew.value.length < 1 || this.inputNew.value.length > 30) {
        alert("La tarea ingresada tiene un largo inválido");
        return;
      }

      const inputDateNew = document.querySelector("#input-date-new-task");
      const deadline = inputDateNew ? inputDateNew.value : "";

      const tasks = await this.getTasks();
      const newTask = {
        id: this.createTaskId(tasks),
        task: this.inputNew.value.trim(),
        deadline: deadline,
      };
      const updatedTasks = [...tasks, newTask];
      await this.saveTasks(updatedTasks);
      setTimeout(() => {
        this.renderTasks(updatedTasks);
        this.requestPermission();
      }, 2000);

      this.closeModal("add-task-modal");
      this.inputNew.value = "";
      if (inputDateNew) inputDateNew.value = "";
    });

    // Renderiza las tareas con el valor editado
    this.editTaskButton.addEventListener("click", async () => {
      const inputEditDynamic = document.querySelector("#input-text-edit-task");
      const inputDateEditDynamic = document.querySelector(
        "#input-date-edit-task",
      );

      if (!inputEditDynamic) {
        return;
      }
      const newTaskText = inputEditDynamic.value.trim();
      if (newTaskText.length < 1 || newTaskText.length > 30) {
        alert("La tarea ingresada tiene un largo inválido");
        return;
      }

      const newDeadline = inputDateEditDynamic
        ? inputDateEditDynamic.value
        : "";

      const tasks = await this.getTasks();
      const updatedTasks = tasks.map((task) => {
        if (Number(task.id) === Number(this.editingTaskId)) {
          return {
            ...task,
            task: newTaskText,
            deadline: newDeadline,
          };
        }
        return task;
      });
      await this.saveTasks(updatedTasks);
      this.renderTasks(updatedTasks);
      this.closeModal("edit-task-modal");
      this.editingTaskId = null;
    });

    // Event listener para el cuerpo de la tabla, lanza los modales para editar y agregar filas
    this.tBody.addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (!button) {
        return;
      }
      const id = button.dataset.id;
      if (button.classList.contains("task-del")) {
        this.deleteTask(id);
      }
      if (button.classList.contains("task-edit")) {
        this.editTask(id);
      }
    });

    // Evento mouseover para los elementos de la tabla
    this.tBody.addEventListener("mouseover", (e) => {
      const row = e.target.closest("tr");
      if (row) {
        row.classList.add("table-active");
      }
      const button = e.target.closest("button");
    });

    // Evento mouseout para los elementos de la tabla
    this.tBody.addEventListener("mouseout", (e) => {
      const row = e.target.closest("tr");
      if (row) {
        row.classList.remove("table-active");
      }
      const button = e.target.closest("button");
      if (button) {
        button.style.transform = "scale(1)";
      }
    });

    this.modals.forEach((m) => {
      m.addEventListener("hidden.bs.modal", () => {
        this.inputNew.value = "";
        const inputDateNew = document.querySelector("#input-date-new-task");
        if (inputDateNew) inputDateNew.value = "";

        const inputEditDynamic = document.querySelector(
          "#input-text-edit-task",
        );
        if (inputEditDynamic) {
          inputEditDynamic.value = "";
        }
      });
    });
  }
}

// Espera a que el contenido del DOM esté cargado antes de obtener las tareas
document.addEventListener("DOMContentLoaded", () => {
  const taskManager = new TaskManager();
  taskManager.init();
});
