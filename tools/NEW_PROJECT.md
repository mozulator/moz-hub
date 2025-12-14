# New project scaffolding

## Create a project

### Static (HTML/CSS/JS)

```powershell
npm run new -- --name "My Cool App" --template static
```

### Express sub-app (mounted inside hub)

```powershell
npm run new -- --name "My API App" --template express-hub
```

## What this does

- Creates a folder under `Projects/<Name>/`
- Adds a `project.json` so the hub auto-discovers it
- Generates starter files based on the template

## Open it

Start the hub:

```powershell
npm start
```

Then go to:
- `http://localhost:3000/` (hub)
- `http://localhost:3000/p/<slug>/` (your project)


