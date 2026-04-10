# Design System Strategy: The Architectural Curator

## 1. Overview & Creative North Star
The North Star for this design system is **"The Architectural Curator."** 

In the saturated world of real estate and community portals, we move away from the cluttered "listing grid" and toward a high-end editorial experience. This system treats every property and neighborhood story as a curated exhibit. We achieve this by rejecting the standard "bootstrap" look in favor of expansive whitespace, intentional asymmetry, and a depth model based on light and layering rather than lines and boxes. 

The goal is to evoke the feeling of a modern architectural firm: professional, authoritative, yet incredibly airy. We don't just show homes; we frame lifestyles.

---

## 2. Colors & Tonal Depth
Our palette is anchored by a sophisticated Blue, but its power lies in the neutral "Surface" ecosystem that surrounds it.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. Boundaries must be defined solely through background color shifts. 
*   Use `surface-container-low` to sit on a `surface` background.
*   The transition between these two tones is the "line." This creates a seamless, high-end feel that mimics natural light hitting different architectural planes.

### Surface Hierarchy & Nesting
Treat the UI as a physical environment. We use the Material surface tiers to create "nested" depth:
*   **Base Layer:** `surface` (#f9f9ff) – The expansive canvas.
*   **Secondary Zones:** `surface-container-low` (#f2f3fd) – For sidebar navigation or background sectioning.
*   **Interactive Containers:** `surface-container-lowest` (#ffffff) – For cards and active content modules to "lift" them off the page.

### The "Glass & Gradient" Rule
To escape the "flat web" trap:
*   **CTAs & Heroes:** Use subtle linear gradients transitioning from `primary` (#0058be) to `primary_container` (#2170e4). This adds a "soul" and depth to buttons that flat hex codes cannot achieve.
*   **Floating Navigation:** For top headers or floating action panels, use a semi-transparent `surface` color with a `backdrop-blur` (12px to 20px). This allows property imagery to bleed through softly, maintaining a sense of place.

---

## 3. Typography: The Editorial Voice
We utilize **Manrope** exclusively. Its geometric yet warm construction provides the "modern professional" tone required for real estate.

*   **Display (Large Scale):** Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em). These are for "Hero" moments—neighborhood names or primary value propositions.
*   **Headlines:** `headline-lg` (2rem) should be used for section titles. Give them significant padding-top to let the content breathe.
*   **Body & Utility:** `body-lg` (1rem) is our standard for readability. For metadata (square footage, price per sqft), use `label-md` with `on_surface_variant` (#424754) to create a clear visual hierarchy.
*   **Editorial Spacing:** Never crowd text. If a paragraph is longer than 3 lines, increase the line-height to 1.6 to maintain the "Airy" brand promise.

---

## 4. Elevation & Depth
In this design system, shadows are an extension of light, not a tool for separation.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` card placed on a `surface-container-low` section creates a soft, natural lift.
*   **Ambient Shadows:** When an element must "float" (e.g., a property filter modal), use a shadow with a blur of 40px and an opacity of 4%–8%. The shadow color must be a tinted version of `on_surface`, never pure black.
*   **The "Ghost Border" Fallback:** If a container absolutely requires a boundary for accessibility, use the `outline_variant` token at **15% opacity**. This creates a "suggestion" of a border that disappears into the background.
*   **Intentional Asymmetry:** Break the grid. Allow a high-resolution property image to overlap two different surface containers to create a sense of movement and professional art direction.

---

## 5. Components

### Cards (The "Gallery" Module)
*   **Rule:** Forbid the use of divider lines within cards.
*   **Structure:** Use vertical whitespace (the Spacing Scale) to separate the image, the title, and the price. 
*   **Interaction:** On hover, do not use a border; instead, transition the background from `surface-container-lowest` to `surface-bright`.

### Buttons
*   **Primary:** A gradient from `primary` to `primary_container`. Roundedness: `md` (0.75rem).
*   **Secondary:** No background. Use a `Ghost Border` and `primary` text.
*   **Tertiary:** Text only with a `primary` color, used for low-emphasis actions like "View More Details."

### Navigation (The "Architectural Sidebar")
*   Use a wide-screen layout. The sidebar should use `surface-container-low`.
*   Active states should be indicated by a `primary` vertical "pill" (rounded-full) that sits 4px away from the edge, rather than a background fill that spans the whole width.

### Input Fields
*   **Style:** Minimalist. No heavy borders. Use `surface-container-highest` as a subtle background fill. 
*   **Focus:** On focus, transition the background to `surface` and apply a 1px `primary` ghost border (20% opacity).

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace the Void:** Use more whitespace than you think is necessary. This communicates "Luxury" and "Trust."
*   **Layer Surfaces:** Use `surface-container` tiers to guide the eye from the general (background) to the specific (content card).
*   **Use Large Imagery:** Properties should be framed like art—large, high-quality, and often breaking the container grid.

### Don’t:
*   **Don't use 1px solid dividers:** This is the quickest way to make the design look like a template. Use tonal shifts instead.
*   **Don't use high-contrast shadows:** Avoid "dirty" grey shadows. Keep them light, airy, and tinted.
*   **Don't crowd the sidebar:** Keep navigation links sparse. Group them logically with `label-sm` headers in `on_surface_variant`.
*   **Don't use standard blue (#3B82F6) at 100% saturation for everything:** Reserve the vibrant primary for CTAs; use the deeper `primary` and `secondary` tones for structural elements.