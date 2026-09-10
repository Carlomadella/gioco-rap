"use strict";

/*
  V21.2 — facial helper guard

  The phenotype anchors are intentionally installed on Body only.
  Eyes / Teeth / Tongue do not currently receive the six sex×ancestry macro
  anchors, so after a strong phenotype change they can remain at their neutral
  positions and appear as floating spheres/blocks around the face/neck.

  This module does NOT alter phenotype, rig, skin, stature, or hair.

  For the current creator phase we temporarily suppress those three helper
  primitives. They will be re-enabled/rebuilt in the dedicated face/eyes pass,
  where their placement can be handled explicitly.

  Body and hair remain untouched.
*/

export class FacialHelperGuard {
  constructor(adapter) {
    if (!adapter) {
      throw new Error("FacialHelperGuard: adapter mancante.");
    }

    this.adapter = adapter;
    this.contract = adapter.resolveContract({ force: true });

    this.meshes = {
      eyes: this.contract?.meshes?.eyes || null,
      teeth: this.contract?.meshes?.teeth || null,
      tongue: this.contract?.meshes?.tongue || null
    };

    this.originalVisibility = new Map();

    for (const mesh of Object.values(this.meshes)) {
      if (mesh) {
        this.originalVisibility.set(mesh, mesh.visible);
      }
    }

    this.suppressed = false;
  }

  suppress() {
    for (const mesh of Object.values(this.meshes)) {
      if (mesh) mesh.visible = false;
    }

    this.suppressed = true;
    return this.getDiagnostics();
  }

  restore() {
    for (const [mesh, visible] of this.originalVisibility.entries()) {
      mesh.visible = visible;
    }

    this.suppressed = false;
    return this.getDiagnostics();
  }

  getDiagnostics() {
    return {
      suppressed: this.suppressed,
      eyesFound: !!this.meshes.eyes,
      teethFound: !!this.meshes.teeth,
      tongueFound: !!this.meshes.tongue,
      eyesVisible: this.meshes.eyes?.visible ?? null,
      teethVisible: this.meshes.teeth?.visible ?? null,
      tongueVisible: this.meshes.tongue?.visible ?? null
    };
  }
}
