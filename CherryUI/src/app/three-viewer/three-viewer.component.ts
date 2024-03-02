import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Input,
  OnChanges,
  SimpleChanges,
  HostListener,
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-three-viewer',
  templateUrl: './three-viewer.component.html',
  styleUrls: ['./three-viewer.component.css'],
})
export class ThreeViewerComponent implements AfterViewInit, OnChanges {
  @ViewChild('rendererContainer', { static: true })
  rendererContainer!: ElementRef<HTMLDivElement>;
  @Input() modelUrl?: string;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  isLoading: boolean = false; // Add this line

  constructor() {}

  @HostListener('window:resize')
  onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  ngAfterViewInit(): void {
    this.initThree();
    this.addControls();
    this.animate();
    this.onWindowResize(); // Adjust renderer and camera size immediately
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modelUrl'] && this.modelUrl) {
      this.loadModel(this.modelUrl);
    }
  }

  private initThree(): void {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
  }

  private addControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = false;

    // Touch interactions
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 1.0;
    this.controls.enablePan = true;
    this.controls.panSpeed = 0.8;
    this.controls.enableRotate = true;
    this.controls.rotateSpeed = 0.8;

    // Control limits
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 100;
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.controls.update(); // Required for damping
    this.renderer.render(this.scene, this.camera);
  }

  private loadModel(url: string): void {
    this.clearScene();
    this.isLoading = true; // Start loading

    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        gltf.scene.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            // Standard operation: updating the material
            child.material =
              child.material ||
              new THREE.MeshStandardMaterial({
                color: 0xff0000, // Setting the material color to red
              });
          }
        });

        this.scene.add(gltf.scene);
        this.addDefaultLights();
        this.fitCameraToObject(gltf.scene); // Adjust camera to fit the loaded model
        this.isLoading = false; // Start loading
      },
      undefined, // Implement loading progress here if needed
      (error) => {
        console.error('An error happened while loading the model:', error);
      }
    );
  }

  private clearScene(): void {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
  }

  private addDefaultLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  private fitCameraToObject(object: THREE.Object3D): void {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance =
      maxSize / (2 * Math.atan((Math.PI * this.camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / this.camera.aspect;
    const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.2; // Add a bit of padding

    this.camera.position.copy(center);
    this.camera.position.z += distance;

    this.camera.near = 0.1;
    this.camera.far = distance * 3;
    this.camera.updateProjectionMatrix();

    this.controls.target.copy(center); // Ensure the camera focuses on the object
    this.controls.update();
  }
}
