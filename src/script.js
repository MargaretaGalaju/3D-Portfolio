import * as THREE from "three";
import * as dat from "lil-gui";
import gsap from "gsap";

THREE.ColorManagement.enabled = false;

/**
 * Debug
 */
const gui = new dat.GUI();

const parameters = {
  materialColor: "#d68585",
};

/**
 * Base
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Texture
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load("/textures/particles/8.png");

const gradientTexture = textureLoader.load("textures/gradients/3.jpg");
gradientTexture.magFilter = THREE.NearestFilter;
/**
 * Objects
 */
// Material
const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
});

// Meshes
const mesh1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material);
const mesh2 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), material);
const mesh3 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16), material);

scene.add(mesh1, mesh2, mesh3);
const objectsDistance = 4;

mesh1.position.y = -objectsDistance * 0;
mesh2.position.y = -objectsDistance * 1;
mesh3.position.y = -objectsDistance * 2;

mesh1.position.x = 2;
mesh2.position.x = -2;
mesh3.position.x = 2;
const sectionMeshes = [mesh1, mesh2, mesh3];

//Particles
const settings = {
  count: 10000,
};

let particlesMaterial = null;
let particlesGeometry = null;
let points = null;

const drawParticles = () => {
  if (points) {
    particlesMaterial.dispose();
    particlesGeometry.dispose();
    scene.remove(points);
  }
  particlesGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(settings.count * 3);

  for (let i = 0; i <= settings.count; i++) {
    const [x, y, z] = [i * 3, i * 3 + 1, i * 3 + 2];
    positions[x] = (Math.random() - 0.5) * 10;
    positions[y] = objectsDistance * 0.5 - Math.random() * objectsDistance * sectionMeshes.length;
    positions[z] = (Math.random() - 0.5) * 10;
  }

  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  particlesMaterial = new THREE.PointsMaterial({
    color: parameters.materialColor,
    size: 0.1,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  particlesMaterial.alphaMap = particleTexture;
  particlesMaterial.transparent = true;

  points = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(points);
};
drawParticles();

gui.add(settings, "count").min(1000).max(300000).step(1000).onFinishChange(drawParticles);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 1);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

gui.addColor(parameters, "materialColor").onChange(() => {
  material.color.set(parameters.materialColor);
  if (particlesMaterial) {
    particlesMaterial.color.set(parameters.materialColor);
  }
});

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Group
const cameraGroup = new THREE.Group();
scene.add(cameraGroup);

// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 6;
cameraGroup.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Scroll
 */
let scrollY = window.scrollY;
let currentSection = 0

window.addEventListener("scroll", () => {
  scrollY = window.scrollY;

  const newSection = Math.round(scrollY / sizes.height);
	
  if (newSection != currentSection) {
		currentSection = newSection

    gsap.to(sectionMeshes[currentSection].rotation, {
      duration: 1.5,
      ease: "power2.inOut",
      x: "+=6",
      y: "+=3",
    });
  }
});

/**
 * Cursor
 */
const cursor = {};
cursor.x = 0;
cursor.y = 0;

window.addEventListener("mousemove", (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
});
/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  const parallaxX = cursor.x * 0.5;
  const parallaxY = -cursor.y * 0.5;
  camera.position.y = (-scrollY / sizes.height) * objectsDistance;

  cameraGroup.position.x += deltaTime * (parallaxX - cameraGroup.position.x) * 5;
  cameraGroup.position.y += deltaTime * (parallaxY - cameraGroup.position.y) * 5;

  // Animate meshes
  for (const mesh of sectionMeshes) {
    mesh.rotation.x += deltaTime * 0.1;
    mesh.rotation.y += deltaTime * 0.12;
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();



/**
 * Galaxy
 */
const parametersGalaxy = {};
parametersGalaxy.count = 100000;
parametersGalaxy.size = 0.01;
parametersGalaxy.radius = 5;
parametersGalaxy.branches = 3;
parametersGalaxy.spin = 1;
parametersGalaxy.randomness = 0.7;
parametersGalaxy.randomnessPower = 3;
parametersGalaxy.insideColor = "#ff6030";
parametersGalaxy.outsideColor = "#1b3984";

let geometry = null;
let materialGalaxy = null;
let pointsGalaxy = null;

const generateGalaxy = () => {
  // Remove all from the scene
  if (pointsGalaxy) {
    geometry.dispose();
    materialGalaxy.dispose();
    scene.remove(pointsGalaxy);
  }

  /**
   * Geometry
   */
  geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(parametersGalaxy.count * 3);
  const colors = new Float32Array(parametersGalaxy.count * 3)

  const colorInside = new THREE.Color(parametersGalaxy.insideColor)
  const colorOutside = new THREE.Color(parametersGalaxy.outsideColor)

  for (let i = 0; i <= parametersGalaxy.count; i++) {
    const [x, y, z] = [i * 3, i * 3 + 1, i * 3 + 2];

    // Position
    const radius = Math.random() * parametersGalaxy.radius;
    const spinAngle = radius * parametersGalaxy.spin;
    const angle = ((i % parametersGalaxy.branches) / parametersGalaxy.branches) * Math.PI * 2;
    
    const randomX = Math.pow(Math.random(), parametersGalaxy.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parametersGalaxy.randomness * radius;
    const randomY = Math.pow(Math.random(), parametersGalaxy.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parametersGalaxy.randomness * radius;
    const randomZ = Math.pow(Math.random(), parametersGalaxy.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * parametersGalaxy.randomness * radius;
   
    positions[x] = randomX + Math.cos(angle + spinAngle) * radius;
    positions[z] = randomZ + Math.sin(angle + spinAngle) * radius;
    positions[y] = randomY + 0;

    const mixedColor = colorInside.clone()
    mixedColor.lerp(colorOutside, radius / parametersGalaxy.radius)
    // Color
    colors[x] = mixedColor.r;
    colors[y] = mixedColor.g;
    colors[z] = mixedColor.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  /**
   * Material
   */
  materialGalaxy = new THREE.PointsMaterial({
    size: parametersGalaxy.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
		alphaMap: particleTexture
  });
  particlesMaterial.transparent = true;
  /**
   * Points
   */
  pointsGalaxy = new THREE.Points(geometry, materialGalaxy);
  scene.add(pointsGalaxy);
};

generateGalaxy();

gui.add(parametersGalaxy, "count").min(1000).max(1000000).step(1000).onFinishChange(generateGalaxy);
gui.add(parametersGalaxy, "size").min(0.0001).max(0.1).step(0.0001).onFinishChange(generateGalaxy);
gui.add(parametersGalaxy, "radius").min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy);
gui.add(parametersGalaxy, "branches").min(1).max(10).step(1).onFinishChange(generateGalaxy);
gui.add(parametersGalaxy, "spin").min(-5).max(5).step(0.001).onFinishChange(generateGalaxy);
gui.add(parametersGalaxy, "randomness").min(0).max(2).step(0.001).onFinishChange(generateGalaxy);
gui.add(parametersGalaxy, "randomnessPower").min(1).max(10).step(0.001).onFinishChange(generateGalaxy);
gui.addColor(parametersGalaxy, "insideColor").onFinishChange(generateGalaxy);
gui.addColor(parametersGalaxy, "outsideColor").onFinishChange(generateGalaxy);