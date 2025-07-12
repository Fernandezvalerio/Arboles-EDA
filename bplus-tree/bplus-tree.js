class BPlusTree {
    constructor(order = 3) {
        this.order = order;
        this.root = new LeafNode(this);
    }

    search(key) {
        return this.root.search(key);
    }

    insert(key, value = key) {
        const newChild = this.root.insert(key, value);
        if (newChild) {
            const newRoot = new InternalNode(this);
            newRoot.keys.push(newChild.getFirstLeafKey());
            newRoot.children.push(this.root);
            newRoot.children.push(newChild);
            this.root = newRoot;
        }
    }

    delete(key) {
        const deleted = this.root.delete(key);
        if (!this.root.isLeaf() && this.root.children.length === 1) {
            this.root = this.root.children[0];
        }
        return deleted;
    }

    visualize(containerId, highlightKey = null) {
        const container = d3.select(`#${containerId}`);
        container.html("");

        const width = container.node().getBoundingClientRect().width;
        const height = container.node().getBoundingClientRect().height;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        const svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const treeLayout = d3.tree().size([width - 40, height - 60]);

        // Convertir nuestra estructura de árbol B+ a una estructura que D3 pueda entender
        const rootNode = this.convertToD3Node(this.root, highlightKey);
        const root = d3.hierarchy(rootNode);
        treeLayout(root);

        // Dibujar los enlaces
        svg.selectAll(".link")
            .data(root.links())
            .enter().append("path")
            .attr("class", "link")
            .attr("d", d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y));

        // Dibujar los nodos
        const node = svg.selectAll(".node")
            .data(root.descendants())
            .enter().append("g")
            .attr("class", d => `node ${d.data.type} ${d.data.highlighted ? 'highlighted' : ''}`)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        node.append("circle")
            .attr("r", d => Math.max(20, d.data.keys.length * 8));

        node.append("text")
            .attr("dy", ".35em")
            .attr("y", d => d.children ? -20 : 20)
            .style("text-anchor", "middle")
            .text(d => d.data.keys.join(","));
    }

    convertToD3Node(node, highlightKey = null) {
        const result = {
            name: node.keys.join(","),
            keys: [...node.keys],
            type: node.isLeaf() ? "leaf" : "internal",
            highlighted: highlightKey !== null && node.keys.includes(highlightKey),
            children: []
        };

        if (!node.isLeaf()) {
            for (const child of node.children) {
                result.children.push(this.convertToD3Node(child, highlightKey));
            }
        }

        return result;
    }
}

class Node {
    constructor(tree) {
        this.tree = tree;
        this.keys = [];
    }

    isLeaf() {
        return false;
    }

    isFull() {
        return this.keys.length >= this.tree.order;
    }

    isUnderflow() {
        return this.keys.length < Math.ceil(this.tree.order / 2);
    }

    getFirstLeafKey() {
        throw new Error("Método abstracto");
    }
}

class InternalNode extends Node {
    constructor(tree) {
        super(tree);
        this.children = [];
    }

    getChildIndex(key) {
        let low = 0;
        let high = this.keys.length;

        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (this.keys[mid] < key) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        return low;
    }

    search(key) {
        const index = this.getChildIndex(key);
        return this.children[index].search(key);
    }

    insert(key, value) {
        const index = this.getChildIndex(key);
        const child = this.children[index];
        const newChild = child.insert(key, value);

        if (newChild) {
            const newKey = newChild.getFirstLeafKey();
            const insertionPoint = this.getChildIndex(newKey);

            this.keys.splice(insertionPoint, 0, newKey);
            this.children.splice(insertionPoint + 1, 0, newChild);

            if (this.isFull()) {
                return this.split();
            }
        }

        return null;
    }

    split() {
        const newNode = new InternalNode(this.tree);
        const splitPoint = Math.ceil(this.keys.length / 2);

        newNode.keys = this.keys.slice(splitPoint);
        newNode.children = this.children.slice(splitPoint + 1);

        const promotedKey = this.keys[splitPoint - 1];
        this.keys = this.keys.slice(0, splitPoint - 1);
        this.children = this.children.slice(0, splitPoint);

        const newParent = new InternalNode(this.tree);
        newParent.keys.push(promotedKey);
        newParent.children.push(this, newNode);

        return newParent;
    }

    delete(key) {
        const index = this.getChildIndex(key);
        const child = this.children[index];
        const deleted = child.delete(key);

        if (child.isUnderflow()) {
            this.handleUnderflow(index);
        }

        return deleted;
    }

    handleUnderflow(childIndex) {
        const child = this.children[childIndex];

        // Intentar redistribuir con el hermano izquierdo
        if (childIndex > 0) {
            const leftSibling = this.children[childIndex - 1];
            if (leftSibling.keys.length > Math.ceil(this.tree.order / 2)) {
                this.redistribute(leftSibling, child, childIndex - 1);
                return;
            }
        }

        // Intentar redistribuir con el hermano derecho
        if (childIndex < this.children.length - 1) {
            const rightSibling = this.children[childIndex + 1];
            if (rightSibling.keys.length > Math.ceil(this.tree.order / 2)) {
                this.redistribute(child, rightSibling, childIndex);
                return;
            }
        }

        // Si no se puede redistribuir, hacer merge
        if (childIndex > 0) {
            // Merge con el hermano izquierdo
            const leftSibling = this.children[childIndex - 1];
            leftSibling.merge(child);
            this.keys.splice(childIndex - 1, 1);
            this.children.splice(childIndex, 1);
        } else {
            // Merge con el hermano derecho
            const rightSibling = this.children[childIndex + 1];
            child.merge(rightSibling);
            this.keys.splice(childIndex, 1);
            this.children.splice(childIndex + 1, 1);
        }
    }

    redistribute(left, right, keyIndex) {
        if (left.keys.length < right.keys.length) {
            // Mover del derecho al izquierdo
            if (left.isLeaf()) {
                const leftLeaf = left;
                const rightLeaf = right;

                const lastIndex = rightLeaf.keys.length - 1;
                leftLeaf.keys.push(rightLeaf.keys.pop());
                leftLeaf.values.push(rightLeaf.values.pop());
            } else {
                const leftInternal = left;
                const rightInternal = right;

                leftInternal.keys.push(this.keys[keyIndex]);
                leftInternal.children.push(rightInternal.children.shift());
                this.keys[keyIndex] = rightInternal.keys.shift();
            }
        } else {
            // Mover del izquierdo al derecho
            if (left.isLeaf()) {
                const leftLeaf = left;
                const rightLeaf = right;

                rightLeaf.keys.unshift(leftLeaf.keys.pop());
                rightLeaf.values.unshift(leftLeaf.values.pop());
            } else {
                const leftInternal = left;
                const rightInternal = right;

                rightInternal.keys.unshift(this.keys[keyIndex]);
                rightInternal.children.unshift(leftInternal.children.pop());
                this.keys[keyIndex] = leftInternal.keys.pop();
            }
        }
    }

    merge(sibling) {
        const internalSibling = sibling;
        const parentKey = internalSibling.getFirstLeafKey();

        this.keys.push(parentKey, ...internalSibling.keys);
        this.children.push(...internalSibling.children);
    }

    getFirstLeafKey() {
        return this.children[0].getFirstLeafKey();
    }
}

class LeafNode extends Node {
    constructor(tree) {
        super(tree);
        this.values = [];
        this.next = null;
    }

    isLeaf() {
        return true;
    }

    search(key) {
        const index = this.keys.indexOf(key);
        return index !== -1 ? this.values[index] : null;
    }

    insert(key, value) {
        const index = this.getInsertIndex(key);
        this.keys.splice(index, 0, key);
        this.values.splice(index, 0, value);

        if (this.isFull()) {
            return this.split();
        }

        return null;
    }

    getInsertIndex(key) {
        let low = 0;
        let high = this.keys.length;

        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (this.keys[mid] < key) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }

        return low;
    }

    split() {
        const newLeaf = new LeafNode(this.tree);
        const splitPoint = Math.ceil(this.keys.length / 2);

        newLeaf.keys = this.keys.slice(splitPoint);
        newLeaf.values = this.values.slice(splitPoint);
        newLeaf.next = this.next;

        this.keys = this.keys.slice(0, splitPoint);
        this.values = this.values.slice(0, splitPoint);
        this.next = newLeaf;

        return newLeaf;
    }

    delete(key) {
        const index = this.keys.indexOf(key);
        if (index !== -1) {
            this.keys.splice(index, 1);
            this.values.splice(index, 1);
            return true;
        }
        return false;
    }

    merge(sibling) {
        const leafSibling = sibling;
        this.keys.push(...leafSibling.keys);
        this.values.push(...leafSibling.values);
        this.next = leafSibling.next;
    }

    getFirstLeafKey() {
        return this.keys[0];
    }
}

// Interfaz de usuario
document.addEventListener('DOMContentLoaded', () => {
    let tree = new BPlusTree(3);
    const searchResult = document.getElementById('searchResult');
    
    // Inicializar visualización
    tree.visualize('treeVisualization');
    
    // Manejadores de eventos
    document.getElementById('insertBtn').addEventListener('click', () => {
        const value = parseInt(document.getElementById('valueInput').value);
        if (!isNaN(value)) {
            tree.insert(value);
            tree.visualize('treeVisualization');
            document.getElementById('valueInput').value = '';
            searchResult.textContent = '';
            searchResult.className = '';
        }
    });
    
    document.getElementById('deleteBtn').addEventListener('click', () => {
        const value = parseInt(document.getElementById('valueInput').value);
        if (!isNaN(value)) {
            const deleted = tree.delete(value);
            tree.visualize('treeVisualization');
            document.getElementById('valueInput').value = '';
            
            if (deleted) {
                searchResult.textContent = `Valor ${value} eliminado correctamente.`;
                searchResult.className = 'success';
            } else {
                searchResult.textContent = `Valor ${value} no encontrado.`;
                searchResult.className = 'error';
            }
        }
    });
    
    document.getElementById('searchBtn').addEventListener('click', () => {
        const value = parseInt(document.getElementById('valueInput').value);
        if (!isNaN(value)) {
            const result = tree.search(value);
            tree.visualize('treeVisualization', value);
            document.getElementById('valueInput').value = '';
            
            if (result !== null) {
                searchResult.textContent = `Valor ${value} encontrado.`;
                searchResult.className = 'success';
            } else {
                searchResult.textContent = `Valor ${value} no encontrado.`;
                searchResult.className = 'error';
            }
        }
    });
    
    document.getElementById('clearBtn').addEventListener('click', () => {
        const order = parseInt(document.getElementById('order').value);
        tree = new BPlusTree(order);
        tree.visualize('treeVisualization');
        searchResult.textContent = 'Árbol reiniciado.';
        searchResult.className = 'info';
    });
    
    document.getElementById('randomBtn').addEventListener('click', () => {
        for (let i = 0; i < 10; i++) {
            const randomValue = Math.floor(Math.random() * 100) + 1;
            tree.insert(randomValue);
        }
        tree.visualize('treeVisualization');
        searchResult.textContent = '10 valores aleatorios insertados.';
        searchResult.className = 'info';
    });
    
    document.getElementById('order').addEventListener('change', () => {
        const order = parseInt(document.getElementById('order').value);
        tree = new BPlusTree(order);
        tree.visualize('treeVisualization');
        searchResult.textContent = `Árbol creado con orden ${order}.`;
        searchResult.className = 'info';
    });
});