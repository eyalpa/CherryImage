import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

@Component({
  selector: 'app-three-viewer',
  template: '<div #rendererContainer></div>',
  styleUrls: ['./three-viewer.component.css'],
})
export class ThreeViewerComponent implements AfterViewInit, OnChanges {
  @ViewChild('rendererContainer')
  rendererContainer!: ElementRef<HTMLDivElement>;
  @Input() modelUrl?: string;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationFrameId!: number;

  constructor() {}

  ngAfterViewInit(): void {
    this.initThree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modelUrl'] && changes['modelUrl'].currentValue) {
      this.loadModel(changes['modelUrl'].currentValue);
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
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // Basic lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    // Basic camera setup
    this.camera.position.z = 5;

    this.animate();
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    // Add any animations here
    this.renderer.render(this.scene, this.camera);
  }

  private loadModel(url: string): void {
    // Cancel any previous animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Clear the current scene
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        this.scene.add(gltf.scene);
        // Re-animate the scene after loading the model
        this.animate();
      },
      undefined,
      (error) => {
        console.error('An error happened', error);
      }
    );
  }

  ngOnDestroy(): void {
    // Cleanup
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.renderer) {
      this.rendererContainer.nativeElement.removeChild(
        this.renderer.domElement
      );
    }
  }
}
