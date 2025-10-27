# Dock Animation Feature

## Overview
The navigation dock now responds to scroll behavior with smooth animations:
- **Scroll Down**: Dock moves to the right side and becomes vertical
- **Scroll Up**: Dock returns to the bottom center position

## Implementation Details

### Scroll Detection
- Tracks scroll direction (up/down)
- Activates animation after scrolling past 100px
- Uses passive event listeners for optimal performance

### Animation States

#### Bottom Position (Initial/Scroll Up)
- Position: Bottom center
- Orientation: Horizontal
- Layout: Row (items side by side)

#### Right Position (Scroll Down)
- Position: Right side, vertically centered
- Orientation: Vertical
- Layout: Column (items stacked)

### Animation Properties
- **Spring Animation**: Smooth, natural movement
- **Stiffness**: 300 (responsive feel)
- **Damping**: 30 (prevents excessive bounce)
- **Mass**: 0.8 (weight of the animation)

### CSS Classes
- `.vertical-dock`: Applied when dock is in vertical mode
- Handles label positioning (left side instead of top)
- Adjusts spacing and padding for vertical layout

## Usage
The animation happens automatically based on scroll position:
1. Start scrolling down on any page
2. After 100px, dock animates to the right side
3. Scroll back up to return dock to bottom

## Browser Compatibility
- Uses modern CSS and JavaScript
- Requires browser support for:
  - CSS transforms
  - Framer Motion library
  - CSS backdrop-filter

## Performance
- Passive scroll listeners (no blocking)
- GPU-accelerated transforms
- Minimal reflows and repaints
