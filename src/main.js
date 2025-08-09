import './style.css'

const SHEET_ID = '1xnBYAKJWQ1dLpCuHm0d4-Z85Q10suWL8D7pF5YLjs40';
const GID = '482023215'; // GID ของชีท "โรงทาน"
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

// ข้อมูลโรงทาน (จะโหลดจาก Google Sheets)
let RESTAURANT_DATA = [];
let filteredData = [];

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ฟังก์ชันช่วยในการแยก CSV line
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// ฟังก์ชันจำแนกประเภทอาหาร
function categorizeFood(menu) {
    if (!menu) return 'คาว';
    
    const menuLower = menu.toLowerCase();
    const sweetKeywords = [
        'ขนม', 'เค้ก', 'ไอศกรีม', 'ไอติม', 'เจลาโต้', 'โซดา', 'น้ำหวาน', 
        'ชา', 'กาแฟ', 'เครื่องดื่ม', 'นม', 'โกโก้', 'ช็อกโกแลต',
        'คุกกี้', 'มาการอง', 'บราวนี่', 'ทาร์ต', 'พุดดิ้ง', 'มูส',
        'โดนัท', 'ครัวซองต์', 'ขนมปัง', 'เบเกอรี่', 'ฟัดจ์',
        'หวาน', 'ของหวาน', 'ครีม', 'ยาง', 'ลูกกอล์ฟ', 'ทองหยิบ',
        'ฝอยทอง', 'ทองหยอด', 'บัวลอย', 'ข้าวต้มมัด', 'ข้าวหลาม'
    ];
    
    return sweetKeywords.some(keyword => menuLower.includes(keyword)) ? 'หวาน' : 'คาว';
}

// อัพเดตจำนวนโรงทานทั้งหมด
function updateTotalCount() {
    const totalCountElement = document.getElementById('totalCount');
    if (totalCountElement) {
        totalCountElement.textContent = RESTAURANT_DATA.length;
    }
}

// โหลดข้อมูลจาก Google Sheets
async function loadDataFromGoogleSheets() {
    try {
        console.log('🔄 กำลังโหลดข้อมูลจาก Google Sheets...');
        
        const response = await fetch(SHEET_CSV_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        // ข้าม header row และประมวลผลข้อมูล
        RESTAURANT_DATA = lines.slice(1)
            .map((line, index) => {
                if (!line.trim()) return null;
                
                const columns = parseCSVLine(line);
                const id = columns[0] || '';
                const restaurantName = columns[2] || '';
                const menu = columns[3] || '';
                const postLink = columns[6] || '';
                const picLink = columns[7] || '';
                
                if (!id.trim() || !restaurantName.trim() || isNaN(parseInt(id))) {
                    return null;
                }
                
                const parsedId = parseInt(id);
                
                if (parsedId <= 0) return null;
                
                return {
                    id: parsedId,
                    name: restaurantName.trim(),
                    menu: menu.trim(),
                    postLink: postLink.trim(),
                    picLink: picLink.trim()
                };
            })
            .filter(item => item !== null)
            .sort((a, b) => a.id - b.id);
        
        console.log(`✅ โหลดข้อมูลสำเร็จ: ${RESTAURANT_DATA.length} รายการ`);
        
        filteredData = [...RESTAURANT_DATA];
        updateTotalCount();
        renderGallery();
        
    } catch (error) {
        console.error('❌ ไม่สามารถโหลดข้อมูลจาก Google Sheets:', error);
        filteredData = [...RESTAURANT_DATA];
    }
}

// สร้าง HTML structure
function createAppStructure() {
    const app = document.querySelector('#app');
    
    const template = `
        <div class="restaurant-container">
            <header class="header">
                <div class="header-content">
                    <div class="logo-section">
                        <img src="https://i.ibb.co/zVpMg2gV/274832789bf1.jpg" alt="โลโก้โรงเรียน" class="school-logo">
                    </div>
                    <div class="title-section">
                        <h1 class="app-title">รายชื่อโรงทาน</h1>
                        <p class="subtitle">งานผ้าป่าเพื่อการศึกษาโรงเรียนบ้านโนนผักชี</p>
                    </div>
                </div>
            </header>
            
            <div class="stats-section">
                <div class="total-count">
                    <h3>จำนวนโรงทานทั้งหมด</h3>
                    <p id="totalCount">-</p>
                </div>
                <div class="controls-inline">
                    <div class="search-wrapper">
                        <input type="text" id="searchInput" placeholder="🔍 ค้นหาโรงทาน เมนู" class="search-input">
                    </div>
                    <div class="button-group">
                        <button id="floorPlanBtn" class="floor-plan-btn">
                            <i class="fas fa-th-large"></i>
                            ดูผังโรงทาน
                        </button>
                        <button id="tableViewBtn" class="table-view-btn">
                            <i class="fas fa-table"></i>
                            ดูแบบตาราง
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="restaurant-grid" id="restaurantGrid">
                <!-- ข้อมูลโรงทานจะแสดงที่นี่ -->
            </div>
        </div>
        
        <!-- Floor Plan Modal -->
        <div class="floor-plan-modal" id="floorPlanModal" style="display: none;">
            <div class="modal-overlay" tabindex="-1"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-th-large"></i> ผังโรงทาน</h2>
                    <button class="close-btn" id="closeFloorPlanBtn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="floor-plan-grid" id="floorPlanGrid">
                    <!-- บล็อกโรงทานจะแสดงที่นี่ -->
                </div>
            </div>
        </div>
    `;
    
    app.innerHTML = template;
}

// ฟังก์ชันสำหรับดูรายละเอียดโรงทาน
function showRestaurantDetail(id) {
    const restaurant = RESTAURANT_DATA.find(r => r.id === id);
    if (!restaurant) return;
    
    const hasPicture = restaurant.picLink && 
                      restaurant.picLink.trim() !== '' && 
                      restaurant.picLink.toLowerCase() !== 'n/a';
    
    const template = `
        <div class="modal" id="restaurantModal">
            <div class="modal-overlay" tabindex="-1"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-info-circle"></i> ข้อมูลโรงทาน</h2>
                    <button class="close-btn" id="closeRestaurantBtn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="restaurant-detail">
                    <div class="detail-content">
                        <div class="detail-number">รหัส: ${restaurant.id}</div>
                        <div class="detail-name">${restaurant.name}</div>
                        <div class="detail-menu"><strong>เมนู:</strong> ${restaurant.menu || 'ไม่ระบุเมนู'}</div>
                        ${hasPicture ? `<div class="detail-image"><img src="${restaurant.picLink}" alt="${restaurant.name}" style="max-width: 100%; border-radius: 8px;"></div>` : ''}
                        ${restaurant.postLink ? `<div class="detail-link"><a href="${restaurant.postLink}" target="_blank" rel="noopener noreferrer" class="link-btn"><i class="fab fa-facebook-f"></i> ดูโพสต์ Facebook</a></div>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', template);
    const modal = document.getElementById('restaurantModal');
    modal.style.display = 'flex';
    
    // Event listeners
    document.getElementById('closeRestaurantBtn').addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = '';
    });
    
    modal.querySelector('.modal-overlay').addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = '';
    });
    
    document.body.style.overflow = 'hidden';
}

// ฟังก์ชันแสดง Floor Plan Modal
function showFloorPlanModal(selectedId = null) {
    const modal = document.getElementById('floorPlanModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    renderFloorPlanBlocks(selectedId);
}

// ฟังก์ชันสร้างแผนผังโรงทาน แยกเป็นหมวดของคาวและของหวาน
function renderFloorPlanBlocks(selectedId = null) {
    const container = document.getElementById('floorPlanGrid');
    if (!container) return;
    
    const dataToUse = filteredData.length > 0 ? filteredData : RESTAURANT_DATA;
    
    // จำแนกโรงทานตามประเภท
    const savoryRestaurants = dataToUse.filter(r => categorizeFood(r.menu) === 'คาว');
    const sweetRestaurants = dataToUse.filter(r => categorizeFood(r.menu) === 'หวาน');
    
    // สร้าง HTML สำหรับแต่ละหมวด
    const createSection = (restaurants, title, sectionClass) => {
        if (restaurants.length === 0) return '';
        
        const items = restaurants.map(restaurant => {
            const isSelected = selectedId === restaurant.id;
            return `
                <div class="floor-plan-item ${isSelected ? 'selected' : ''}">
                    <div class="item-number">${restaurant.id}</div>
                    <div class="restaurant-menu-text">โรงทาน${restaurant.menu || 'ไม่ระบุเมนู'}</div>
                    <div class="restaurant-name-text">${restaurant.name}</div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="floor-plan-section ${sectionClass}">
                <div class="section-header">
                    <h3 class="section-title">${title}</h3>
                    <span class="section-count">${restaurants.length} แห่ง</span>
                </div>
                <div class="section-grid">
                    ${items}
                </div>
            </div>
        `;
    };
    
    const savorySection = createSection(savoryRestaurants, '🍛 โรงทานของคาว', 'savory-section');
    const sweetSection = createSection(sweetRestaurants, '🍰 โรงทานของหวาน', 'sweet-section');
    
    container.innerHTML = savorySection + sweetSection;
}

// ฟังก์ชันแสดงผล Gallery
function renderGallery() {
    const container = document.getElementById('restaurantGrid');
    if (!container) return;
    
    const dataToUse = filteredData.length > 0 ? filteredData : RESTAURANT_DATA;
    
    if (dataToUse.length === 0) {
        container.innerHTML = '<div class="no-results">ไม่พบข้อมูลโรงทาน</div>';
        return;
    }
    
    const cards = dataToUse.map(restaurant => {
        const hasPicture = restaurant.picLink && 
                          restaurant.picLink.trim() !== '' && 
                          restaurant.picLink.toLowerCase() !== 'n/a';
        
        return `
            <div class="restaurant-card" onclick="showRestaurantDetail(${restaurant.id})">
                <div class="card-number">${restaurant.id}</div>
                ${hasPicture ? `<div class="card-image"><img src="${restaurant.picLink}" alt="${restaurant.name}"></div>` : '<div class="no-image">ไม่มีรูปภาพ</div>'}
                <div class="card-content">
                    <div class="card-name">${restaurant.name}</div>
                    <div class="card-menu">โรงทาน${restaurant.menu || 'ไม่ระบุเมนู'}</div>
                    ${restaurant.postLink ? `<div class="card-link"><a href="${restaurant.postLink}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()"><i class="fab fa-facebook-f"></i> ดูโพสต์</a></div>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = cards;
}

// ฟังก์ชันค้นหา
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) return;
    
    const performSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        
        if (query === '') {
            filteredData = [...RESTAURANT_DATA];
        } else {
            filteredData = RESTAURANT_DATA.filter(restaurant => 
                restaurant.name.toLowerCase().includes(query) ||
                restaurant.menu.toLowerCase().includes(query) ||
                restaurant.id.toString().includes(query)
            );
        }
        
        renderGallery();
    };
    
    // ค้นหาเมื่อพิมพ์
    searchInput.addEventListener('input', performSearch);
    
    // ค้นหาเมื่อกด Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Table View Functions
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
    document.body.style.overflow = 'hidden';
    
    // Render table
    renderTable();
    
    // Setup table search
    setupTableSearch();
    
    // Close button event
    document.getElementById('closeTableViewBtn').addEventListener('click', closeTableView);
    
    // Overlay click to close
    modal.querySelector('.modal-overlay').addEventListener('click', closeTableView);
}

function renderTable(data = RESTAURANT_DATA) {
    const tableContainer = document.getElementById('tableContainer');
    if (!tableContainer) return;
    
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
                            ${restaurant.postLink ? `<a href="${restaurant.postLink}" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #1877f2, #42a5f5); color: white; text-decoration: none; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;"><i class="fab fa-facebook-f"></i></a>` : '-'}
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
        const filteredData = query === '' ? RESTAURANT_DATA : RESTAURANT_DATA.filter(restaurant => 
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

// Setup ทั้งหมดเมื่อโหลดเสร็จ
function setupEventListeners() {
    // Floor Plan Button
    const floorPlanBtn = document.getElementById('floorPlanBtn');
    if (floorPlanBtn) {
        floorPlanBtn.addEventListener('click', () => showFloorPlanModal());
    }
    
    // Table View Button
    const tableViewBtn = document.getElementById('tableViewBtn');
    if (tableViewBtn) {
        tableViewBtn.addEventListener('click', showTableView);
    }
    
    // Close Floor Plan Modal
    const closeFloorPlanBtn = document.getElementById('closeFloorPlanBtn');
    if (closeFloorPlanBtn) {
        closeFloorPlanBtn.addEventListener('click', () => {
            const modal = document.getElementById('floorPlanModal');
            modal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    // Floor Plan Modal Overlay
    const floorPlanModal = document.getElementById('floorPlanModal');
    if (floorPlanModal) {
        floorPlanModal.querySelector('.modal-overlay').addEventListener('click', () => {
            floorPlanModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
}

// เริ่มต้นแอพพลิเคชัน
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 เริ่มต้นแอพพลิเคชัน...');
    
    // สร้างโครงสร้าง HTML
    createAppStructure();
    
    // ตั้งค่า Event Listeners
    setupEventListeners();
    
    // ตั้งค่าระบบค้นหา
    setupSearch();
    
    // โหลดข้อมูลจาก Google Sheets
    await loadDataFromGoogleSheets();
    
    console.log('✅ เริ่มต้นแอพพลิเคชันเสร็จสิ้น');
});

// Global functions for onclick events
window.showRestaurantDetail = showRestaurantDetail;
window.showFloorPlanModal = showFloorPlanModal;
