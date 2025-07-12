class NodoAVL {
  constructor(valor) {
    this.valor = valor;
    this.izq = null;
    this.der = null;
    this.altura = 1;
  }
}

class ArbolAVL {
  constructor() {
    this.raiz = null;
    this.ultimoInsertado = null;
  }

  altura(nodo) {
    return nodo ? nodo.altura : 0;
  }

  factorBalance(nodo) {
    return nodo ? this.altura(nodo.izq) - this.altura(nodo.der) : 0;
  }

  actualizarAltura(nodo) {
    nodo.altura = 1 + Math.max(this.altura(nodo.izq), this.altura(nodo.der));
  }

  rotarDerecha(y) {
    const x = y.izq;
    const T2 = x.der;
    x.der = y;
    y.izq = T2;
    this.actualizarAltura(y);
    this.actualizarAltura(x);
    mostrarExplicacion(`Rotación derecha en ${y.valor}`);
    return x;
  }

  rotarIzquierda(x) {
    const y = x.der;
    const T2 = y.izq;
    y.izq = x;
    x.der = T2;
    this.actualizarAltura(x);
    this.actualizarAltura(y);
    mostrarExplicacion(`Rotación izquierda en ${x.valor}`);
    return y;
  }
}

// PAUSAS PARA PASO A PASO
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// INSERTAR STEP BY STEP
async function insertarPasoAPaso(valor) {
  mostrarExplicacion(`Insertando ${valor}...`);
  await sleep(1000);

  arbolAVL.raiz = insertarSinBalanceo(arbolAVL.raiz, valor);
  arbolAVL.ultimoInsertado = valor;
  dibujarAVL();

  mostrarExplicacion(`Nodo ${valor} insertado`);
  await sleep(1500);

  arbolAVL.raiz = balancear(arbolAVL.raiz, valor);
  dibujarAVL();
}

// INSERTAR DIRECTO (SIN BALANCEO)
function insertarSinBalanceo(nodo, valor) {
  if (!nodo) return new NodoAVL(valor);
  if (valor < nodo.valor) nodo.izq = insertarSinBalanceo(nodo.izq, valor);
  else if (valor > nodo.valor) nodo.der = insertarSinBalanceo(nodo.der, valor);
  return nodo;
}

// BALANCEO SEPARADO
function balancear(nodo, valor) {
  if (!nodo) return null;

  nodo.izq = balancear(nodo.izq, valor);
  nodo.der = balancear(nodo.der, valor);

  arbolAVL.actualizarAltura(nodo);
  const balance = arbolAVL.factorBalance(nodo);

  if (balance > 1 && valor < nodo.izq?.valor) {
    mostrarExplicacion(`Desbalance en ${nodo.valor}, rotación derecha`);
    return arbolAVL.rotarDerecha(nodo);
  }

  if (balance < -1 && valor > nodo.der?.valor) {
    mostrarExplicacion(`Desbalance en ${nodo.valor}, rotación izquierda`);
    return arbolAVL.rotarIzquierda(nodo);
  }

  if (balance > 1 && valor > nodo.izq?.valor) {
    mostrarExplicacion(`Desbalance en ${nodo.valor}, rotación izquierda-derecha`);
    nodo.izq = arbolAVL.rotarIzquierda(nodo.izq);
    return arbolAVL.rotarDerecha(nodo);
  }

  if (balance < -1 && valor < nodo.der?.valor) {
    mostrarExplicacion(`Desbalance en ${nodo.valor}, rotación derecha-izquierda`);
    nodo.der = arbolAVL.rotarDerecha(nodo.der);
    return arbolAVL.rotarIzquierda(nodo);
  }

  return nodo;
}

// ELIMINACIÓN SIMPLE
function eliminarNodo(nodo, valor) {
  if (!nodo) return null;

  if (valor < nodo.valor) nodo.izq = eliminarNodo(nodo.izq, valor);
  else if (valor > nodo.valor) nodo.der = eliminarNodo(nodo.der, valor);
  else {
    if (!nodo.izq || !nodo.der) {
      mostrarExplicacion(`Nodo ${valor} eliminado`);
      return nodo.izq || nodo.der;
    }

    let temp = nodo.der;
    while (temp.izq) temp = temp.izq;
    nodo.valor = temp.valor;
    nodo.der = eliminarNodo(nodo.der, temp.valor);
  }

  arbolAVL.actualizarAltura(nodo);
  const balance = arbolAVL.factorBalance(nodo);

  if (balance > 1 && arbolAVL.factorBalance(nodo.izq) >= 0) return arbolAVL.rotarDerecha(nodo);
  if (balance > 1 && arbolAVL.factorBalance(nodo.izq) < 0) {
    nodo.izq = arbolAVL.rotarIzquierda(nodo.izq);
    return arbolAVL.rotarDerecha(nodo);
  }
  if (balance < -1 && arbolAVL.factorBalance(nodo.der) <= 0) return arbolAVL.rotarIzquierda(nodo);
  if (balance < -1 && arbolAVL.factorBalance(nodo.der) > 0) {
    nodo.der = arbolAVL.rotarDerecha(nodo.der);
    return arbolAVL.rotarIzquierda(nodo);
  }

  return nodo;
}

// INTERACCIÓN
const arbolAVL = new ArbolAVL();

async function insertarAVL() {
  const val = parseInt(document.getElementById("valor").value);
  if (!isNaN(val)) {
    await insertarPasoAPaso(val);
  }
}

function eliminarAVL() {
  const val = parseInt(document.getElementById("valor").value);
  if (!isNaN(val)) {
    arbolAVL.raiz = eliminarNodo(arbolAVL.raiz, val);
    arbolAVL.ultimoInsertado = null;
    dibujarAVL();
  }
}

function eliminarTodoAVL() {
  arbolAVL.raiz = null;
  mostrarExplicacion("Árbol AVL eliminado por completo");
  dibujarAVL();
}

function buscarAVL() {
  const val = parseInt(document.getElementById("valor").value);
  const encontrado = buscar(val, arbolAVL.raiz);
  mostrarExplicacion(encontrado ? `Nodo ${val} encontrado` : `Nodo ${val} no está en el árbol`);
}

function buscar(valor, nodo) {
  if (!nodo) return false;
  if (valor === nodo.valor) return true;
  if (valor < nodo.valor) return buscar(valor, nodo.izq);
  return buscar(valor, nodo.der);
}

function obtenerAltura(nodo) {
  if (!nodo) return 0;
  return 1 + Math.max(obtenerAltura(nodo.izq), obtenerAltura(nodo.der));
}

// CANVAS
function dibujarAVL() {
  const canvas = document.getElementById("canvas-avl");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  function dibujarNodo(nodo, x, y, dx) {
    if (!nodo) return;

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = nodo.valor === arbolAVL.ultimoInsertado ? "#a5d6a7" : "#90caf9";
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(nodo.valor, x, y + 5);

    if (nodo.izq) {
      ctx.beginPath();
      ctx.moveTo(x, y + 20);
      ctx.lineTo(x - dx, y + 80 - 20);
      ctx.stroke();
      dibujarNodo(nodo.izq, x - dx, y + 80, dx / 1.5);
    }

    if (nodo.der) {
      ctx.beginPath();
      ctx.moveTo(x, y + 20);
      ctx.lineTo(x + dx, y + 80 - 20);
      ctx.stroke();
      dibujarNodo(nodo.der, x + dx, y + 80, dx / 1.5);
    }
  }

  dibujarNodo(arbolAVL.raiz, canvas.width / 2, 40, 120);
}

// EXPLICACIONES EN COLA
function mostrarExplicacion(msg) {
  explicacionesPendientes.push(msg);
  procesarColaExplicaciones();
}

function procesarColaExplicaciones() {
  if (mostrandoExplicacion || explicacionesPendientes.length === 0) return;

  mostrandoExplicacion = true;
  const mensaje = explicacionesPendientes.shift();

  const div = document.getElementById("explicacion");
  div.innerText = mensaje;
  div.style.backgroundColor = "#fff59d";

  const historial = document.getElementById("historial");
  if (historial) {
    const nuevo = document.createElement("div");
    nuevo.textContent = mensaje;
    historial.appendChild(nuevo);
  }

  setTimeout(() => {
    div.style.backgroundColor = "#e8f0fe";
    mostrandoExplicacion = false;
    procesarColaExplicaciones();
  }, 1500);
}

const explicacionesPendientes = [];
let mostrandoExplicacion = false;
