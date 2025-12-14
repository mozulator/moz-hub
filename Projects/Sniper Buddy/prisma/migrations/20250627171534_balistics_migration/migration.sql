-- CreateTable
CREATE TABLE "weapons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopeMultiplier" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ammunition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weaponId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ammunition_weaponId_fkey" FOREIGN KEY ("weaponId") REFERENCES "weapons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ballistic_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "distance" INTEGER NOT NULL,
    "mils" REAL NOT NULL,
    "ammunitionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ballistic_data_ammunitionId_fkey" FOREIGN KEY ("ammunitionId") REFERENCES "ammunition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "data_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "weapons_key_key" ON "weapons"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ammunition_weaponId_key_key" ON "ammunition"("weaponId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ballistic_data_ammunitionId_distance_key" ON "ballistic_data"("ammunitionId", "distance");
