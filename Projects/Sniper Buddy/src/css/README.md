# CSS Organization

The CSS has been reorganized into multiple files for easier editing and maintenance.

## File Structure

### `base.css`
**Purpose**: Fundamental styles and layout
- CSS reset (`*` selector)
- Body styles and background
- Dashboard grid layout
- Scrollbar styles

**Edit this file for**:
- Overall layout changes
- Background modifications
- Grid structure adjustments
- Scrollbar styling

### `header.css`
**Purpose**: Header and footer styles
- Header layout and animations
- Header title and status indicators
- Footer styling
- Header animations (scanHeader, iconGlow, statusBlink)

**Edit this file for**:
- Header appearance
- Footer styling
- Header animations
- Status indicator colors

### `panels.css`
**Purpose**: Panel layout and structure
- Sidebar, main panel, right panel
- Tactical panel styling
- Panel headers and content
- Panel hover effects

**Edit this file for**:
- Panel layouts
- Panel spacing
- Panel header styling
- Panel hover effects

### `forms.css`
**Purpose**: Form elements and inputs
- Weapon selector styling
- Input and select field styles
- Button styles (build button, add shot button)
- Input groups and labels

**Edit this file for**:
- Form field appearance
- Button styling
- Input focus states
- Form layout

### `components.css`
**Purpose**: Individual component styles
- Result display styling
- Chart container
- Reference cards layout and styling
- Component animations

**Edit this file for**:
- Reference card appearance
- Result display styling
- Chart container
- Component animations

### `modal.css`
**Purpose**: Modal window styles
- Build modal layout
- Modal header and content
- Modal close button
- Modal image styling

**Edit this file for**:
- Modal appearance
- Modal animations
- Modal layout changes

## How to Edit

1. **Find the right file**: Use the descriptions above to locate which file contains the styles you want to modify
2. **Make your changes**: Edit the specific CSS file
3. **Test**: Refresh your browser to see the changes
4. **No HTML changes needed**: The HTML file now links to all CSS files automatically

## Tips

- **Colors**: The main color scheme uses `#00d4ff` (cyan) and `#1a1a1a` (dark gray)
- **Fonts**: Uses 'Share Tech Mono' for body text and 'Orbitron' for headers
- **Animations**: Most animations are in `header.css` and `components.css`
- **Layout**: Grid layout is defined in `base.css`
- **Responsive**: The reference cards use CSS Grid with `auto-fit` for responsive behavior

## Quick Reference

- **Change colors**: Look in the specific component file
- **Modify layout**: Check `base.css` for grid, `panels.css` for panel structure
- **Update animations**: Check `header.css` and `components.css`
- **Style forms**: Use `forms.css`
- **Edit cards**: Use `components.css`
- **Modify modals**: Use `modal.css` 