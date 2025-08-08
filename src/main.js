import './style.css'

// Google Sheets configuration - ใช้ CSV format เพื่อหลีกเลี่ยง API key
const SHEET_ID = '1xnBYAKJWQ1dLpCuHm0d4-Z85Q10suWL8D7pF5YLjs40';
const SHEET_GID = '482023215'; // GID ของชีท "โรงทาน"
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

// ข้อมูลโรงทาน (จะโหลดจาก Google Sheets)
let RESTAURANT_DATA = [];

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
        
        // ข้าม header row และประมวลผลข้อมูล - อ่านจากคอลัมน์ A, C, D, G, H
        RESTAURANT_DATA = lines.slice(1)
            .map((line, index) => {
                if (!line.trim()) return null; // ข้ามบรรทัดว่าง
                
                const columns = parseCSVLine(line);
                const id = columns[0] || ''; // Column A: ที่
                const restaurantName = columns[2] || ''; // Column C: ชื่อโรงทาน
                const menu = columns[3] || ''; // Column D: เมนู  
                const postLink = columns[6] || ''; // Column G: link โพสต์
                const picLink = columns[7] || ''; // Column H: pic - direct image link
                
                // ต้องมีทั้ง ID และชื่อโรงทาน และ ID ต้องเป็นตัวเลข
                if (!id.trim() || !restaurantName.trim() || isNaN(parseInt(id))) {
                    return null;
                }
                
                const parsedId = parseInt(id);
                
                // ตรวจสอบว่า ID เป็นเลขบวก
                if (parsedId <= 0) return null;
                
                return {
                    id: parsedId,
                    name: restaurantName.trim(),
                    menu: menu.trim(),
                    postLink: postLink.trim(),
                    picLink: picLink.trim()
                };
            })
            .filter(item => item !== null) // กรองรายการที่เป็น null
            .sort((a, b) => a.id - b.id); // เรียงตาม ID
        
        console.log(`✅ โหลดข้อมูลสำเร็จ: ${RESTAURANT_DATA.length} รายการ`);
        return RESTAURANT_DATA;
        
    } catch (error) {
        console.error('❌ ไม่สามารถโหลดข้อมูลจาก Google Sheets:', error);
        throw error;
    }
}

// แปลง CSV line โดยจัดการกับ quotes
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

// State management
let filteredData = [];

// สร้าง HTML structure
function createAppStructure() {
    const app = document.querySelector('#app');
    
    app.innerHTML = `
        <header class="header">
            <div class="container">
                <div class="header-content">
                    <div class="logo-section">
                        <div class="school-logo" id="schoolLogo">
                            <img src="https://i.ibb.co/zVpMg2gV/274832789bf1.jpg" alt="โลโก้โรงเรียน" />
                        </div>
                    </div>
                    <div class="title-section">
                        <h1 class="title">
                            <i class="fas fa-utensils"></i>
                            รายชื่อโรงทาน
                        </h1>
                        <p class="subtitle">งานผ้าป่าเพื่อการศึกษาโรงเรียนบ้านโนนผักชี</p>
                    </div>
                </div>
            </div>
        </header>

        <main class="main">
            <div class="container">
                <div class="stats">
                    <div class="stats-layout" style="display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 8px;">
                        <button id="floorPlanBtn" class="floor-plan-btn">
                            <i class="fas fa-map"></i>
                            ผังโรงทาน
                        </button>
                        <div class="total-count-section">
                            <h3>จำนวนโรงทานทั้งหมด</h3>
                            <p id="totalCount">-</p>
                        </div>
                    </div>
                </div>

                <div class="search-container">
                    <input 
                        type="text" 
                        id="searchInput" 
                        class="search-input" 
                        placeholder="🔍 ค้นหาโรงทานหรือเมนู..."
                        autocomplete="off"
                    >
                </div>

                <div class="loading" id="loading">
                    <i class="fas fa-spinner"></i>
                    <p>กำลังโหลดข้อมูลจาก Google Sheets...</p>
                </div>

                <div class="restaurant-grid" id="restaurantGrid" style="display: none;">
                    <!-- ข้อมูลโรงทานจะแสดงที่นี่ -->
                </div>

                <div class="error-message" id="errorMessage" style="display: none;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>ไม่พบผลการค้นหา</p>
                    <button onclick="clearSearch()" class="retry-btn">แสดงทั้งหมด</button>
                </div>
            </div>
        </main>

        <!-- Floor Plan Modal -->
        <div class="floor-plan-modal" id="floorPlanModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100vw; height: 100vh; justify-content: center; align-items: center;">
            <div class="modal-overlay" style="position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.35);" tabindex="-1"></div>
            <div class="modal-content" style="position: relative; background: #fff; border-radius: 16px; max-width: 900px; min-width: 320px; width: 90vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 8px 32px #0002; padding: 24px 16px 16px 16px;">
                <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <h2 style="font-size: 1.3rem; color: #1565c0; margin: 0;">
                        <i class="fas fa-map"></i>
                        ผังโรงทาน
                    </h2>
                    <button class="close-btn" id="closeFloorPlanBtn" style="background: none; border: none; font-size: 1.5rem; color: #888; cursor: pointer;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="floor-plan-blocks" id="floorPlanBlocks" style="display: flex; flex-wrap: wrap; gap: 12px; padding: 16px 0; justify-content: flex-start; align-items: flex-start;">
                    <!-- บล็อกโรงทานจะแสดงที่นี่ -->
                </div>
            </div>
        </div>

        <footer class="footer">
            <div class="container">
                <p>&copy; 2025 โรงเรียนบ้านโนนผักชี - งานผ้าป่าเพื่อการศึกษา</p>
            </div>
        </footer>
    `;
}

// สร้างการ์ดโรงทาน (แสดงรูปจากคอลัมน์ H, ลิงก์จากคอลัมน์ G)
function createRestaurantCard(restaurant) {
    const hasPicture = restaurant.picLink && 
                      restaurant.picLink.trim() !== '' && 
                      restaurant.picLink !== '/';
    
    const hasPostLink = restaurant.postLink && 
                       restaurant.postLink.trim() !== '' && 
                       restaurant.postLink !== '/';
    
    const imageHtml = hasPicture ? createImageHtml(restaurant.picLink) : '';
    
    const linkHtml = hasPostLink ? 
        `<a href="${restaurant.postLink}" target="_blank" rel="noopener noreferrer" class="link-btn">
            <i class="fab fa-facebook-f"></i>
            ดูโพสต์เต็ม
        </a>` : '';
    
    return `
        <div class="restaurant-card" data-restaurant-id="${restaurant.id}">
            <div class="restaurant-id">${restaurant.id}</div>
            <div class="restaurant-name">${escapeHtml(restaurant.name)}</div>
            ${hasPicture ? `<div class="image-section">${imageHtml}</div>` : ''}
            <div class="menu-section">
                <span class="menu-label">เมนู:</span>
                <span class="menu-text">${escapeHtml(restaurant.menu) || 'ไม่ระบุเมนู'}</span>
            </div>
            ${linkHtml ? `<div class="link-section">${linkHtml}</div>` : ''}
        </div>
    `;
}

// สร้าง HTML สำหรับรูปภาพ (จาก direct image link)
function createImageHtml(imageUrl) {
    return `
        <div class="image-container">
            <img src="${imageUrl}" 
                 alt="รูปโรงทาน" 
                 class="restaurant-image"
                 loading="lazy"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="image-placeholder" style="display: none;">
                <i class="fas fa-image"></i>
                <span>ไม่สามารถโหลดรูปได้</span>
            </div>
        </div>
    `;
}

// แสดงข้อมูลโรงทาน
function displayRestaurants(data = filteredData) {
    const grid = document.getElementById('restaurantGrid');
    const totalCount = document.getElementById('totalCount');
    const errorMessage = document.getElementById('errorMessage');
    
    // อัพเดทจำนวน
    totalCount.textContent = data.length;
    
    if (data.length === 0) {
        grid.style.display = 'none';
        errorMessage.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    errorMessage.style.display = 'none';
    
    grid.innerHTML = data.map(restaurant => createRestaurantCard(restaurant)).join('');
}

// ฟังก์ชันค้นหา
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            filteredData = [...RESTAURANT_DATA];
        } else {
            filteredData = RESTAURANT_DATA.filter(restaurant => 
                restaurant.name.toLowerCase().includes(searchTerm) ||
                restaurant.menu.toLowerCase().includes(searchTerm)
            );
        }
        
        displayRestaurants(filteredData);
    });

    // เพิ่ม keyboard shortcut
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

// ล้างการค้นหา
window.clearSearch = function() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    filteredData = [...RESTAURANT_DATA];
    displayRestaurants(filteredData);
    searchInput.focus();
}

// Escape HTML เพื่อป้องกัน XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// แสดง loading animation
function showLoading(show = true) {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('restaurantGrid');
    
    loading.style.display = show ? 'block' : 'none';
    grid.style.display = show ? 'none' : 'grid';
}

// เริ่มต้นแอพพลิเคชัน
async function initApp() {
    createAppStructure();
    
    // แสดง loading animation
    showLoading(true);
    
    try {
        // โหลดข้อมูลจาก Google Sheets
        await loadDataFromGoogleSheets();
        filteredData = [...RESTAURANT_DATA];
        
        // แสดงข้อมูล
        showLoading(false);
        displayRestaurants();
        setupSearch();
        
        // เพิ่ม smooth scroll และ floor plan
        addSmoothScroll();
        setupFloorPlan();
        setupFloorPlanEvents();

        console.log(`✅ เริ่มต้นแอพสำเร็จ: ${RESTAURANT_DATA.length} รายการ`);
        
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการเริ่มต้นแอพ:', error);
        showLoading(false);
        
        // แสดงข้อผิดพลาด
        const grid = document.getElementById('restaurantGrid');
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: white; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; color: #e74c3c;"></i>
                <p style="font-size: 1.2rem;">ไม่สามารถโหลดข้อมูลได้</p>
                <button onclick="location.reload()" class="retry-btn" style="margin-top: 15px;">ลองใหม่</button>
            </div>
        `;
        grid.style.display = 'grid';
    }
}

// เพิ่มฟังก์ชัน smooth scroll
function addSmoothScroll() {
    // Scroll to top when clicking title
    const title = document.querySelector('.title');
    if (title) {
        title.style.cursor = 'pointer';
        title.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Floor Plan Functions
function setupFloorPlan() {
    const floorPlanBtn = document.getElementById('floorPlanBtn');
    if (floorPlanBtn) {
        // เพิ่ม event listener เท่านั้น
        floorPlanBtn.addEventListener('click', showFloorPlan);
    }
}

function showFloorPlan() {
    const modal = document.getElementById('floorPlanModal');
    const floorPlanBlocks = document.getElementById('floorPlanBlocks');
    
    if (modal && floorPlanBlocks) {
        renderFloorPlanBlocks();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeFloorPlan() {
    const modal = document.getElementById('floorPlanModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function renderFloorPlanBlocks() {
    const floorPlanBlocks = document.getElementById('floorPlanBlocks');
    if (!floorPlanBlocks) return;
    
    const sorted = [...RESTAURANT_DATA].sort((a, b) => a.id - b.id);
    const groupSize = 4; // จำนวนต่อแถว
    const rows = [];
    for (let i = 0; i < sorted.length; i += groupSize) {
        rows.push(sorted.slice(i, i + groupSize));
    }

    const createBlock = (r) => `
        <div class="floor-plan-block" style="flex:1 1 0; min-width: 0; background: #fffde7; border: 1.5px solid #ffb300; border-radius: 8px; padding: 8px 6px; text-align: left; font-size: 0.85rem; box-shadow: 0 1px 4px #ffb30022; display: flex; flex-direction: column; gap: 3px; cursor: pointer; transition: box-shadow 0.2s;"
            tabindex="0"
            title="#${r.id} ${escapeHtml(r.menu)} - ${escapeHtml(r.name)}"
            onmouseover="this.style.boxShadow='0 2px 12px #ffb30055'" onmouseout="this.style.boxShadow='0 1px 4px #ffb30022'">
            <div style="font-weight: 700; color: #1565c0; font-size: 0.9rem; line-height:1;">#${r.id}</div>
            <div style="color: #ffb300; font-size: 0.95rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(r.menu) || 'ไม่ระบุเมนู'}</div>
            <div style="color: #1976d2; font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(r.name)}</div>
        </div>`;

    floorPlanBlocks.innerHTML = `
        <div class="floor-plan-rows" style="display:flex; flex-direction:column; width:100%; gap:10px;">
            ${rows.map(row => `
                <div class="floor-plan-row" style="display:flex; gap:8px; width:100%;">
                    ${row.map(createBlock).join('')}
                </div>`).join('')}
        </div>`;
}

// เพิ่ม event listener สำหรับคลิกบล็อกในผัง
function setupFloorPlanEvents() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.restaurant-block') || e.target.closest('.floor-plan-block')) {
            const block = e.target.closest('.restaurant-block') || e.target.closest('.floor-plan-block');
            const titleAttr = block.getAttribute('title') || '';
            const restaurantId = parseInt(titleAttr.match(/#(\d+)/)?.[1]);
            
            if (restaurantId) {
                // ปิด modal
                closeFloorPlan();
                
                // ค้นหาโรงทานและ scroll ไปที่การ์ด
                setTimeout(() => {
                    const restaurantCard = document.querySelector(`[data-restaurant-id="${restaurantId}"]`);
                    if (restaurantCard) {
                        restaurantCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // เพิ่มเอฟเฟ็คไฮไลท์
                        restaurantCard.classList.add('highlight');
                        setTimeout(() => {
                            restaurantCard.classList.remove('highlight');
                        }, 2000);
                    }
                }, 300);
            }
        }
        
        // ปิด modal เมื่อคลิก overlay
        if (e.target.classList.contains('modal-overlay')) {
            closeFloorPlan();
        }
        
        // ปิด modal เมื่อคลิกปุ่มปิด
        if (e.target.id === 'closeFloorPlanBtn' || e.target.closest('#closeFloorPlanBtn')) {
            closeFloorPlan();
        }
    });
    
    // ปิด modal เมื่อกด Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('floorPlanModal');
            if (modal && modal.style.display === 'flex') {
                closeFloorPlan();
            }
        }
    });
}

// เริ่มต้นแอพเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', initApp);

// เพิ่ม Service Worker สำหรับ PWA (ถ้าต้องการ)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js');
    });
}
