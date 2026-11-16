# Component contracts

Existing GSAP owns the hero sequence and release story. Keep its matchMedia/revert lifecycle. Do not add Motion as a second engine to this surface.

| Module | Contract |
| --- | --- |
| `components/product-card.tsx` | Reuse the exported component and existing data model. Keep responsive rules, semantic controls and reduced-motion behavior. |
| `components/product-explorer.tsx` | Reuse the exported component and existing data model. Keep responsive rules, semantic controls and reduced-motion behavior. |
| `components/home-motion.tsx` | Reuse the exported component and existing data model. Keep responsive rules, semantic controls and reduced-motion behavior. |

Documented code remains the authority until a product-specific Figma component is mapped and rendered parity is reviewed. Test long labels, a 320px viewport, keyboard focus, empty/error states relevant to the route and the real primary action. Charts need textual/table equivalents; decorative layers stay out of the accessibility tree.
