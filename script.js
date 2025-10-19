// Base de datos temporal (en un proyecto real esto estaría en el backend)
let products = JSON.parse(localStorage.getItem('inventoryProducts')) || [];
let movements = JSON.parse(localStorage.getItem('inventoryMovements')) || [];

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    renderProducts();
    renderMovements();
    updateProductSelect();
    updateDashboard();
    
    // Actualizar dashboard cada 30 segundos
    setInterval(updateDashboard, 30000);
});

// Agregar nuevo producto
document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newProduct = {
        id: Date.now(),
        name: document.getElementById('productName').value,
        sku: document.getElementById('productSku').value,
        stock: parseInt(document.getElementById('productStock').value),
        location: document.getElementById('productLocation').value || 'Sin ubicación',
        minStock: parseInt(document.getElementById('productMinStock').value) || 0,
        price: parseFloat(document.getElementById('productPrice').value) || 0,
        createdAt: new Date().toLocaleDateString()
    };

    products.push(newProduct);
    saveToLocalStorage();
    renderProducts();
    updateProductSelect();
    updateDashboard();
    this.reset();
    
    // Registrar movimiento automático
    addMovementRecord(newProduct.id, 'entrada', newProduct.stock, 'Stock inicial');
    showAlert('✅ Producto agregado correctamente', 'success');
});

// Mostrar productos en la lista (FUNCIÓN ACTUALIZADA CON BOTONES)
function renderProducts() {
    const productList = document.getElementById('productList');
    const productCount = document.getElementById('productCount');
    productList.innerHTML = '';

    // Actualizar contador
    productCount.textContent = products.length;

    if (products.length === 0) {
        productList.innerHTML = '<p style="text-align: center; padding: 20px; color: #718096;">No hay productos registrados</p>';
        return;
    }

    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = `product-item ${product.stock <= product.minStock ? 'low-stock' : ''}`;
        
        const totalValue = (product.stock * product.price).toLocaleString();
        
        productItem.innerHTML = `
            <div class="product-main-info">
                <div class="product-info">
                    <strong style="font-size: 1.1em;">${product.name}</strong><br>
                    <small>SKU: ${product.sku} | Ubicación: ${product.location}</small>
                    ${product.price > 0 ? `<br><small>Valor total: $${totalValue}</small>` : ''}
                </div>
                <div class="stock-info ${product.stock <= product.minStock ? 'stock-low' : 'stock-ok'}">
                    Stock: ${product.stock}
                    ${product.minStock > 0 ? `<br><small>Mín: ${product.minStock}</small>` : ''}
                    ${product.stock <= product.minStock ? '⚠️' : ''}
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-delete" onclick="confirmDeleteProduct(${product.id})">
                    🗑️ Eliminar Producto
                </button>
            </div>
        `;
        
        productList.appendChild(productItem);
    });
}

// Confirmar eliminación de producto
function confirmDeleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Crear modal de confirmación
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'deleteModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🗑️ Eliminar Producto</h3>
            <p>¿Estás seguro de que quieres eliminar <strong>"${product.name}"</strong>?</p>
            <p><small>SKU: ${product.sku} | Stock actual: ${product.stock} unidades</small></p>
            <p style="color: #ff6b6b; font-weight: bold; margin-top: 15px;">⚠️ Esta acción no se puede deshacer</p>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
                <button class="btn-confirm" onclick="deleteProduct(${productId})">Sí, Eliminar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.remove();
    }
}

// Eliminar producto
function deleteProduct(productId) {
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
        const deletedProduct = products[productIndex];
        
        // Eliminar el producto
        products.splice(productIndex, 1);
        
        // Eliminar movimientos relacionados con este producto
        movements = movements.filter(m => m.productId !== productId);
        
        // Guardar cambios
        saveToLocalStorage();
        
        // Actualizar la interfaz
        renderProducts();
        updateProductSelect();
        renderMovements();
        updateDashboard();
        
        // Cerrar modal y mostrar confirmación
        closeModal();
        showAlert(`✅ Producto "${deletedProduct.name}" eliminado correctamente`, 'success');
    }
}

// Función para eliminar todos los productos (limpia total)
function clearAllProducts() {
    if (products.length === 0) {
        showAlert('ℹ️ No hay productos para eliminar');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'clearAllModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🗑️ Eliminar Todos los Productos</h3>
            <p>¿Estás seguro de que quieres eliminar <strong>todos los productos</strong>?</p>
            <p style="color: #ff6b6b; font-weight: bold; margin-top: 15px;">
                ⚠️ Se eliminarán ${products.length} productos y todos sus movimientos.<br>
                Esta acción no se puede deshacer.
            </p>
            <div class="modal-actions">
                <button class="btn-cancel" onclick="closeClearModal()">Cancelar</button>
                <button class="btn-confirm" onclick="performClearAll()">Sí, Eliminar Todo</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Cerrar modal de limpieza total
function closeClearModal() {
    const modal = document.getElementById('clearAllModal');
    if (modal) {
        modal.remove();
    }
}

// Realizar limpieza total
function performClearAll() {
    const productCount = products.length;
    
    // Limpiar todo
    products = [];
    movements = [];
    
    // Guardar cambios
    saveToLocalStorage();
    
    // Actualizar interfaz
    renderProducts();
    updateProductSelect();
    renderMovements();
    updateDashboard();
    
    // Cerrar modal y mostrar confirmación
    closeClearModal();
    showAlert(`✅ Se eliminaron ${productCount} productos y todos los movimientos`, 'success');
}

// Registrar movimiento de stock
function addMovement() {
    const productId = parseInt(document.getElementById('productSelect').value);
    const quantity = parseInt(document.getElementById('movementQty').value);
    const type = document.getElementById('movementType').value;
    const description = document.getElementById('movementDesc').value || 'Movimiento manual';

    if (!productId || !quantity) {
        showAlert('❌ Por favor completa todos los campos');
        return;
    }

    addMovementRecord(productId, type, quantity, description);
    updateStock(productId, type, quantity);
    
    document.getElementById('movementQty').value = '';
    document.getElementById('movementDesc').value = '';
}

function addMovementRecord(productId, type, quantity, description) {
    const product = products.find(p => p.id === productId);
    const movement = {
        id: Date.now(),
        productId: productId,
        productName: product.name,
        type: type,
        quantity: quantity,
        description: description,
        date: new Date().toLocaleString()
    };

    movements.unshift(movement);
    movements = movements.slice(0, 50); // Mantener solo los últimos 50 movimientos
    saveToLocalStorage();
    renderMovements();
    updateDashboard();
}

function updateStock(productId, type, quantity) {
    const product = products.find(p => p.id === productId);
    if (product) {
        if (type === 'entrada') {
            product.stock += quantity;
        } else if (type === 'salida') {
            product.stock = Math.max(0, product.stock - quantity);
        }
        saveToLocalStorage();
        renderProducts();
        showAlert(`📦 Stock actualizado: ${type === 'entrada' ? '+' : '-'}${quantity} unidades`, 'success');
    }
}

// Mostrar movimientos
function renderMovements() {
    const movementList = document.getElementById('movementList');
    movementList.innerHTML = '';

    if (movements.length === 0) {
        movementList.innerHTML = '<p style="text-align: center; padding: 20px; color: #718096;">No hay movimientos registrados</p>';
        return;
    }

    movements.slice(0, 10).forEach(movement => {
        const movementItem = document.createElement('div');
        movementItem.className = 'movement-item';
        
        const typeIcon = movement.type === 'entrada' ? '📥' : '📤';
        const typeClass = movement.type === 'entrada' ? 'stock-ok' : 'stock-low';
        
        movementItem.innerHTML = `
            <div>
                <strong>${movement.productName}</strong><br>
                <small>${movement.description}</small>
            </div>
            <div class="${typeClass}">
                ${typeIcon} ${movement.quantity}<br>
                <small>${movement.date}</small>
            </div>
        `;
        
        movementList.appendChild(movementItem);
    });
}

// Actualizar select de productos para movimientos
function updateProductSelect() {
    const productSelect = document.getElementById('productSelect');
    productSelect.innerHTML = '<option value="">Seleccionar producto</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (Stock: ${product.stock})`;
        productSelect.appendChild(option);
    });
}

// Filtrar productos con stock bajo
function filterLowStock() {
    const lowStockProducts = products.filter(product => product.stock <= product.minStock && product.minStock > 0);
    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    if (lowStockProducts.length === 0) {
        productList.innerHTML = '<p style="text-align: center; padding: 20px; color: #718096;">🎉 No hay productos con stock bajo</p>';
        return;
    }

    lowStockProducts.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item low-stock';
        productItem.innerHTML = `
            <div class="product-main-info">
                <div class="product-info">
                    <strong style="font-size: 1.1em;">${product.name}</strong><br>
                    <small>SKU: ${product.sku} | Ubicación: ${product.location}</small>
                </div>
                <div class="stock-info stock-low">
                    Stock: ${product.stock} ⚠️<br>
                    <small>Mín: ${product.minStock}</small>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-delete" onclick="confirmDeleteProduct(${product.id})">
                    🗑️ Eliminar Producto
                </button>
            </div>
        `;
        productList.appendChild(productItem);
    });
}

// Actualizar dashboard
function updateDashboard() {
    document.getElementById('totalProducts').textContent = products.length;
    
    const lowStock = products.filter(p => p.stock <= p.minStock && p.minStock > 0).length;
    document.getElementById('lowStockCount').textContent = lowStock;
    
    const totalValue = products.reduce((sum, product) => sum + (product.stock * (product.price || 0)), 0);
    document.getElementById('totalValue').textContent = `$${totalValue.toLocaleString()}`;
    
    const today = new Date().toLocaleDateString();
    const todayMoves = movements.filter(m => m.date.includes(today)).length;
    document.getElementById('todayMovements').textContent = todayMoves;
    
    updateStockChart();
}

// Gráfico de stock bajo
function updateStockChart() {
    const chartContainer = document.getElementById('stockChart');
    chartContainer.innerHTML = '';
    
    const lowStockProducts = products
        .filter(p => p.stock <= p.minStock && p.minStock > 0)
        .slice(0, 8); // Mostrar máximo 8 productos
    
    if (lowStockProducts.length === 0) {
        chartContainer.innerHTML = '<p style="text-align: center; width: 100%; padding: 40px; color: #718096;">🎉 ¡Todo el stock está en niveles óptimos!</p>';
        return;
    }
    
    lowStockProducts.forEach(product => {
        const barHeight = (product.stock / (product.minStock || 1)) * 80;
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${Math.max(barHeight, 20)}%`;
        bar.title = `${product.name}: ${product.stock}/${product.minStock}`;
        
        bar.innerHTML = `
            <div class="chart-bar-value">${product.stock}</div>
            <div class="chart-bar-label">${product.name.substring(0, 10)}${product.name.length > 10 ? '...' : ''}</div>
        `;
        
        chartContainer.appendChild(bar);
    });
}

// Alternar tema oscuro|claro
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    showAlert(`Tema ${isDark ? 'oscuro' : 'claro'} activado`);
}

// Cargar tema guardado
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// Mostrar alertas
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => alert.classList.add('show'), 100);
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 500);
    }, 3000);
}

// Acciones rapidas
function quickAction(action) {
    switch(action) {
        case 'export':
            showAlert('📊 Exportando reporte...', 'success');
            break;
        case 'lowstock':
            filterLowStock();
            showAlert('📉 Filtrando stock bajo');
            break;
        case 'addproduct':
            document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
            showAlert('📦 Navegando a agregar producto');
            break;
        case 'reports':
            showAlert('📋 Generando reportes...', 'success');
            break;
    }
}

// Buscar productos (actualizada con botones)
document.getElementById('searchInput').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.sku.toLowerCase().includes(searchTerm) ||
        product.location.toLowerCase().includes(searchTerm)
    );
    
    const productList = document.getElementById('productList');
    productList.innerHTML = '';

    if (filteredProducts.length === 0) {
        productList.innerHTML = '<p style="text-align: center; padding: 20px; color: #718096;">No se encontraron productos</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = `product-item ${product.stock <= product.minStock ? 'low-stock' : ''}`;
        
        const totalValue = (product.stock * product.price).toLocaleString();
        
        productItem.innerHTML = `
            <div class="product-main-info">
                <div class="product-info">
                    <strong style="font-size: 1.1em;">${product.name}</strong><br>
                    <small>SKU: ${product.sku} | Ubicación: ${product.location}</small>
                    ${product.price > 0 ? `<br><small>Valor total: $${totalValue}</small>` : ''}
                </div>
                <div class="stock-info ${product.stock <= product.minStock ? 'stock-low' : 'stock-ok'}">
                    Stock: ${product.stock}
                    ${product.minStock > 0 ? `<br><small>Mín: ${product.minStock}</small>` : ''}
                    ${product.stock <= product.minStock ? '⚠️' : ''}
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-delete" onclick="confirmDeleteProduct(${product.id})">
                    🗑️ Eliminar Producto
                </button>
            </div>
        `;
        productList.appendChild(productItem);
    });
});

// Guardar en localStorage
function saveToLocalStorage() {
    localStorage.setItem('inventoryProducts', JSON.stringify(products));
    localStorage.setItem('inventoryMovements', JSON.stringify(movements));
}