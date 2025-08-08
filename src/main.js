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
        
        // ใช้ข้อมูลสำรอง
        RESTAURANT_DATA = [
            {
                id: 1,
                name: 'ขนมจีนน้ำยา',
                menu: 'ขนมจีนน้ำยา',
                postLink: 'https://www.facebook.com/photo',
                picLink: 'https://via.placeholder.com/300x180/1565c0/ffffff?text=ขนมจีนน้ำยา'
            },
            {
                id: 2,
                name: 'ข้าวเหนียวหมูทอด-ขนม',
                menu: 'ข้าวเหนียวหมูทอด และขนม',
                postLink: 'https://www.facebook.com/photo',
                picLink: 'https://via.placeholder.com/300x180/1565c0/ffffff?text=ข้าวเหนียวหมูทอด'
            },
            {
                id: 3,
                name: 'ข้าวยี่สม',
                menu: 'ข้าวยี่สม',
                postLink: 'https://www.facebook.com/photo',
                picLink: 'https://via.placeholder.com/300x180/1565c0/ffffff?text=ข้าวยี่สม'
            }
        ];
        
        console.log('📝 ใช้ข้อมูลสำรอง');
        return RESTAURANT_DATA;
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

// แยกชื่อโรงทานจากชื่อ-สกุล
function extractRestaurantName(fullText) {
    if (!fullText) return '';
    
    // ลบชื่อ-สกุลและข้อความอื่นๆ ที่ไม่เกี่ยวข้อง
    // หาชื่อโรงทานโดยดูจากคำที่บอกถึงอาหาร/โรงทาน
    const text = fullText.trim();
    
    // ถ้ามีคำว่า "โรงทาน" ให้ตัดจากตรงนั้น
    if (text.includes('โรงทาน')) {
        const parts = text.split('โรงทาน');
        if (parts.length > 1) {
            return 'โรงทาน' + parts[1].trim();
        }
    }
    
    // ถ้าไม่มี ให้ตัดส่วนท้ายที่อาจเป็นชื่อโรงทาน/เมนู
    const words = text.split(/\s+/);
    
    // หาคำที่อาจเป็นชื่อโรงทานจากคำสุดท้าย
    const restaurantKeywords = ['ข้าว', 'ขนม', 'น้ำ', 'ไอติม', 'ของ', 'ผล', 'ลูก', 'แกง', 'ต้ม', 'ทอด', 'ย่าง', 'ผัด'];
    
    // ถ้าพบคำที่เกี่ยวกับอาหาร ให้เอาส่วนนั้น
    for (let i = words.length - 1; i >= 0; i--) {
        const word = words[i];
        if (restaurantKeywords.some(keyword => word.includes(keyword))) {
            return words.slice(i).join(' ');
        }
    }
    
    // ถ้าไม่พบ ให้เอาคำสุดท้าย 2-3 คำ
    if (words.length > 2) {
        return words.slice(-2).join(' ');
    }
    
    return text;
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
                    <h3>จำนวนโรงทานทั้งหมด</h3>
                    <p id="totalCount">-</p>
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
        <div class="restaurant-card">
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

// แปลง Facebook link เป็น image URL ที่แสดงได้
function convertFacebookLinkToImage(facebookUrl) {
    try {
        // ล้าง URL และตรวจสอบ
        const cleanUrl = facebookUrl.trim();
        
        // ถ้าเป็น Facebook URL ให้แปลงเป็น image URL
        if (cleanUrl.includes('facebook.com') || cleanUrl.includes('fb.com')) {
            return cleanUrl; // คืน URL เดิม สำหรับแสดงเป็นลิงก์
        }
        
        return cleanUrl;
    } catch (error) {
        console.error('Error converting Facebook link:', error);
        return facebookUrl; // คืน URL เดิมถ้าเกิดข้อผิดพลาด
    }
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
        
        // เพิ่ม smooth scroll
        addSmoothScroll();
        
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
    title.style.cursor = 'pointer';
    title.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// เริ่มต้นแอพเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', initApp);

// เพิ่ม Service Worker สำหรับ PWA (ถ้าต้องการ)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js');
    });
}
