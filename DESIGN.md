# Design System & Guidelines (Impeccable Standards)

## Core Design Philosophy
- **Premium but Usable**: The application aims for a state-of-the-art, "wow" aesthetic. However, usability must not be sacrificed. Avoid "slop" design. 
- **Space over Borders**: Use generous spacing to separate content rather than relying heavily on harsh borders.
- **Purposeful Motion**: Use Framer Motion for meaningful transitions. Avoid dated bouncy/elastic easing. Stick to `easeOut` or `spring` with high stiffness/damping for snappy, responsive interactions.

## Typography
- **Primary Font**: Avoid overused system fonts (Arial, Inter, Roboto). Prescribe a modern, premium geometric sans-serif (e.g., **Outfit**, **Plus Jakarta Sans**, or **Space Grotesk**).
- **Hierarchy**: 
  - Keep headings tight (`tracking-tight`). 
  - Use uppercase with wide letter-spacing (`tracking-widest`) for small labels, kickers, and tags.
- **Contrast**: Avoid gray text on colored backgrounds. Always tint text with the background's hue (e.g., use `text-emerald-900` on an `emerald-100` background, not `text-gray-600`).

## Color Palette
- **Primary Theme**: Deep dark mode with glassmorphism effects.
- **Accents**: 
  - `emerald-400` to `cyan-400` gradients for primary actions, booking flows, and success states.
  - `blue-500` to `purple-500` gradients for secondary or "premium" features (like News or AI Coach).
- **Tinting**: Do NOT use pure `#000000` or `#FFFFFF` for large areas. Use slightly tinted neutrals (e.g., extremely dark blue-gray for the background).

## Components & Layout
- **Glassmorphism Done Right**: Use `backdrop-blur-xl` with highly transparent, tinted backgrounds (`bg-card` or `bg-white/5` in dark mode) and extremely subtle borders (`border-white/10`).
- **Custom Native Inputs**: Avoid ugly default HTML `<select>` elements. Use custom animated dropdown components (`CustomSelect`) with `framer-motion` for smooth list rendering and custom scrollbars.
- **Global Scaling**: The application utilizes a global 80% scale (`html { font-size: 12.8px }`) to transform Tailwind `rem` classes into a highly spacious, enterprise-grade viewport.
- **Touch Targets**: Minimum `44px` for all interactive elements (buttons, inputs) to ensure mobile accessibility.
- **Interactive States**: Every interactive element needs a defined:
  - **Hover**: Subtle scale up (`scale-105`), glow, or background shift.
  - **Active/Tap**: Subtle scale down (`scale-95`).
  - **Disabled**: Dimmed opacity (`opacity-50`) and `cursor-not-allowed`.

## Impeccable Anti-Patterns (Strictly Avoid)
1. **No nested cards**: Don't put a card inside a card inside a card. It creates cognitive overload and bad contrast.
2. **No generic gradients**: Avoid the default "purple-to-blue" SaaS gradients everywhere unless specifically requested for a premium tier. Use brand-aligned greens/cyans.
3. **No bounce easing**: Stop using overly bouncy animations for standard UI elements.
4. **No empty states without action**: Every empty state (e.g., "No courts found") MUST have a clear "next step", illustration, or call to action.
5. **No pure gray**: Never use pure grayscale (`#333`, `#666`). Always inject a slight amount of the primary brand color into your grays to make them feel integrated.
