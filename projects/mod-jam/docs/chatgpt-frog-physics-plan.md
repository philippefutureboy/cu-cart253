Love it. Let’s rebuild in crisp, testable slices. Here’s a step-by-step plan with clear deliverables (“Done when…”) so we can iterate without chaos.

# Phase 0 — Baseline & scaffolding (you already have this)

**Goal:** Empty canvas + base classes.

* ✅ You already have `PhysicsObjectModel`, `PhysicsObjectView`, and a blank `draw()`.

---

# Phase 1 — Render a static frog with a mouth anchor

**Goal:** See a single frog body that shows its COM, heading, and a “mouth” attachment point.

**Tasks**

1. Add `FrogBodyModel` (extends `PhysicsObjectModel`) with `mass`, `radius`, and `inertia`.
2. Add `FrogBodyView` to draw a circle (the body), a heading line, and a small dot for the mouth.
3. In `setup()`, instantiate `frogBody`.
4. In `draw()`, render it.

**Done when**

* Frog drawn at center.
* A small dot (mouth) appears offset from the body center and rotates with the frog.

---

# Phase 2 — Fixed-step physics loop (deterministic integration)

**Goal:** Stable physics stepping we can trust.

**Tasks**

1. Add a fixed Δt loop inside `draw()` (e.g., 60Hz). Clamp large frame gaps.
2. Implement tiny helpers:

   * `clearForces(o)`
   * `addForce(o, fx, fy)`
   * `integrateSemiImplicit(o, dt)` (does nothing if `invMass == 0`)

**Done when**

* You can add `addForce(frogBody, 10, 0)` and see frog drift right at a stable rate.
* No “multi-ghost” artifacts (that happens when drawing multiple times per frame without clearing or moving state correctly).

---

# Phase 3 — Mouth kinematics (anchor pose & velocity)

**Goal:** Compute the mouth’s world position and velocity from the frog’s rigid body.

**Tasks**

1. Store `mouthLocal = {x, y}` (offset from frog COM).
2. Compute mouth world pose each step:

   * `mouthWorld = frog.pos + R(θ) * mouthLocal`
   * `v_mouth = V_com + ω × r_anchor` (2D: `ω×(x,y) = (-ω y, ω x)`)
3. Draw a small yellow point at `mouthWorld` every frame.

**Done when**

* As you change `frogBody.angle` or `angularVelocity`, the mouth dot spins correctly around the frog.

---

# Phase 4 — Tongue data model (no physics yet)

**Goal:** Visualize a straight polyline tongue attached to the mouth.

**Tasks**

1. Create `FrogTongueModel` with an array `nodes: PhysicsObjectModel[]`.

   * Node 0 = anchor (mass 0 → kinematic).
   * Nodes 1…N-2 = light segments.
   * Node N-1 = heavy tip.
   * Lay them along the frog’s facing direction with fixed spacing.
2. Create `FrogTongueView` to draw line segments between nodes and a small rectangle at the tip.

**Done when**

* A straight “rope” is rendered, starting at the mouth dot.
* Moving/rotating the frog moves the whole rope because node 0 position is explicitly set to the mouth position each frame.

---

# Phase 5 — Edge springs + axial damping

**Goal:** Make the tongue behave like a rope (stretchy), still straight if undisturbed.

**Tasks**

1. Implement `applyEdgeSpring(ni, nj, restLength, k, c)`:

   * Hooke: `F = k(ℓ − L) ê`
   * Dashpot: `F = c ((v_j − v_i)·ê) ê`
   * Apply equal and opposite to `ni`, `nj`.
2. In a `stepTongue(tongue, mouthWorld, mouthVel, dt)`:

   * `clearForces` all nodes.
   * Add gravity to free nodes (or start with zero gravity).
   * Apply edge springs for all edges.
   * **Integrate only free nodes** with semi-implicit Euler.
   * **Pin** node 0 to `mouthWorld` and set `xv,yv = mouthVel`.

**Done when**

* Tongue sags slightly under gravity (if enabled), stretches under motion.
* No explosions/jitter when the frog is still.

---

# Phase 6 — Anchor reaction (tongue → frog momentum)

**Goal:** The tongue “pushes back” and rotates/translates the frog naturally.

**Tasks**

1. After computing forces, **record the net force at node 0** before pinning:

   * `reaction = {fx: node0.fx, fy: node0.fy}`
2. Apply equal and opposite to the frog:

   * Linear: `frog.fx += -reaction.fx`, `frog.fy += -reaction.fy`
   * Torque: `frog.torque += cross(r_anchor, -reaction)` where `r_anchor = R(θ) mouthLocal`
3. Integrate frog:

   * Linear: `V += (frog.fx / M) dt`, `X += V dt`
   * Angular: `ω += (torque / I) dt`, `θ += ω dt`

**Done when**

* Twanging the tongue (e.g., move the frog quick then stop) causes the frog to react—subtle translations/rotations coming from the rope tension.

---

# Phase 7 — Bending resistance (curvature)

**Goal:** Non-straight tongue that bends and smooths out.

**Tasks**

1. Implement `applyBending(n0, n1, n2, k_b, c_b)`:

   * Compute unit tangents `t0, t1`.
   * Signed angle `φ = atan2(t0×t1, t0·t1)`.
   * Approx. angular rate via lateral relative velocities.
   * Apply small lateral forces proportional to `−k_b φ − c_b φ̇` distributed to the three nodes.
2. Add this after edge springs in `stepTongue`.

**Done when**

* During motion, the tongue curves; not a straight line.
* Increasing `BEND_K` makes it “stiffer” (less curvature).

---

# Phase 8 — Stability pass & parameters

**Goal:** Feel good, no blow-ups.

**Tasks**

* Tune constants:

  * `EDGE_K` moderate; raise `EDGE_C` toward critical damping fraction.
  * Start `BEND_K` small; raise until it looks right.
  * `TIP_MASS` 10–20× segment mass for whippy feel.
* Ensure fixed-step loop caps at e.g. 2 substeps per frame.
* Keep gravity small (“space frog”).

**Done when**

* System runs for minutes without numerical drift or artifacts.
* Frog/tongue interaction looks playful, not chaotic.

---

# Phase 9 — Player control & test inputs

**Goal:** Minimal controls to induce motion and test reactions.

**Tasks**

1. Map ←/→ to add small torque to the frog each step.
2. (Optional) Map ↑/↓ to add forward/back thrust at frog COM.
3. Add a debug toggle to draw:

   * Node indices
   * Edge lengths vs rest
   * Anchor reaction vector

**Done when**

* You can “pump” the frog rotation and see the tongue lag/lead realistically.

---

# Phase 10 — Retraction/extension (later)

**Goal:** Make the tongue shoot out and retract.

**Tasks**

1. Animate total tongue length by adjusting per-edge rest length `L` over time.
2. Optionally cap max retraction speed to avoid numeric spikes.

**Done when**

* Holding a key extends the tongue; releasing retracts, with visible dynamics.

---

# Phase 11 — Flies & scoring (later)

**Goal:** Interact with targets.

**Tasks**

1. Spawn flies (simple circles with small mass).
2. On contact with tip, either:

   * Attach with a short spring, or
   * “Absorb” → increase tip mass briefly and award points.
3. Optionally add gentle drag proportional to velocity to keep scenes tidy.

**Done when**

* Catching a fly clearly tugs the frog/tongue and increments score.

---

# Phase 12 — Polish & safety rails

**Goal:** Ship-ready feel.

**Tasks**

* World bounds (soft springs back into view).
* Pause/reset.
* Parameter panel (sliders) for live tuning (edge k/c, bend k/c, masses).

**Done when**

* You can tune the feel in seconds and it’s hard to break.

---

## Interfaces & functions to implement (exact names to keep us aligned)

* **Helpers**

  * `clearForces(obj)`
  * `addForce(obj, fx, fy)`
  * `integrateSemiImplicit(obj, dt)`
  * `applyEdgeSpring(ni, nj, L, k, c)`
  * `applyBending(n0, n1, n2, k_b, c_b)`
  * `cross2(a, b)` (2D scalar), `rot2(theta, v)`

* **Tongue step**

  * `stepTongue(tongueModel, mouthWorld, mouthVel, dt)`
    (returns `reactionAtAnchor` or writes it into the model)

* **Frog step**

  * `computeMouthPose(frogModel) → {pos, vel, rAnchor}`
  * `applyReactionToFrog(frogModel, reaction, rAnchor)`
  * `integrateFrog(frogModel, dt)`

Each phase is small and verifiable. If you want, I can implement **Phase 1–3** in your current file next so you can see the anchor/mouth logic working cleanly before we add rope physics.
