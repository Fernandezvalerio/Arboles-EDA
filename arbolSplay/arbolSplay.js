class Nodo {
  constructor(valor) {
    this.valor = valor;
    this.izquierda = null;
    this.derecha = null;
    this.padre = null;
    this.x = 0;
    this.y = 0;
  }
}

class ArbolSplay {
  constructor() {
    this.raiz = null;
  }

  rotarDerecha(x) {
    const y = x.izquierda;
    if (!y) return;
    x.izquierda = y.derecha;
    if (y.derecha) y.derecha.padre = x;
    y.padre = x.padre;
    if (!x.padre) this.raiz = y;
    else if (x === x.padre.derecha) x.padre.derecha = y;
    else x.padre.izquierda = y;
    y.derecha = x;
    x.padre = y;
  }

  rotarIzquierda(x) {
    const y = x.derecha;
    if (!y) return;
    x.derecha = y.izquierda;
    if (y.izquierda) y.izquierda.padre = x;
    y.padre = x.padre;
    if (!x.padre) this.raiz = y;
    else if (x === x.padre.izquierda) x.padre.izquierda = y;
    else x.padre.derecha = y;
    y.izquierda = x;
    x.padre = y;
  }

  splay(x) {
    while (x.padre) {
      if (!x.padre.padre) {
        if (x.padre.izquierda === x) this.rotarDerecha(x.padre);
        else this.rotarIzquierda(x.padre);
      } else if (x.padre.izquierda === x && x.padre.padre.izquierda === x.padre) {
        this.rotarDerecha(x.padre.padre);
        this.rotarDerecha(x.padre);
      } else if (x.padre.derecha === x && x.padre.padre.derecha === x.padre) {
        this.rotarIzquierda(x.padre.padre);
        this.rotarIzquierda(x.padre);
      } else if (x.padre.izquierda === x && x.padre.padre.derecha === x.padre) {
        this.rotarDerecha(x.padre);
        this.rotarIzquierda(x.padre);
      } else {
        this.rotarIzquierda(x.padre);
        this.rotarDerecha(x.padre);
      }
    }
  }

  insertar(valor) {
    let z = this.raiz;
    let p = null;

    while (z) {
      p = z;
      if (valor < z.valor) z = z.izquierda;
      else if (valor > z.valor) z = z.derecha;
      else {
        this.splay(z);
        mostrarExplicacion(`El valor ${valor} ya existe.`);
        return;
      }
    }

    const nuevo = new Nodo(valor);
    nuevo.padre = p;

    if (!p) this.raiz = nuevo;
    else if (valor < p.valor) p.izquierda = nuevo;
    else p.derecha = nuevo;

    this.splay(nuevo);
    mostrarExplicacion(`Insertado y splay aplicado a ${valor}`);
  }

  buscar(valor) {
    let z = this.raiz;
    while (z) {
      if (valor < z.valor) z = z.izquierda;
      else if (valor > z.valor) z = z.derecha;
      else {
        this.splay(z);
        mostrarExplicacion(`Encontrado y splay aplicado a ${valor}`);
        return z;
      }
    }
    mostrarExplicacion(`No se encontró el valor ${valor}`);
    return null;
  }

  eliminar(valor) {
    const nodo = this.buscar(valor);
    if (!nodo || nodo.valor !== valor) {
      mostrarExplicacion(`Valor ${valor} no encontrado para eliminar`);
      return;
    }

    this.splay(nodo);

    if (!nodo.izquierda) this.transplantar(nodo, nodo.derecha);
    else if (!nodo.derecha) this.transplantar(nodo, nodo.izquierda);
    else {
      let y = nodo.derecha;
      while (y.izquierda) y = y.izquierda;
      if (y.padre !== nodo) {
        this.transplantar(y, y.derecha);
        y.derecha = nodo.derecha;
        y.derecha.padre = y;
      }
      this.transplantar(nodo, y);
      y.izquierda = nodo.izquierda;
      y.izquierda.padre = y;
    }
    mostrarExplicacion(`Eliminado ${valor}`);
  }

  transplantar(u, v) {
    if (!u.padre) this.raiz = v;
    else if (u === u.padre.izquierda) u.padre.izquierda = v;
    else u.padre.derecha = v;
    if (v) v.padre = u.padre;
  }

  reiniciar() {
    this.raiz = null;
  }
}

function mostrarExplicacion(texto) {
  document.getElementById("explicacion").innerText = texto;
}

function calcularPosiciones(nodo, x, y, sep) {
  if (!nodo) return;
  nodo.x = x;
  nodo.y = y;
  calcularPosiciones(nodo.izquierda, x - sep, y + 80, sep / 1.5);
  calcularPosiciones(nodo.derecha, x + sep, y + 80, sep / 1.5);
}

function dibujarLinea(svg, x1, y1, x2, y2) {
  const linea = document.createElementNS("http://www.w3.org/2000/svg", "line");
  linea.setAttribute("x1", x1);
  linea.setAttribute("y1", y1);
  linea.setAttribute("x2", x2);
  linea.setAttribute("y2", y2);
  linea.setAttribute("stroke", "#2c3e50");
  linea.setAttribute("stroke-width", "2");
  svg.appendChild(linea);
}

function dibujarNodo(svg, nodo) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

  const circulo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circulo.setAttribute("cx", nodo.x);
  circulo.setAttribute("cy", nodo.y);
  circulo.setAttribute("r", 20);
  g.appendChild(circulo);

  const texto = document.createElementNS("http://www.w3.org/2000/svg", "text");
  texto.setAttribute("x", nodo.x);
  texto.setAttribute("y", nodo.y + 5);
  texto.setAttribute("text-anchor", "middle");
  texto.textContent = nodo.valor;
  g.appendChild(texto);

  svg.appendChild(g);
}

function dibujarArbol(nodo, svg) {
  if (!nodo) return;
  if (nodo.izquierda) {
    dibujarLinea(svg, nodo.x, nodo.y, nodo.izquierda.x, nodo.izquierda.y);
    dibujarArbol(nodo.izquierda, svg);
  }
  if (nodo.derecha) {
    dibujarLinea(svg, nodo.x, nodo.y, nodo.derecha.x, nodo.derecha.y);
    dibujarArbol(nodo.derecha, svg);
  }
  dibujarNodo(svg, nodo);
}

function redibujar() {
  const svg = document.getElementById("svg");
  svg.innerHTML = "";
  if (!arbol.raiz) return;
  calcularPosiciones(arbol.raiz, svg.clientWidth / 2, 50, 200);
  dibujarArbol(arbol.raiz, svg);
}

const arbol = new ArbolSplay();

function insertar() {
  const valor = parseInt(document.getElementById("valor").value);
  if (!isNaN(valor)) {
    arbol.insertar(valor);
    redibujar();
  }
}

function buscar() {
  const valor = parseInt(document.getElementById("valor").value);
  if (!isNaN(valor)) {
    arbol.buscar(valor);
    redibujar();
  }
}

function eliminar() {
  const valor = parseInt(document.getElementById("valor").value);
  if (!isNaN(valor)) {
    arbol.eliminar(valor);
    redibujar();
  }
}

function reiniciar() {
  arbol.reiniciar();
  redibujar();
  mostrarExplicacion("Árbol reiniciado.");
}

