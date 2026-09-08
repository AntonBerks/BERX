# BERX — 5D WEB MASTER VISUAL SPEC

Status: DESIGN AUTHORITATIVE / implementation specification
Canonical world source: `Berx5DFrame`
Primary target: Web
Platforms later consume the same world/runtime contracts; they do not create a second spatial core.

## 0. Non-negotiable visual law

BERX must never visually fall back to generic browser UI, generic SaaS dashboard UI, generic social-network chrome, or decorative pseudo-3D.

Every visible and interactive element belongs to one BERX spatial language.

Canonical brand:
- background: #07080A
- accent: #4FD6E8
- premium dark
- glass only on floating/interactive surfaces
- media and world remain primary; chrome remains subordinate
- no purple as dominant visual language

The visual system is not authoritative over world state. `Berx5DFrame` is authoritative.

## 1. 5D visual model

Five dimensions are represented consistently:

- X/Y/Z = physical/spatial position and depth
- T = temporal context: now, before, after, live transitions
- R = relational context: connection between person/content/place/event/community/business/experience

The UI must express these dimensions without requiring the user to understand the implementation vocabulary.

Spatial hierarchy:
1. primary world subject
2. secondary contextual objects
3. navigation / action affordances
4. informational overlays
5. utility chrome

## 2. Web shell

Default shell:
- full-viewport dark world canvas
- spatial renderer is the visual root
- DOM overlays are semantic controls/context, never a replacement for the world
- safe-area aware
- keyboard accessible
- reduced-motion aware

Desktop composition:
- left: lightweight global navigation rail
- center: world/canvas
- right: contextual detail rail only when context exists
- no permanent dashboard grid

Tablet:
- collapsed navigation rail
- world receives more viewport area
- contextual information becomes adaptive bottom/side surface

Mobile web:
- world remains primary
- bottom navigation is floating spatial chrome, not a conventional full-width tab bar
- contextual cards become sheets with depth continuity

## 3. World occupancy

Primary scene target: 40–60% of useful viewport height/area depending on aspect ratio.

Composition rules:
- one dominant subject per scene
- secondary subjects explain context, not compete with hero
- camera framing derives from object bounds and desired occupancy
- avoid all-important objects clustering around center origin
- avoid empty void larger than semantic purpose
- maintain breathing space around the primary object
- preserve clear focal axis

The 40–60% target is a composition constraint, not a hardcoded camera distance.

## 4. Camera

Camera is semantic, not ornamental.

Required camera concepts:
- position
- target
- field of view
- near/far planes
- travel interpolation
- arrival state
- focus object
- focus reason

Transitions must preserve spatial continuity wherever the relationship is meaningful.

Named transition families:
- flow: adjacent relationship
- fold: section/world shift
- warp: large spatial travel
- teleport: explicit discontinuity
- dissolve: context replacement
- bloom: reveal
- collapse: exit/return
- wormhole: rare high-level world transition

No transition may conceal failed persistence or fabricate success.

## 5. Materials

Material language:
- graphite structural objects
- pearl/ceramic primary objects
- smoked glass contextual surfaces
- cyan emissive accents
- restrained metal highlights

Material states:
- idle
- focusable
- focused
- available
- unavailable
- loading
- success
- failure
- selected
- transient/live

Do not encode status by color alone.

## 6. Lighting

Lighting hierarchy:
1. scene key light
2. environment/radiance
3. soft fill
4. object-specific accent light
5. interaction/emissive response

Accent light is semantic. It must communicate affordance or state, not decorate every object.

## 7. HDR / exposure / post visual contract

Target conceptual order:

world geometry/materials
→ direct/environment light
→ volumetric/in-scatter
→ HDR scene target
→ exposure
→ ACES tone mapping
→ post effects
→ presentation/output

Environment authored appearances/radiance must not be treated as surface albedo.

Target exposure calibration is evidence-driven, approximately 3x for the current measured scene transport; exact value remains derived rather than aesthetic.

Post stack must be modular and feature-verifiable:
- tone mapping
- bloom
- vignette
- optional grain
- optional motion blur
- optional chromatic aberration
- depth of field where scene semantics justify it

Never add effects solely because they are available.

## 8. Spatial action affordances

Actions are spatial objects, not text labels.

Examples:
- Event: framed event object + live time/material state
- Go: directional action object with travel cue
- Save: magnetic/collection affordance
- Message: relational portal
- Join: community gate
- Review: post-experience memory object

Interaction progression:
proximity/focus → visual response → intent → request → confirmed result → world mutation

The world does not mutate on click intent alone.

## 9. Interaction states

Every interactive component must define:
- idle
- hover
- focus-visible
- pressed
- disabled
- loading
- success
- failure
- offline
- permission denied
- unavailable

Keyboard equivalents must exist for every pointer action.

Focus must never disappear into the canvas.

Browser defaults must be explicitly neutralized/replaced where they leak into product behavior:
- buttons
- links
- inputs
- forms
- selects
- dialogs
- context menus
- text selection
- drag behavior
- overscroll
- scrollbars
- focus rings

A custom BERX focus language replaces generic defaults while retaining accessibility semantics.

## 10. Glass language

Glass is selective.

Layers:
- G1: 4% white surface
- G2: 7% white surface
- G3: 10% white surface
- border-soft
- border-strong for focused/critical surfaces

Glass is used for:
- contextual cards
- menus
- sheets
- floating navigation
- action trays
- notifications

Glass is not used to cover the entire screen.

## 11. Typography

Hierarchy:
- micro context: 12–13px
- body: 15px
- prominent context: 17px
- section: 20px
- title: 24px
- hero: 34px+

Typography communicates depth:
- foreground information = full contrast
- contextual information = dimmed
- tertiary metadata = faint

Never depend on tiny text to communicate critical state.

## 12. Iconography

Icons must be one coherent BERX family.

Requirements:
- optical sizing
- consistent stroke/filled grammar
- state-aware glow
- no random Unicode symbols as production icons
- every icon must have semantic label/accessibility name

## 13. Surface grammar

Primary surfaces:
- world object
- floating glass panel
- contextual sheet
- detail rail
- action capsule
- command/voice surface

No conventional card-grid dashboard as the default composition.

Cards exist only when they represent real spatial or relational objects.

## 14. BERX NOW

NOW is a runtime layer, not merely a page.

NOW visual signals:
- temporal intensity
- proximity
- active people
- active places
- live events
- changing availability

T must influence appearance and motion only where supported by real state.

## 15. Feed / social content

Feed items enter spatial context through:
- person
- place
- event
- time
- relation

A post without context is a content object; contextualized content gains spatial anchors.

Media remains large and visually dominant.

## 16. People

People are first-class world entities.

Visual treatment:
- portrait/avatar object
- activity/live halo when factual
- relationship state
- distance/context where permitted
- temporal markers for recent/active states

No fake online indicators.

## 17. Places

A place should visually communicate:
- identity
- physical presence
- distance
- category
- current state
- relevant social context
- action opportunities

The primary place object becomes the camera focal point.

## 18. Events

Event object expresses:
- title
- time
- place
- participant density when factual
- RSVP state
- capacity state if backend confirms it

Temporal state must be canonical.

## 19. Messaging

Messaging exists as relational space.

Conversation entry:
- person-to-person relationship
- unread/live state
- media/context

Message send path:
intent → request → server confirmation → canonical message state → world update.

No pre-confirmed message insertion unless a real reconciliation model exists and preserves failure semantics.

## 20. Search

Search is spatial discovery.

Results should resolve into world objects/relationships rather than a generic result table.

Search states:
- idle
- typing
- suggestions
- loading
- results
- no results
- error
- offline

## 21. Navigation

Primary navigation should answer:
- where am I?
- what is happening now?
- what is nearby?
- what can I do next?

Navigation transitions preserve object identity when moving between contexts.

## 22. Voice OS 5D

Voice has its own semantic channel.

VisualSemanticState:
- what is presently visible
- labels already legible
- values already shown

SpeechSemanticState:
- additional context
- invisible historical context
- future temporal context
- cross-session memory
- state changes not currently rendered

Rule:
Voice must not narrate visible UI verbatim.

Voice commands must resolve into the same action graph as visual interactions.

## 23. Registration / awakening

Registration is a transition from unknown visitor to participant.

Visual sequence:
- quiet dark field
- BERX mark
- spatial emergence
- identity creation
- optional interests/context
- profile creation
- entrance into world

The flow must feel like awakening into a living environment, not a generic form wizard.

Every step remains semantically accessible and keyboard operable.

## 24. Motion system

Motion communicates:
- relationship
- hierarchy
- causality
- temporal change
- spatial travel

Motion timing should remain coherent:
- fast ~150ms
- base ~220ms
- slow ~380ms

Use interruption-safe transitions.

Reduced-motion mode preserves state comprehension and removes nonessential spatial spectacle.

## 25. Responsive strategy

Responsive behavior must preserve spatial intent rather than merely stack desktop components.

At narrower widths:
- reduce secondary objects first
- preserve primary world subject
- convert contextual rails to surfaces/sheets
- keep action affordance visible
- maintain readable depth ordering

## 26. Accessibility

Required:
- keyboard traversal
- visible custom focus
- semantic labels
- screen-reader descriptions for spatial objects
- reduced-motion mode
- high contrast
- large text
- color vision support
- non-color status encoding

Canvas-only information is insufficient; semantic DOM mirrors must expose meaningful accessible descriptions without becoming a second authoritative world.

## 27. Empty/loading/error design

These are intentional spatial states, not placeholders.

Loading:
- show spatial continuity
- preserve last known stable state where valid
- make uncertainty explicit

Empty:
- explain why the world has no object
- provide next action

Error:
- preserve canonical last-known-good state
- show recoverable action
- never fabricate a new world state

Offline:
- show connectivity state
- prohibit unsupported mutations
- queue only actions for which a real conflict model exists

## 28. Success/failure language

Success must have:
- server confirmation
- canonical state update
- visual transition

Failure must have:
- no authoritative world mutation
- explicit recoverable feedback
- preserved prior state

## 29. Performance

Visual richness must be budgeted.

Required architecture targets:
- lazy media
- virtualized lists where appropriate
- texture streaming
- LOD
- frustum/occlusion culling
- instance batching
- minimal layout thrash
- progressive asset loading
- pause nonessential effects when backgrounded

Performance mechanisms must not change the semantic identity of world objects.

## 30. Verification architecture

Every visual capability has two levels:

1. design contract
2. runtime evidence

Examples:
- `hdr`: target format + executed HDR/readback evidence
- `msaa`: real resolve evidence
- `picking`: real selected entity identity evidence
- `world-space text`: actual production renderer evidence
- `bloom`: feature-specific output evidence
- `device loss`: actual recover/recreate lifecycle evidence

No source-presence check may be treated as production proof.

## 31. Production shell rule

The Web app must use the same canonical spatial world contract as future platforms.

Web-specific concerns may include:
- DOM accessibility surface
- keyboard mapping
- pointer/gesture mapping
- WebGPU/WebGL2 renderer selection

They may not create a second authoritative world model.

## 32. Definition of Done — Web MAX 5D

Web is considered visually complete only when:
- primary world occupies intended composition range
- visual hierarchy is stable across responsive widths
- no browser default styling leaks into product behavior
- all interaction states are explicit
- loading/error/empty/offline are designed
- actions resolve through canonical action graph
- world mutations occur after confirmed success
- voice uses separate speech semantics
- renderer is fed by canonical `Berx5DFrame`
- exposure/HDR/post are production-path verified
- accessibility semantics are complete
- performance budgets are respected
- visual capabilities have evidence tied to production path

This document defines design intent. It does not by itself constitute runtime evidence.
