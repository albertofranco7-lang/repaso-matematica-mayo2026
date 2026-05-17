# Repaso de Matemática — Web App

App para ver y editar el repaso de matemática desde cualquier dispositivo.

## Cómo subir a Render (hosting gratuito)

### 1. Crear cuenta en GitHub
- Ir a https://github.com y crear una cuenta gratuita.

### 2. Crear un repositorio nuevo
- Hacer clic en "New repository"
- Nombre: `repaso-matematica`
- Dejarlo en **Public**
- Hacer clic en "Create repository"

### 3. Subir los archivos
En la carpeta `repaso-app`, abrir una terminal y ejecutar:

```bash
git init
git add .
git commit -m "primera version"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/repaso-matematica.git
git push -u origin main
```

### 4. Crear cuenta en Render
- Ir a https://render.com y registrarse con la cuenta de GitHub.

### 5. Crear un nuevo Web Service
- Hacer clic en "New" → "Web Service"
- Conectar el repositorio `repaso-matematica`
- Configuración:
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Plan**: Free
- Hacer clic en "Create Web Service"

### 6. ¡Listo!
Render te dará una URL como `https://repaso-matematica.onrender.com`.
Esa URL la podés abrir desde el celular y funciona en cualquier dispositivo.

## Uso
- **Ver**: la página muestra el contenido del repaso.
- **Editar**: tocar el botón ✏️ Editar para modificar el texto.
- **Guardar**: tocar 💾 Guardar para que los cambios queden guardados en el servidor.
