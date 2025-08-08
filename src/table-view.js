// Table View functionality
function setupTableView() {
    const tableViewBtn = document.getElementById('tableViewBtn');
    if (tableViewBtn) {
        tableViewBtn.addEventListener('click', showTableView);
    }
}

function showTableView() {
    // สร้าง modal แบบ dynamic
    const modal = document.createElement('div');
    modal.id = 'tableViewModal';
    modal.style.cssText = 'display: flex; position: fixed; z-index: 1000; left: 0; top: 0; width: 100vw; height: 100vh; justify-content: center; align-items: center;';
    
    modal.innerHTML = `
        <div class="modal-overlay" style="position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.35);" tabindex="-1"></div>
        <div class="modal-content" style="position: relative; background: #fff; border-radius: 16px; max-width: 1000px; min-width: 320px; width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px #0002; padding: 24px 16px 16px 16px;">
            <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <h2 style="font-size: 1.3rem; color: #2196f3; margin: 0;">
                    <i class="fas fa-table"></i>
                    รายการโรงทาน
                </h2>
                <button class="close-btn" id="closeTableViewBtn" style="background: none; border: none; font-size: 1.5rem; color: #888; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="table-search" style="margin-bottom: 16px;">
                <input type="text" id="tableSearchInput" placeholder="ค้นหาโรงทาน..." style="width: 100%; padding: 8px 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; font-family: 'Noto Sans Thai', sans-serif;">
            </div>
            <div class="table-container" id="tableContainer">
                <!-- ตารางจะแสดงที่นี่ -->
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    renderTable();
    setupTableSearch();
    
    // เพิ่ม event listeners
    modal.querySelector('.modal-overlay').addEventListener('click', closeTableView);
    modal.querySelector('#closeTableViewBtn').addEventListener('click', closeTableView);
    
    document.body.style.overflow = 'hidden';
}

function renderTable(data = window.RESTAURANT_DATA) {
    const tableContainer = document.getElementById('tableContainer');
    if (!tableContainer) return;
    
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    const table = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
                <tr style="background: #f5f5f5;">
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center; width: 50px;">#</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">ชื่อโรงทาน</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">เมนู</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center; width: 100px;">ลิงก์</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(restaurant => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; background: linear-gradient(135deg, #1565c0, #ffb300); color: white;">${restaurant.id}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: 600;">${escapeHtml(restaurant.name)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(restaurant.menu) || 'ไม่ระบุเมนู'}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                            ${restaurant.link ? `<a href="${restaurant.link}" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #1877f2, #42a5f5); color: white; text-decoration: none; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;"><i class="fab fa-facebook-f"></i></a>` : '-'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = table;
}

function setupTableSearch() {
    const searchInput = document.getElementById('tableSearchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filteredData = window.RESTAURANT_DATA.filter(restaurant => 
            restaurant.name.toLowerCase().includes(query) ||
            restaurant.menu.toLowerCase().includes(query) ||
            restaurant.id.toString().includes(query)
        );
        renderTable(filteredData);
    });
}

function closeTableView() {
    const modal = document.getElementById('tableViewModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Export functions for use in main.js
window.setupTableView = setupTableView;
