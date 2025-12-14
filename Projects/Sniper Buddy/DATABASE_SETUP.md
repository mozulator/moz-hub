# Sniper Buddy Database Setup Guide

## 🗄️ Database Migration: From JSON to Prisma + SQLite

This guide explains how to set up and use the new Prisma-powered database system for Sniper Buddy ballistic data.

## ✨ Benefits of the Database Upgrade

- **🚀 Performance**: Much faster data loading compared to JSON files
- **🔒 Reliability**: No more CORS or file serving issues
- **📊 Scalability**: Easy to add new weapons and ammunition types
- **🔍 Query Power**: Advanced filtering and searching capabilities
- **🛠️ Maintenance**: Better data integrity and easier updates
- **📈 Analytics**: Track usage patterns and data versions

## 🏗️ Architecture Overview

```
Frontend (HTML/JS) → API Server (Express) → Database (SQLite via Prisma)
```

- **Frontend**: `src/index.html` - Your ballistics calculator interface
- **API Server**: `server/server.js` - Express server with REST endpoints
- **Database**: `prisma/ballistics.db` - SQLite database with ballistic data
- **Schema**: `prisma/schema.prisma` - Database structure definition

> Note (hub deployment): when Sniper Buddy is hosted inside the hub, Prisma reads the DB path from `DATABASE_URL`.
> Set `DATABASE_URL=file:./Projects/Sniper Buddy/prisma/ballistics.db`

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npm run db:generate
```

### 3. Create Database & Run Migrations
```bash
npm run db:migrate
```

### 4. Seed Database with Ballistic Data
```bash
npm run db:seed
```

### 5. Start the Server
```bash
npm start
```

Your application will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api/ballistics

## 📊 Database Schema

### Tables Structure

```sql
weapons
├── id (String, Primary Key)
├── key (String, Unique) -- e.g., "axmc", "t5000"  
├── name (String) -- e.g., "AXMC .338 LM"
├── scopeMultiplier (Float)
└── timestamps (createdAt, updatedAt)

ammunition
├── id (String, Primary Key)
├── key (String) -- e.g., "fmj", "ap", "m61"
├── name (String) -- e.g., "Full Metal Jacket"
├── weaponId (String, Foreign Key)
└── timestamps (createdAt, updatedAt)

ballistic_data
├── id (String, Primary Key)
├── distance (Int) -- meters
├── mils (Float) -- mill adjustment value
├── ammunitionId (String, Foreign Key)
└── timestamps (createdAt, updatedAt)
```

## 🔌 API Endpoints

### Get All Ballistic Data
```http
GET /api/ballistics
```
Returns complete ballistic data in the same format as the original JSON.

### Get Specific Weapon
```http
GET /api/weapons/{weaponKey}
```
Example: `GET /api/weapons/axmc`

### Get Weapon + Ammunition Data
```http
GET /api/weapons/{weaponKey}/{ammoKey}
```
Example: `GET /api/weapons/axmc/fmj`

### Health Check
```http
GET /api/health
```

## 🛠️ Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-restart |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Populate database with ballistic data |
| `npm run db:reset` | Reset database and re-seed |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

## 🔧 Database Management

### View Database Contents
```bash
npm run db:studio
```
This opens Prisma Studio in your browser for visual database management.

### Add New Weapon Data

1. **Option A: Direct Database** (via Prisma Studio)
   - Run `npm run db:studio`
   - Add records through the web interface

2. **Option B: Update Seed File**
   - Modify `server/seed.js`
   - Run `npm run db:reset`

3. **Option C: API Endpoints** (Future Enhancement)
   - Create POST/PUT endpoints for data management

### Backup Database
```bash
# The SQLite database file is located at:
# prisma/ballistics.db
cp prisma/ballistics.db backup/ballistics_backup_$(date +%Y%m%d).db
```

## 🚨 Troubleshooting

### "npm: command not found"
- Install Node.js from https://nodejs.org/

### Database Connection Issues
- Ensure you've run `npm run db:migrate`
- Check that `prisma/ballistics.db` exists

### API Not Loading Data
- Make sure server is running on port 3000
- Check browser console for error messages
- Verify API endpoint: http://localhost:3000/api/ballistics

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm start
```

## 📈 Migration Benefits

### Before (JSON System)
- ❌ CORS issues with file loading
- ❌ No data relationships
- ❌ Manual data duplication
- ❌ Limited to 2 weapons (hardcoded)

### After (Database System)
- ✅ Reliable API-based loading
- ✅ Proper relational data structure
- ✅ Single source of truth
- ✅ All 5 weapons available
- ✅ Easy to add new data
- ✅ Version tracking
- ✅ Performance improvements

## 🎯 Next Steps

1. **Enhanced API**: Add endpoints for creating/updating ballistic data
2. **User Shots**: Store user's saved shots in database
3. **Map Data**: Migrate map spots to database
4. **Analytics**: Track weapon usage statistics
5. **Backup System**: Automated database backups

## 🤝 Contributing

When adding new ballistic data:
1. Update the seed file with new weapons/ammunition
2. Run `npm run db:reset` to rebuild database
3. Test all weapon configurations in the frontend
4. Commit both seed changes and any schema updates

---

**Happy Sniping! 🎯** 