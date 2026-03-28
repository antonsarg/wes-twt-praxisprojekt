# Design System Document: The Editorial Minimalist

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Curator"**

This design system rejects the "utility-first" clutter of traditional note-taking apps in favor of a high-end editorial experience. We are not building a filing cabinet; we are building a sanctuary for thought. By utilizing intentional asymmetry, expansive white space, and a sophisticated typographic scale, we move beyond "standard" UI into a space that feels curated, premium, and calm.

The system breaks the rigid grid by treating the interface as a series of layered, physical sheets. It prioritizes "negative space as a feature," ensuring that the user’s content is the primary visual driver, framed by a UI that whispers rather than shouts.

---

## 2. Colors & Tonal Depth
We utilize a sophisticated palette of soft neutrals and a deep, authoritative teal (`primary: #004d64`) to create a sense of focused calm.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. Structural boundaries must be defined solely through background shifts.
* **Example:** A sidebar using `surface_container_low` sits against a main editor using `surface`. No vertical line is required; the tonal shift provides all the necessary affordance.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack. Use the container tiers to define depth:
* **Base Layer:** `surface` (#f8f9fa)
* **Secondary Context (Sidebars/Nav):** `surface_container_low` (#f3f4f5)
* **Interactive Elements (Cards):** `surface_container_lowest` (#ffffff) to provide a "lifted" appearance.
* **Emphasis Layers:** Use `surface_container_highest` (#e1e3e4) for inactive states or subtle callouts.

### The "Glass & Gradient" Rule
To add visual "soul," avoid flat teal blocks for large CTAs.
* **Signature Gradients:** For primary actions, transition from `primary` (#004d64) to `primary_container` (#006684).
* **Glassmorphism:** For floating menus or overlays, use `surface_container_lowest` at 80% opacity with a `12px` backdrop-blur. This ensures the UI feels integrated with the content beneath it.

---

## 3. Typography
The system uses a dual-font strategy to balance editorial authority with functional clarity.

* **Display & Headlines (Manrope):** Chosen for its geometric precision and modern elegance. Use `display-lg` (3.5rem) for empty states and `headline-md` (1.75rem) for folder titles. This conveys a "magazine" feel.
* **Body & Labels (Inter):** Chosen for its exceptional legibility at small sizes. All user-generated content and metadata use Inter to ensure maximum focus.

**Typographic Hierarchy Note:**
Always pair a `headline-sm` with a `label-md` for metadata (e.g., date created). The contrast between the bold Manrope and the functional Inter creates a signature, intentional look.

---

## 4. Elevation & Depth
In this system, depth is organic, not artificial.

### The Layering Principle
Avoid shadows for standard layout components. If a Note Card needs to stand out on a `surface_container_low` background, use a `surface_container_lowest` fill. The "lift" comes from the value change, not a drop shadow.

### Ambient Shadows
When a component must float (e.g., a "New Note" FAB), use a custom "Ambient Shadow":
* **Color:** 8% opacity of `on_surface` (#191c1d)
* **Blur:** `32px`
* **Spread:** `-4px`
* This mimics natural light and prevents the "dirty" look of standard grey shadows.

### The "Ghost Border" Fallback
If contrast ratios require a boundary (e.g., search bars), use the **Ghost Border**:
* **Token:** `outline_variant` (#bfc8cd) at **15% opacity**.
* **Rule:** Never use 100% opaque borders.

---

## 5. Components

### The "New Note" Button (Signature Component)
* **Style:** `xl` (1.5rem) rounded corners.
* **Background:** Linear gradient (`primary` to `primary_container`).
* **Elevation:** Ambient Shadow (described above).
* **Placement:** Placed with intentional asymmetry (e.g., bottom-right with a `16` (5.5rem) offset) to break the grid.

### Input Fields
* **Styling:** No background or borders by default. Use a `3px` bottom-weighted transition on focus using the `surface_tint`.
* **Hierarchy:** The Title input uses `headline-lg`. The Note body uses `body-lg`.

### Lists & Note Cards
* **The "No Divider" Rule:** Forbid the use of horizontal lines.
* **Separation:** Use `spacing: 4` (1.4rem) between items. Use `surface_container_low` on hover to indicate interactivity.
* **Radius:** `md` (0.75rem) for card corners.

### Custom Component: The "Focus Scrim"
When a note is opened, the surrounding UI (Sidebar/List) should transition to a `surface_dim` tint at 40% opacity, pushing the editor to the foreground through "Visual Recess" rather than a pop-up modal.

---

## 6. Do’s and Don’ts

### Do:
* **Do** use `spacing: 8` (2.75rem) or higher for outer margins to create a "gallery" feel.
* **Do** use `tertiary` (#6b3a00) for subtle "Warning" or "Reminder" states—it provides a sophisticated warmth compared to harsh reds.
* **Do** lean into `full` (9999px) roundedness for small chips and tags to contrast with `md` rounded cards.

### Don’t:
* **Don’t** use pure black (#000000) for text. Use `on_surface` (#191c1d) to maintain the soft, premium feel.
* **Don’t** use shadows on buttons that are already high-contrast (e.g., teal buttons on white backgrounds). Let the color do the work.
* **Don’t** center-align long-form text. All notes must be left-aligned to maintain the editorial "baseline."
