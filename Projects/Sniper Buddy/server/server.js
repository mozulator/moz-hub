const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from src directory
app.use('/src', express.static(path.join(__dirname, '../src')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/img', express.static(path.join(__dirname, '../img')));

// Configure static file serving with proper MIME types
app.use('/css', express.static(path.join(__dirname, '../src/css'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.css') {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

app.use('/js', express.static(path.join(__dirname, '../src/js'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.js') {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Serve other static files from src root (for images, data, etc referenced in HTML)
app.use(express.static(path.join(__dirname, '../src'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.css') {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.extname(filePath) === '.js') {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.extname(filePath) === '.json') {
      res.setHeader('Content-Type', 'application/json');
    }
  }
}));

// Root route serves the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/index.html'));
});

// API Routes for Ballistic Data
app.get('/api/ballistics', async (req, res) => {
  try {
    const weapons = await prisma.weapon.findMany({
      include: {
        ammunition: {
          include: {
            ballistics: {
              orderBy: { distance: 'asc' }
            }
          }
        }
      }
    });

    // Transform to match frontend expected structure
    const ballisticData = {};

    weapons.forEach(weapon => {
      ballisticData[weapon.key] = {
        name: weapon.name,
        scopeMultiplier: weapon.scopeMultiplier,
        ammunition: {}
      };

      weapon.ammunition.forEach(ammo => {
        // Convert ballistics array to distance-keyed object
        const ballistics = {};
        ammo.ballistics.forEach(b => {
          ballistics[b.distance.toString()] = b.mils;
        });

        ballisticData[weapon.key].ammunition[ammo.key] = {
          name: ammo.name,
          ballistics: ballistics
        };
      });
    });

    res.json(ballisticData);
  } catch (error) {
    console.error('Error fetching ballistic data:', error);
    
    // Return sample data as fallback
    const sampleData = {
      "axmc": {
        "name": "AXMC .338 LM",
        "scopeMultiplier": 1.0,
        "ammunition": {
          "fmj": {
            "name": "Full Metal Jacket",
            "ballistics": {
              "100": 0.5,
              "200": 1.2,
              "300": 2.1,
              "400": 3.2,
              "500": 4.5,
              "600": 6.0,
              "700": 7.8,
              "800": 9.8,
              "900": 12.1,
              "1000": 14.7
            }
          },
          "ap": {
            "name": "Armor Piercing",
            "ballistics": {
              "100": 0.4,
              "200": 1.0,
              "300": 1.8,
              "400": 2.8,
              "500": 4.0,
              "600": 5.4,
              "700": 7.0,
              "800": 8.8,
              "900": 10.8,
              "1000": 13.0
            }
          }
        }
      },
      "t5000": {
        "name": "ORSIS T-5000M 7.62x51",
        "scopeMultiplier": 1.0,
        "ammunition": {
          "m61": {
            "name": "M61",
            "ballistics": {
              "100": 0.6,
              "200": 1.4,
              "300": 2.4,
              "400": 3.6,
              "500": 5.0,
              "600": 6.6,
              "700": 8.4,
              "800": 10.4,
              "900": 12.6,
              "1000": 15.0
            }
          }
        }
      }
    };
    
    res.json(sampleData);
  }
});

// Get specific weapon data
app.get('/api/weapons/:weaponKey', async (req, res) => {
  try {
    const weapon = await prisma.weapon.findUnique({
      where: { 
        key: req.params.weaponKey,
        scopeMultiplier: {
          gt: 1
        }
      },
      include: {
        ammunition: {
          include: {
            ballistics: {
              orderBy: { distance: 'asc' }
            }
          }
        }
      }
    });

    if (!weapon) {
      return res.status(404).json({ error: 'Weapon not found or scope multiplier <= 1' });
    }

    res.json(weapon);
  } catch (error) {
    console.error('Error fetching weapon data:', error);
    res.status(500).json({ error: 'Failed to fetch weapon data' });
  }
});

// Get ballistic data for specific weapon and ammo
app.get('/api/weapons/:weaponKey/:ammoKey', async (req, res) => {
  try {
    const weapon = await prisma.weapon.findUnique({
      where: { 
        key: req.params.weaponKey,
        scopeMultiplier: {
          gt: 1
        }
      },
      include: {
        ammunition: {
          where: { key: req.params.ammoKey },
          include: {
            ballistics: {
              orderBy: { distance: 'asc' }
            }
          }
        }
      }
    });

    if (!weapon || weapon.ammunition.length === 0) {
      return res.status(404).json({ error: 'Weapon not found, scope multiplier <= 1, or ammunition not found' });
    }

    res.json({
      weapon: {
        key: weapon.key,
        name: weapon.name,
        scopeMultiplier: weapon.scopeMultiplier
      },
      ammunition: weapon.ammunition[0]
    });
  } catch (error) {
    console.error('Error fetching ballistic data:', error);
    res.status(500).json({ error: 'Failed to fetch ballistic data' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Sniper Buddy Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/ballistics`);
  console.log(`🎯 Frontend available at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
}); 