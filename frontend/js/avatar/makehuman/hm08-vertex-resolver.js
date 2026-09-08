"use strict";

import * as THREE from "three";

export const HM08_VISIBLE_VERTICES = 13380;

function quantize(value) {
  return Math.round(value * 100000);
}

function vertexKey(x, y, z) {
  return `${quantize(x)}|${quantize(y)}|${quantize(z)}`;
}

function spatialKey(ix, iy, iz) {
  return `${ix}|${iy}|${iz}`;
}

function finiteVec3(v) {
  return (
    Number.isFinite(v?.x) &&
    Number.isFinite(v?.y) &&
    Number.isFinite(v?.z)
  );
}

/*
  HM08VertexResolver V15.2

  The visible Body GLB exposes the 13,380 visible HM08 vertices.
  Original MakeHuman proxies can also reference HM08 helper/cage vertices
  beyond index 13,379.

  This module is a source adapter for HM08 itself:
  - visible HM08 -> exact GLB Body mapping;
  - helper HM08 -> generic local deformation reconstruction.

  It never receives or checks an asset id.
*/
export class HM08VertexResolver {
  constructor(body, basePositions, options = {}) {
    if (!body?.isSkinnedMesh) {
      throw new Error("HM08VertexResolver richiede Body SkinnedMesh.");
    }

    if (!Array.isArray(basePositions) || basePositions.length < HM08_VISIBLE_VERTICES) {
      throw new Error("HM08 base positions incomplete.");
    }

    this.body = body;
    this.basePositions = basePositions;

    this.visibleCount = Math.min(
      HM08_VISIBLE_VERTICES,
      basePositions.length
    );

    this.totalCount = basePositions.length;

    this.neighborCount = options.neighborCount ?? 6;
    this.cellSize = options.cellSize ?? 0.08;
    this.maxGridRadius = options.maxGridRadius ?? 8;

    this.directMap = new Int32Array(this.visibleCount);
    this.directMap.fill(-1);

    this.restPositions = new Array(this.totalCount);
    this.helperModels = new Map();
    this.currentHelperCache = new Map();

    this.stats = {
      mappedVisible: 0,
      visibleCount: this.visibleCount,
      totalBaseVertices: this.totalCount,
      helperPrepared: 0,
      helperBlend: 0,
      helperResolvedThisUpdate: 0,
      invalidIndices: []
    };

    this._tmp = new THREE.Vector3();

    this._buildRestSpace();
    this._buildVisibleMap();
    this._buildSpatialIndex();
  }

  _buildRestSpace() {
    const bodyPosition = this.body.geometry?.attributes?.position;

    if (!bodyPosition) {
      throw new Error("Body priva di geometry.position.");
    }

    let sourceMinY = +Infinity;

    for (let i = 0; i < this.visibleCount; i++) {
      sourceMinY = Math.min(
        sourceMinY,
        this.basePositions[i][1] * 0.1
      );
    }

    let bodyMinY = +Infinity;

    for (let i = 0; i < bodyPosition.count; i++) {
      bodyMinY = Math.min(
        bodyMinY,
        bodyPosition.getY(i)
      );
    }

    this.sourceMinY = sourceMinY;
    this.bodyMinY = bodyMinY;

    for (let i = 0; i < this.totalCount; i++) {
      const p = this.basePositions[i];

      this.restPositions[i] = new THREE.Vector3(
        p[0] * 0.1,
        p[1] * 0.1 - sourceMinY + bodyMinY,
        p[2] * 0.1
      );
    }
  }

  _buildVisibleMap() {
    const bodyPosition = this.body.geometry.attributes.position;
    const lookup = new Map();

    for (let i = 0; i < bodyPosition.count; i++) {
      const key = vertexKey(
        bodyPosition.getX(i),
        bodyPosition.getY(i) - this.bodyMinY,
        bodyPosition.getZ(i)
      );

      if (!lookup.has(key)) {
        lookup.set(key, i);
      }
    }

    let mapped = 0;

    for (let i = 0; i < this.visibleCount; i++) {
      const source = this.basePositions[i];

      const key = vertexKey(
        source[0] * 0.1,
        source[1] * 0.1 - this.sourceMinY,
        source[2] * 0.1
      );

      const bodyIndex = lookup.get(key);

      if (bodyIndex !== undefined) {
        this.directMap[i] = bodyIndex;
        mapped++;
      }
    }

    this.stats.mappedVisible = mapped;

    if (mapped < 12000) {
      throw new Error(
        `Mapping HM08 insufficiente: ${mapped}/${this.visibleCount}`
      );
    }
  }

  _cellForPoint(point) {
    return [
      Math.floor(point.x / this.cellSize),
      Math.floor(point.y / this.cellSize),
      Math.floor(point.z / this.cellSize)
    ];
  }

  _buildSpatialIndex() {
    this.grid = new Map();

    for (let i = 0; i < this.visibleCount; i++) {
      if (this.directMap[i] < 0) continue;

      const p = this.restPositions[i];
      const [ix, iy, iz] = this._cellForPoint(p);
      const key = spatialKey(ix, iy, iz);

      let bucket = this.grid.get(key);

      if (!bucket) {
        bucket = [];
        this.grid.set(key, bucket);
      }

      bucket.push(i);
    }
  }

  _nearestVisibleIndices(point, count = this.neighborCount) {
    const [cx, cy, cz] = this._cellForPoint(point);
    const candidates = new Set();

    let firstEnoughRadius = -1;

    for (let radius = 0; radius <= this.maxGridRadius; radius++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        for (let y = cy - radius; y <= cy + radius; y++) {
          for (let z = cz - radius; z <= cz + radius; z++) {
            const bucket = this.grid.get(
              spatialKey(x, y, z)
            );

            if (!bucket) continue;

            for (const index of bucket) {
              candidates.add(index);
            }
          }
        }
      }

      if (candidates.size >= count) {
        firstEnoughRadius = radius;
        break;
      }
    }

    // One extra ring reduces grid-boundary artifacts.
    if (
      firstEnoughRadius >= 0 &&
      firstEnoughRadius < this.maxGridRadius
    ) {
      const radius = firstEnoughRadius + 1;

      for (let x = cx - radius; x <= cx + radius; x++) {
        for (let y = cy - radius; y <= cy + radius; y++) {
          for (let z = cz - radius; z <= cz + radius; z++) {
            const bucket = this.grid.get(
              spatialKey(x, y, z)
            );

            if (!bucket) continue;

            for (const index of bucket) {
              candidates.add(index);
            }
          }
        }
      }
    }

    // Rare remote helper: exact brute-force fallback.
    if (candidates.size < count) {
      for (let i = 0; i < this.visibleCount; i++) {
        if (this.directMap[i] >= 0) {
          candidates.add(i);
        }
      }
    }

    return [...candidates]
      .map(index => ({
        index,
        d2: this.restPositions[index]
          .distanceToSquared(point)
      }))
      .sort((a, b) => a.d2 - b.d2)
      .slice(0, count)
      .map(item => item.index);
  }

  _buildHelperModel(index) {
    const helperRest = this.restPositions[index];

    if (!helperRest) return null;

    const neighbors = this._nearestVisibleIndices(
      helperRest,
      this.neighborCount
    );

    if (!neighbors.length) {
      return null;
    }

    /*
      Stable HM08 helper field.

      IMPORTANT:
      We do NOT express an out-of-body helper as an unrestricted affine
      combination of Body vertices. That can extrapolate strongly when a macro
      morph such as male/female changes the body and creates "exploding" helper
      positions.

      Instead:
        helperCurrent =
          helperRest + Σ(weight_i * (bodyCurrent_i - bodyRest_i))

      Properties:
      - neutral pose is exact by construction;
      - weights are positive and normalized;
      - no coefficient can amplify a morph;
      - local body deformation still propagates smoothly to helper/cage refs;
      - works at source level for every HM08 proxy, with no hairstyle id.
    */
    const weights = [];
    let total = 0;

    for (const visibleIndex of neighbors) {
      const d2 = Math.max(
        this.restPositions[visibleIndex]
          .distanceToSquared(helperRest),
        1e-8
      );

      const weight = 1 / d2;

      weights.push({
        visibleIndex,
        weight
      });

      total += weight;
    }

    if (!total) return null;

    for (const item of weights) {
      item.weight /= total;
    }

    this.stats.helperBlend++;

    return {
      index,
      method: "blend",
      helperRest: helperRest.clone(),
      weights
    };
  }

  prepare(indices) {
    const invalid = [];

    for (const index of new Set(indices)) {
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= this.totalCount
      ) {
        invalid.push(index);
        continue;
      }

      if (index < this.visibleCount) {
        if (this.directMap[index] < 0) {
          invalid.push(index);
        }

        continue;
      }

      if (!this.helperModels.has(index)) {
        const model = this._buildHelperModel(index);

        if (!model) {
          invalid.push(index);
        } else {
          this.helperModels.set(index, model);
          this.stats.helperPrepared++;
        }
      }
    }

    this.stats.invalidIndices = invalid;
    return invalid;
  }

  beginUpdate() {
    this.currentHelperCache.clear();
    this.stats.helperResolvedThisUpdate = 0;
  }

  _currentVisible(index, target) {
    if (
      index < 0 ||
      index >= this.visibleCount
    ) {
      return false;
    }

    const bodyIndex = this.directMap[index];

    if (bodyIndex < 0) {
      return false;
    }

    this.body.getVertexPosition(
      bodyIndex,
      target
    );

    return finiteVec3(target);
  }

  _currentHelper(index, target) {
    const cached = this.currentHelperCache.get(index);

    if (cached) {
      target.copy(cached);
      return true;
    }

    const model = this.helperModels.get(index);

    if (!model) return false;

    const out = new THREE.Vector3();
    const current = new THREE.Vector3();

    out.copy(model.helperRest);

    for (const item of model.weights) {
      if (
        !this._currentVisible(
          item.visibleIndex,
          current
        )
      ) {
        return false;
      }

      const rest =
        this.restPositions[item.visibleIndex];

      this._tmp.copy(current).sub(rest);

      out.addScaledVector(
        this._tmp,
        item.weight
      );
    }

    if (!finiteVec3(out)) {
      return false;
    }

    this.currentHelperCache.set(
      index,
      out.clone()
    );

    this.stats.helperResolvedThisUpdate++;

    target.copy(out);
    return true;
  }

  getCurrentVertex(index, target) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.totalCount
    ) {
      return false;
    }

    if (index < this.visibleCount) {
      return this._currentVisible(
        index,
        target
      );
    }

    return this._currentHelper(
      index,
      target
    );
  }

  getDiagnostics() {
    return {
      mappedVisible: this.stats.mappedVisible,
      visibleCount: this.visibleCount,
      totalBaseVertices: this.totalCount,
      helperPrepared: this.stats.helperPrepared,
      helperBlend: this.stats.helperBlend,
      helperResolvedThisUpdate:
        this.stats.helperResolvedThisUpdate,
      invalidIndices:
        [...this.stats.invalidIndices]
    };
  }
}
