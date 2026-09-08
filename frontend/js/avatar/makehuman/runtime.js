"use strict";

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { BoneOverlay } from "./bone-overlay.js";

export class MakeHumanRuntime {
  constructor(host, options = {}) {
    if (!host) throw new Error("MakeHumanRuntime: host mancante.");

    this.host = host;
    this.options = options;
    this.modelRoot = null;
    this.skeletonHelper = null;
    this.boneOverlay = null;
    this.updateCallbacks = new Set();
    this._destroyed = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.01, 1000);
    this.camera.position.set(0, 1.0, 4.5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";

    host.innerHTML = "";
    host.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 20;
    this.controls.target.set(0, 1, 0);

    this._installLights();

    this._resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => this.resize())
      : null;

    this._resizeObserver?.observe(this.host);
    window.addEventListener("resize", this._onWindowResize = () => this.resize());

    this.renderer.setAnimationLoop((time) => this._render(time));
    this.resize();
  }

  _installLights() {
    const hemi = new THREE.HemisphereLight(0xfff4df, 0x232536, 2.1);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffddb5, 2.6);
    key.position.set(3, 5, 4);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xb6c7ff, 1.15);
    fill.position.set(-4, 3, 2);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0x7f6dff, 1.0);
    rim.position.set(-2, 4, -4);
    this.scene.add(rim);
  }

  attach(root, { ground = true, centerXZ = true } = {}) {
    if (!root) throw new Error("MakeHumanRuntime.attach: root mancante.");
    this.detach();

    this.modelRoot = root;
    this.scene.add(root);
    root.updateMatrixWorld(true);

    const initialBox = new THREE.Box3().setFromObject(root);
    if (!initialBox.isEmpty()) {
      const center = initialBox.getCenter(new THREE.Vector3());

      if (centerXZ) {
        root.position.x -= center.x;
        root.position.z -= center.z;
      }
      if (ground) root.position.y -= initialBox.min.y;

      root.updateMatrixWorld(true);
    }

    this.fitFull();
  }


setSkeletonVisible(enabled = true) {
  if (this.skeletonHelper) {
    this.scene.remove(this.skeletonHelper);
    this.skeletonHelper.geometry?.dispose?.();
    this.skeletonHelper.material?.dispose?.();
    this.skeletonHelper = null;
  }

  if (this.boneOverlay) {
    this.scene.remove(this.boneOverlay.group);
    this.boneOverlay.dispose();
    this.boneOverlay = null;
  }

  if (!enabled || !this.modelRoot) return false;

  this.boneOverlay = new BoneOverlay(this.modelRoot);
  this.scene.add(this.boneOverlay.group);
  return true;
}

  detach() {
    this.setSkeletonVisible(false);
    if (!this.modelRoot) return;
    this.scene.remove(this.modelRoot);
    this.modelRoot = null;
  }

  modelBox() {
    if (!this.modelRoot) return null;
    this.modelRoot.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.modelRoot);
    return box.isEmpty() ? null : box;
  }

  fitFull() {
    const box = this.modelBox();
    if (!box) return;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const fitHeightDistance = size.y / (2 * Math.tan(fov / 2));
    const fitWidthDistance = size.x / (2 * Math.tan(fov / 2) * Math.max(this.camera.aspect, 0.01));
    const distance = Math.max(fitHeightDistance, fitWidthDistance, size.z) * 1.35;

    this.controls.target.set(center.x, center.y, center.z);
    this.camera.position.set(center.x, center.y, center.z + Math.max(distance, 0.8));
    this.camera.near = Math.max(0.001, distance / 1000);
    this.camera.far = Math.max(100, distance * 20);
    this.camera.updateProjectionMatrix();

    this.controls.minDistance = Math.max(0.2, distance * 0.2);
    this.controls.maxDistance = Math.max(4, distance * 3);
    this.controls.update();
  }

  fitFace() {
    const box = this.modelBox();
    if (!box) return;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const target = new THREE.Vector3(center.x, box.max.y - size.y * 0.16, center.z);
    const distance = Math.max(size.y * 0.52, size.x * 1.8, 0.55);

    this.controls.target.copy(target);
    this.camera.position.set(target.x, target.y, target.z + distance);
    this.controls.update();
  }

  resize() {
    if (this._destroyed) return;
    const w = Math.max(20, this.host.clientWidth || 0);
    const h = Math.max(20, this.host.clientHeight || 0);

    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  snapshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL("image/png");
  }

  addUpdateCallback(callback) {
    if (typeof callback !== "function") return () => {};
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  _render(time) {
    if (this._destroyed) return;

    for (const callback of this.updateCallbacks) {
      try {
        callback(time);
      } catch (error) {
        console.error("MakeHumanRuntime update callback:", error);
      }
    }

    this.controls.update();
    this.boneOverlay?.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    this.renderer.setAnimationLoop(null);
    this._resizeObserver?.disconnect();
    window.removeEventListener("resize", this._onWindowResize);
    this.updateCallbacks.clear();
    this.controls.dispose();
    this.detach();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.host) {
      this.host.removeChild(this.renderer.domElement);
    }
  }
}
