# ABP 4

<h3> Gestor de tareas Taskflow </h3>
<p> Desarrollado por S. Rosinsky</p>

<i> Desarrollado con HTML, CSS, Javascript, Bootstrap y Google Fonts </i>

<p> Se utiliza JSONbin.io para almacenar datos en una API externa,la API requiere inicializar un JSON como: </p>


```
{
  "tasks": []
}
```

<p> Se deben actualizar el archivo ./assets/js/var con las variables requeridas por el servidor: <p>

```
MASTER_KEY = ''
ACCESS_KEY = ''
BIN_ID = ''
```
<p> Se simula un tiempo de respuesta de 2s cada vez que se agrega, edita o elimina un registro </p>

<p> Si la API no está disponible se consumen datos desde el almacenamiento persistente (localStorage) <p>






