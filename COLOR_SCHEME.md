# Color Scheme Update: Green & White Theme

## Overview
Phronesis has been updated from a dark purple/blue theme to a fresh, modern green and white color scheme.

## Color Palette

### Primary Colors
- **Primary Green**: `#10b981` (emerald-500)
- **Primary Green Dark**: `#059669` (emerald-600)
- **Primary Green Light**: `#34d399` (emerald-400)
- **Accent Green**: `#22c55e` (green-500)
- **Dark Green**: `#047857` (emerald-700)

### Background Colors
- **White**: `#ffffff`
- **Off-White**: `#f9fafb` (gray-50)
- **Very Light Green**: `#ecfdf5` (emerald-50)
- **Light Green**: `#d1fae5` (emerald-100)

### Text Colors
- **Text Dark**: `#1f2937` (gray-800) - Primary text
- **Text Medium**: `#4b5563` (gray-600) - Secondary text
- **Text Light**: `#6b7280` (gray-500) - Tertiary text

### Border Colors
- **Border Light**: `#e5e7eb` (gray-200)
- **Border Green**: `rgba(16,185,129,0.2-0.6)` - Various opacities

## Changes Made

### 1. Background Gradients
**Before (Dark Purple/Blue)**:
```css
background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 75%, #0f172a 100%)
```

**After (White/Green)**:
```css
background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 25%, #dcfce7 75%, #d1fae5 100%)
```

### 2. Button Gradients
**Before**:
```css
background: linear-gradient(135deg,#3b82f6,#8b5cf6)  /* Blue to Purple */
background: linear-gradient(135deg,#ec4899,#f59e0b)  /* Pink to Orange */
```

**After**:
```css
background: linear-gradient(135deg,#10b981,#059669)  /* Green gradient */
background: linear-gradient(135deg,#f59e0b,#f97316)  /* Orange gradient (kept for quiz mode) */
```

### 3. Card Backgrounds
**Before (Dark)**:
```css
background: rgba(15,23,42,0.6)     /* Dark slate */
background: rgba(0,0,0,0.85)        /* Almost black */
background: rgba(51,65,85,0.6)      /* Medium dark */
```

**After (Light)**:
```css
background: rgba(255,255,255,0.85)  /* White with transparency */
background: rgba(255,255,255,0.95)  /* Nearly opaque white */
background: rgba(255,255,255,0.9)   /* White with backdrop filter */
```

### 4. Border Colors
**Before (Blue)**:
```css
border: 1px solid rgba(96,165,250,0.2)   /* Light blue */
border: 1px solid rgba(96,165,250,0.4)   /* Medium blue */
```

**After (Green)**:
```css
border: 1px solid rgba(16,185,129,0.2)   /* Light green */
border: 1px solid rgba(16,185,129,0.4)   /* Medium green */
```

### 5. Text Colors
**Before (Light on dark)**:
```css
color: #f1f5f9  /* Nearly white */
color: #cbd5e1  /* Light gray */
color: #94a3b8  /* Medium gray */
```

**After (Dark on light)**:
```css
color: #1f2937  /* Dark gray */
color: #4b5563  /* Medium-dark gray */
color: #6b7280  /* Medium gray */
```

### 6. Navigation
**Before**:
- Dark background: `rgba(0,0,0,0.8)`
- Active tab: Blue/purple gradient
- Border: Blue accent

**After**:
- Light background: `rgba(255,255,255,0.95)`
- Active tab: Green gradient
- Border: Green accent
- Added subtle shadow: `box-shadow: 0 2px 8px rgba(0,0,0,0.05)`

### 7. Scrollbar
**Before**:
```css
scrollbar-thumb: rgba(96,165,250,0.5)   /* Blue */
scrollbar-track: rgba(15,23,42,0.3)      /* Dark */
```

**After**:
```css
scrollbar-thumb: rgba(16,185,129,0.5)    /* Green */
scrollbar-track: rgba(209,250,229,0.3)   /* Light green */
```

### 8. Selection Highlight
**Before**:
```css
::selection {
  background: rgba(96,165,250,0.3);  /* Blue */
  color: #f1f5f9;                    /* Light text */
}
```

**After**:
```css
::selection {
  background: rgba(16,185,129,0.2);  /* Green */
  color: #1f2937;                    /* Dark text */
}
```

## Files Modified

1. **`frontend/src/index.css`**
   - Updated root CSS variables
   - Changed body background gradient
   - Updated link colors
   - Modified scrollbar colors
   - Changed selection colors

2. **`frontend/src/App.tsx`**
   - All inline styles updated
   - Navigation colors
   - Card backgrounds
   - Button gradients
   - Text colors
   - Border colors

3. **`frontend/src/VoiceChat.tsx`**
   - Chat interface colors
   - Button gradients
   - Border accents
   - Text colors

## Design Philosophy

The new green and white theme embodies:

1. **Freshness**: Clean white backgrounds with green accents feel modern and educational
2. **Readability**: Dark text on light backgrounds improves readability
3. **Energy**: Green conveys growth, learning, and progress
4. **Professional**: The color scheme is professional yet approachable
5. **Accessibility**: Better contrast ratios for improved accessibility

## CSS Variables

For easier theme customization in the future, CSS variables are defined in `index.css`:

```css
--primary-green: #10b981;
--primary-green-dark: #059669;
--primary-green-light: #34d399;
--accent-green: #22c55e;
--dark-green: #047857;
--light-green: #d1fae5;
--very-light-green: #ecfdf5;
--white: #ffffff;
--off-white: #f9fafb;
--text-dark: #1f2937;
--text-medium: #4b5563;
--text-light: #6b7280;
--border-light: #e5e7eb;
```

## Future Enhancements

Consider:
- Adding a dark mode toggle that switches back to the purple/blue theme
- Creating theme variants (blue, purple, orange, etc.)
- Implementing CSS custom properties throughout all components
- Adding subtle animations on theme changes

