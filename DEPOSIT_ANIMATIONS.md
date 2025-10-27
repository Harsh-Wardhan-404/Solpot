# 🎊 Deposit Animation System

## Overview
Classy celebration animations that trigger when users successfully deposit SOL into the pot. Features include particle explosions, ripple effects, success messages, and real-time pot updates.

## Components

### 1. DepositCelebration Component
**Location**: `components/DepositCelebration.tsx`

A full-screen overlay animation that appears on successful deposits.

#### Features:
- **Central Success Message**: Animated card with rotating border
- **Amount Display**: Shows deposited amount in SOL
- **Particle Explosion**: 30 animated particles (coins, zaps, trending arrows)
- **Ripple Effects**: 3 expanding circles for depth
- **Sparkle Icons**: Pulsing sparkles around the message
- **Auto-dismiss**: Closes after 3 seconds

#### Animation Sequence:
1. Fade-in gradient overlay (0-0.3s)
2. Success card scales in with rotation (0.2s)
3. Icon appears with spring animation (0.3s)
4. Text fades up (0.4s)
5. Particles explode outward (0.4-1.9s)
6. Ripples expand and fade (0-1.5s)
7. Sparkles pulse continuously
8. Auto-close after 3 seconds

### 2. Enhanced DepositForm
**Location**: `components/DepositForm.tsx`

#### New Features:
- **Celebration Trigger**: Automatically shows celebration on successful deposit
- **Form Animation**: Subtle scale and opacity change during loading
- **State Management**: Tracks celebration display and amount

#### Animation States:
- **Loading**: Form scales down to 98% and fades to 70% opacity
- **Success**: Celebration overlay appears
- **Error**: Red alert box with shake animation (existing)

### 3. Enhanced PotCard
**Location**: `components/PotCard.tsx`

#### New Features:
- **Pulse Animation**: Card pulses when new deposits detected
- **Trophy Rotation**: Trophy icon spins 360° on deposit
- **Amount Animation**: Deposited amount scales up and changes color
- **Delta Display**: Shows "+X SOL" floating up temporarily
- **Shadow Pulse**: Glowing border effect on updates

#### Animation Triggers:
- Detects changes in `pot.totalDeposited`
- Compares with previous value
- Triggers 1-second pulse sequence

## Animation Specifications

### Celebration Overlay
```
Duration: 3 seconds total
- Overlay fade: 0.3s
- Card entrance: 0.4s (spring)
- Particles: 1.5s (staggered 0-0.2s)
- Ripples: 1.5s (staggered 0-0.9s)
- Auto-close: 3s
```

### PotCard Pulse
```
Duration: 0.5 seconds
- Scale: 1 → 1.03 → 1
- Shadow: normal → bright → normal
- Trophy: 0° → 360°
- Amount: color white → lime → white
- Delta: opacity 0 → 1 → 0, y: -10 → -20
```

### Form Loading
```
Duration: 0.3 seconds
- Scale: 1 → 0.98
- Opacity: 1 → 0.7
```

## Visual Elements

### Particles (30 total)
- **10 Coins** (Coins icon)
- **10 Zaps** (Zap icon)  
- **10 Trending** (TrendingUp icon)
- Random positions (-100 to +100 x/y)
- Explode 3x distance outward
- Fade to opacity 0

### Ripples (3 waves)
- Border: 4px solid lime-400
- Size: 32px → 96px (3x scale)
- Opacity: 0.8 → 0
- Delay: 0s, 0.3s, 0.6s

### Sparkles (3 icons)
- Infinite pulse animation
- Scale: 0 → 1.5 → 1
- Delay: 0.4s, 0.5s, 0.6s

## Color Palette
- **Primary**: `#84cc16` (lime-400)
- **Success**: Lime gradient with 20-30% opacity
- **Text**: White with lime highlights
- **Border**: Lime-400 at various opacities

## User Experience Flow

```
User clicks "Deposit SOL"
    ↓
Form shows loading state (scales down, fades)
    ↓
Transaction submits to blockchain
    ↓
[SUCCESS CASE]
    ↓
Celebration overlay fades in
    ↓
Success message appears with rotation
    ↓
Particles explode outward
    ↓
Ripples expand from center
    ↓
Trophy spins, amount pulses
    ↓
Delta amount floats up (+X SOL)
    ↓
Celebration auto-closes after 3s
    ↓
User sees updated pot with pulse effect

[ERROR CASE]
    ↓
Red error alert appears
    ↓
Form remains available for retry
```

## Performance Optimizations
- Uses Framer Motion for GPU-accelerated animations
- Particle array generated once per celebration
- Auto-cleanup with timers
- Passive scroll listeners
- Conditional rendering (AnimatePresence)

## Customization Options

### Adjust Celebration Duration
```typescript
// In DepositCelebration.tsx
const timer = setTimeout(() => {
  onComplete?.();
}, 3000); // Change this value (milliseconds)
```

### Adjust Particle Count
```typescript
// In DepositCelebration.tsx
const newParticles = Array.from({ length: 30 }, ...); // Change 30
```

### Adjust Pulse Intensity
```typescript
// In PotCard.tsx
scale: shouldPulse ? [1, 1.03, 1] : 1, // Change 1.03 for scale
```

## Browser Compatibility
- Modern browsers with CSS transform support
- Framer Motion library required
- No IE11 support (uses modern ES6+)

## Accessibility
- Non-blocking overlay (pointer-events-none on container)
- Auto-dismisses (no manual close needed)
- Respects reduced motion preferences (via Framer Motion)

## Future Enhancements
- [ ] Sound effects on deposit
- [ ] Confetti library integration
- [ ] Leaderboard position notification
- [ ] Share celebration to social media
- [ ] Custom messages for milestone amounts
- [ ] Multiplayer celebrations (multiple users)
