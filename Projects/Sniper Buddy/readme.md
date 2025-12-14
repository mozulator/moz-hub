# SNIPER BUDDY v2.0 - TACTICAL BALLISTICS SYSTEM

## Overview

**Sniper Buddy v2.0** is a professional ballistics calculator designed for precision shooting in Escape from Tarkov. Built with a modern database-driven architecture, it provides accurate scope adjustment calculations for weapons with proper scope multipliers and features an interactive map system for tactical planning.

## 🎯 Key Features

### **Database-Driven Architecture**
- **Prisma ORM** with SQLite database for reliable data storage
- **Express.js API** server for scalable data access
- **Real-time ballistic calculations** from database
- **Version tracking** and data integrity

### **Professional Ballistics Calculator**
- **Precision scope adjustment calculations** in MILS
- **Only verified weapons** with scope multiplier > 1.0
- **Comprehensive ballistic table** (450m - 1000m in 10m increments)
- **Interactive ballistic charts** with target point visualization
- **Multiple ammunition types** per weapon

### **Interactive Map System**
- **Woods map integration** with sniping spot placement
- **Distance measurement** with real-world coordinates
- **Target designation** and line-of-sight visualization
- **Persistent spot storage** with localStorage

### **Modern UI/UX**
- **Military-themed tactical interface** with cyan accents
- **Responsive grid layout** with multiple operational panels
- **Real-time data updates** when changing weapons/ammunition
- **Professional reference table** with highlighted major increments

## 🚀 Quick Start

### **Installation**
1. **Clone or download** the project
2. **Install Node.js** (v14+ required)
3. **Open PowerShell** in project directory
4. **Run setup commands**:
   ```powershell
   npm install
   npm run db:generate
   npm run db:migrate
   ```

### **Starting the Server**
```powershell
npm start
```
Server runs on: **http://localhost:3000**

### **Alternative Static Serving**
```powershell
npm run serve-static
```
Static server runs on: **http://localhost:8080**

## 📊 Weapon Database

### **Supported Weapons (Scope Multiplier > 1.0)**

| Weapon | Scope Multiplier | Ammunition Types |
|--------|------------------|------------------|
| **AXMC .338 LM** | 3.59x | • .338 Lapua FMJ<br>• .338 Lapua AP |
| **ORSIS T-5000M** | 2.48x | • 7.62x51 M61 |

*Note: Only weapons with verified scope multipliers > 1.0 are included for accuracy*

## 🎛️ System Architecture

### **Project Structure**
```
Sniper Buddy/
├── server/
│   └── server.js           # Express API server with database routes
├── prisma/
│   ├── schema.prisma       # Database schema definition
│   └── migrations/         # Database migration files
├── src/
│   ├── index.html          # Main tactical dashboard
│   └── css/                # Styling (base, components, panels, etc.)
├── assets/images/          # Weapon configuration images
├── img/woods.png          # Interactive map image
├── package.json           # Dependencies and scripts
└── DATABASE_SETUP.md      # Detailed database documentation
```

### **Technology Stack**
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: SQLite (local file-based)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Charts**: Chart.js for ballistic visualization
- **Styling**: Custom tactical CSS with CSS Grid

## 🎯 Core Functionality

### **Ballistic Calculations**
```javascript
// Core formula
Tarkov MILS = Theoretical MILS × Weapon Scope Multiplier

// Example: AXMC at 600m
Theoretical MILS = 1.34 (from ballistic data)
Scope Multiplier = 3.59
Result = 1.34 × 3.59 = 4.81 MILS
```

### **Ballistic Reference Table**
- **Range**: 450m to 1000m in 10m increments
- **Major increments** (every 50m) highlighted in bold
- **Real-time updates** based on selected weapon/ammunition
- **Professional format** for quick field reference

### **Interactive Features**
1. **Weapon Selection**: Choose from verified weapons
2. **Ammunition Selection**: Pick specific ammo type
3. **Distance Calculator**: Input any distance for precise MILS
4. **Chart Visualization**: Interactive ballistic curve with target point
5. **Map Planning**: Place sniping spots and measure distances

## 🗺️ Map System

### **Woods Map Features**
- **Click to place sniping spots** (orange circles)
- **Add targets** by selecting spot first, then clicking target location
- **Distance measurement** between spots and targets
- **Real-world coordinates** (1375m × 1450m map scale)
- **Persistent storage** saves spots between sessions

### **Map Controls**
- **Place Sniping Spot**: Toggle mode and click on map
- **Clear All**: Remove all spots and lines
- **Tarkov.dev Link**: Open external map reference

## 🔧 API Endpoints

### **Database API Routes**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ballistics` | GET | All weapons with scope multiplier > 1 |
| `/api/weapons/:key` | GET | Specific weapon data |
| `/api/weapons/:key/:ammo` | GET | Weapon + ammunition ballistic data |
| `/api/health` | GET | API health check |

### **Example API Response**
```json
{
  "version": "2.0.0",
  "weapons": {
    "axmc": {
      "name": "AXMC .338 LM",
      "scopeMultiplier": 3.59,
      "ammunition": {
        "fmj": {
          "name": ".338 Lapua FMJ",
          "ballisticData": [
            {"distance": 450, "mils": 0.00},
            {"distance": 500, "mils": 0.47},
            // ... more data points
          ]
        }
      }
    }
  }
}
```

## 💾 Database Management

### **Available Scripts**
```powershell
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations  
npm run db:reset       # Reset database (removes all data)
npm run db:studio      # Open Prisma Studio (database GUI)
```

### **Database Schema**
- **Weapon**: id, key, name, scopeMultiplier
- **Ammunition**: id, key, name, weaponId
- **BallisticData**: id, distance, mils, ammunitionId
- **DataVersion**: id, version, description, lastUpdated

## 🎨 User Interface

### **Dashboard Layout**
```
┌─────────────────────────────────────────────────────────┐
│                    HEADER & STATUS                      │
├─────────────┬─────────────────────────┬─────────────────┤
│  LEFT PANEL │                         │  RIGHT PANEL    │
│             │      MAIN PANEL         │                 │
│ • Weapon    │                         │ • Ballistic     │
│   Select    │   Interactive Chart     │   Reference     │
│ • Ammo      │   & Woods Map          │   Table         │
│   Select    │                         │ • 450-1000m    │
│ • Distance  │                         │   in 10m inc   │
│   Calc      │                         │                 │
└─────────────┴─────────────────────────┴─────────────────┤
│                    FOOTER STATUS                        │
└─────────────────────────────────────────────────────────┘
```

### **Visual Design**
- **Tactical theme** with dark background and cyan accents
- **Military fonts**: Orbitron (headers) and Share Tech Mono (data)
- **Grid-based layout** with responsive panels
- **Highlighted data points** for quick reference
- **Hover effects** and smooth transitions

## 🔍 Troubleshooting

### **Common Issues**

| Problem | Solution |
|---------|----------|
| **Server won't start** | Kill existing processes: `taskkill /F /IM node.exe` |
| **Database errors** | Run `npm run db:generate` and `npm run db:migrate` |
| **No weapons showing** | Verify database is populated with scope multiplier > 1 |
| **Chart not loading** | Check browser console for JavaScript errors |
| **Map not interactive** | Ensure images are loaded and click handlers active |

### **Performance Tips**
- **Use Chrome/Edge** for best compatibility
- **Enable JavaScript** for full functionality  
- **Clear browser cache** if experiencing issues
- **Check console** for detailed error messages

## 📈 Technical Details

### **Ballistic Interpolation**
```javascript
// Linear interpolation between data points
function interpolateMils(targetDistance) {
    // Find bounding data points
    const lower = findLowerBound(targetDistance);
    const upper = findUpperBound(targetDistance);
    
    // Calculate interpolated value
    const ratio = (targetDistance - lower.distance) / 
                  (upper.distance - lower.distance);
    return lower.mils + ratio * (upper.mils - lower.mils);
}
```

### **Database Integration**
- **Real-time queries** to SQLite database via Prisma
- **Filtered results** showing only weapons with scope multiplier > 1
- **Cached responses** for performance optimization
- **Error handling** with fallback mechanisms

### **Map Coordinate System**
- **Real-world scale**: 1375m × 1450m (Woods dimensions)
- **Pixel-to-meter conversion** for accurate distance measurement
- **Persistent storage** using localStorage
- **Cross-session compatibility** with data preservation

## 🔄 Version History

- **v2.0.0** - Database-driven architecture with Prisma + SQLite
- **v1.9.0** - Removed voice recognition, cleaned up codebase
- **v1.8.0** - Added ballistic reference table (450-1000m)
- **v1.7.0** - Filtered weapons to scope multiplier > 1 only
- **v1.6.0** - Integrated Express API server
- **v1.5.0** - Interactive charts and map system

## 📝 Development

### **Adding New Weapons**
1. **Add weapon data** to database via Prisma Studio
2. **Include scope multiplier** > 1.0 for visibility
3. **Add ballistic data points** for ammunition types
4. **Test calculations** for accuracy

### **Database Updates**
1. **Modify** `prisma/schema.prisma` if needed
2. **Create migration**: `npx prisma migrate dev`
3. **Generate client**: `npm run db:generate`
4. **Update API** endpoints if required

### **Contributing**
- **Follow existing code style** and patterns
- **Test thoroughly** with multiple weapons/ammunition
- **Document changes** in README and comments
- **Verify database integrity** after modifications

---

**🎯 SNIPER BUDDY v2.0 | TACTICAL BALLISTICS SYSTEM**  
*Database-Driven • API-Powered • Professional Grade*  
*Verified Weapons: AXMC .338 LM | ORSIS T-5000M*  
*Built with: Node.js • Express • Prisma • SQLite*
