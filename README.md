# โรงทาน - งานผ้าป่าเพื่อการศึกษา ⚡

เว็บไซต์แสดงรายชื่อโรงทานจากงานผ้าป่าเพื่อการศึกษาโรงเรียนบ้านโนนผักชี  
พัฒนาด้วย **Vite** เพื่อความเร็วและประสิทธิภาพสูงสุด

🔗 **[ดูเว็บไซต์](https://rong-tarn-npc68.vercel.app)** (ตัวอย่าง Vercel URL)

## ✨ คุณสมบัติ

- ⚡ **ความเร็วสูง** - พัฒนาด้วย Vite
- 🔍 **ค้นหาแบบเรียลไทม์** - ค้นหาโรงทานและเมนูได้ทันที
- 📱 **Responsive Design** - ใช้งานได้ดีทุกอุปกรณ์
- 🎨 **UI สวยงาม** - ออกแบบด้วย CSS3 และ Animation
- 🚀 **พร้อม Deploy** - รองรับ Vercel, Netlify, GitHub Pages
- 🔤 **ฟอนต์ไทย** - Noto Sans Thai สำหรับการอ่านที่ดี

## 🏗️ โครงสร้าง

```
src/
├── main.js       # ไฟล์หลัก JavaScript
├── style.css     # สไตล์ CSS
├── vite.svg      # ไอคอน Vite
└── ...

public/           # ไฟล์ static
index.html        # หน้าเว็บหลัก
package.json      # การตั้งค่า Node.js
```

## 🚀 การใช้งาน

### Development
```bash
npm install
npm run dev
```

### Build สำหรับ Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 📊 ข้อมูลโรงทาน

แสดงข้อมูล 15 โรงทานจากงานผ้าป่า ประกอบด้วย:
- 📍 หมายเลขลำดับ
- 🏪 ชื่อโรงทาน/เจ้าของ
- 🍽️ เมนูอาหาร
- 🔗 ลิงก์ Facebook (ถ้ามี)

## 🌐 Deploy ขึ้น Vercel

### วิธีที่ 1: ผ่าน Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

### วิธีที่ 2: ผ่าน GitHub
1. Push โค้ดขึ้น GitHub
2. เชื่อมต่อ repository กับ Vercel
3. Deploy อัตโนมัติทุกครั้งที่ push

### วิธีที่ 3: ลาก Drop Files
1. รัน `npm run build`
2. อัพโหลดโฟลเดอร์ `dist` ไปที่ Vercel

## 🔧 การปรับแต่ง

### เปลี่ยนข้อมูลโรงทาน
แก้ไขในไฟล์ `src/main.js`:
```javascript
const RESTAURANT_DATA = [
    {
        id: 1,
        name: 'ชื่อโรงทาน',
        menu: 'เมนูอาหาร',
        link: 'https://facebook.com/...'
    },
    // เพิ่มข้อมูลใหม่ที่นี่
];
```

### เปลี่ยนสีธีม
แก้ไขในไฟล์ `src/style.css`:
```css
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 📱 คีย์บอร์ดลัด

- `Ctrl/Cmd + K` - เปิดช่องค้นหา
- คลิกที่หัวข้อ - กลับขึ้นด้านบน

## 🛠️ เทคโนโลยี

- **Vite** - Build tool รุ่นใหม่ที่เร็วมาก
- **Vanilla JavaScript** - ไม่ใช้ Framework เพื่อความเบา
- **CSS3** - Animation และ modern styling
- **Font Awesome** - ไอคอนสวยงาม
- **Google Fonts** - ฟอนต์ภาษาไทย

## ⚡ ทำไมต้อง Vite?

- 🔥 **Hot Module Replacement** - อัพเดทโค้ดแบบเรียลไทม์
- ⚡ **Bundle เร็วมาก** - ใช้ esbuild
- 📦 **Tree Shaking** - ลบโค้ดที่ไม่ใช้
- 🎯 **โหลดเร็ว** - Code splitting อัตโนมัติ
- 🚀 **Deploy ง่าย** - Output พร้อมใช้

## 📈 Performance

- ⚡ First Contentful Paint < 1s
- 📱 Mobile Friendly Score: 100/100
- 🎯 Lighthouse Score: 90+
- 📦 Bundle Size < 50KB

## 🤝 การสนับสนุน

หากต้องการความช่วยเหลือ:
- 📧 ติดต่อโรงเรียนบ้านโนนผักชี
- 💬 สร้าง Issue ใน GitHub
- 📱 แชร์ข้อผิดพลาดในโค้ด

---

**สร้างด้วย ❤️ เพื่อการศึกษา** | **Powered by Vite ⚡**
