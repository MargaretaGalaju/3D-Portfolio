import * as THREE from 'three';
import gsap from 'gsap';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

THREE.ColorManagement.enabled = false;

const manager = new THREE.LoadingManager();
const objLoader = new OBJLoader(manager);
const fbxLoader = new FBXLoader(manager);

let mesh1;
let mesh2;
let mesh3;

let sectionMeshes = [];
let objectsDistance = 4;
let flyingStar;

let starPositions = [
  new THREE.Vector3(-3, -0, 0),
  new THREE.Vector3(3, -4, 0),
  new THREE.Vector3(-3, -8, 0),
];


// Create the particle system
let particleCount;
let particles;
let particlePositions;
let particleMaterial;
let particleSystem;


let scrollY = window.scrollY;
let currentSection = 0;

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Texture
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load('/textures/particles/8.png');

const gradientTexture = textureLoader.load('textures/gradients/3.jpg');
gradientTexture.magFilter = THREE.NearestFilter;

const parameters = {
  materialColor: '#d68585',
};

const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
});

objLoader.load(
  '/saturn.obj',
  function (object) {
    object.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });
    // Meshes
    object.scale.set(0.04, 0.04, 0.04)
    mesh1 = object;
  },
);

fbxLoader.load(
  '/rocket.fbx',
  function (object) {

    object.traverse(function (child) {
      if (child instanceof THREE.PointLight) {
        child.visible = false
      }

      if (child instanceof THREE.Mesh) {
        child.material = material;
        child.geometry.center();
      }
    });

    object.scale.set(0.005, 0.005, 0.005)

    mesh2 = object;
  },
);

fbxLoader.load(
  '/star.fbx',
  function (object) {
    object.traverse(function (child) {
      if (child instanceof THREE.PointLight) {
        child.visible = false
      }

      if (child instanceof THREE.Mesh) {
        child.material = material;

        if (child.name === 'Plane') {
          child.visible = false
        }
      }
    });

    flyingStar = object.clone()

    flyingStar.scale.set(0.002, 0.002, 0.002)

    scene.add(flyingStar)
    flyingStar.position.set(starPositions[0].x, starPositions[0].y, starPositions[0].z);

    // Create the particle system
    particleCount = 40;
    particles = new THREE.BufferGeometry();
    particlePositions = new Float32Array(particleCount * 3); // Each particle has an x, y, z position

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = flyingStar.position.x * 10;
      particlePositions[i * 3 + 1] = flyingStar.position.y * 10;
      particlePositions[i * 3 + 2] = flyingStar.position.z * 10;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    particleMaterial = new THREE.PointsMaterial({
      color: parameters.materialColor,
      size: 0.2,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    particleMaterial.alphaMap = particleTexture;
    particleMaterial.transparent = true;


    particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
  },
);

manager.onLoad = function () {
  mesh3 = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16), material);

  scene.add(mesh1, mesh2, mesh3);

  const targetPosition = new THREE.Vector3(0, .5, 0);
  mesh1.lookAt(targetPosition);

  mesh1.position.y = -objectsDistance * 0;
  mesh2.position.y = -objectsDistance * 1;
  mesh3.position.y = -objectsDistance * 2;

  mesh1.position.x = 2;
  mesh2.position.x = -2;
  mesh3.position.x = 2;
  sectionMeshes = [mesh1, mesh2, mesh3];
};


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
    // sectionMeshes.length = 3
    positions[y] = objectsDistance * 0.5 - Math.random() * objectsDistance * 3;
    positions[z] = (Math.random() - 0.5) * 10;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

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

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 1);
directionalLight.position.set(1, 1, 0);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};


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


function updateParticlePositions() {
  if (!particleSystem) {
    return;
  }

  const positions = particleSystem.geometry.attributes.position.array;

  for (let i = particleCount - 1; i > 0; i--) {
    positions[i * 3] = positions[(i - 1) * 3];
    positions[i * 3 + 1] = positions[(i - 1) * 3 + 1];
    positions[i * 3 + 2] = positions[(i - 1) * 3 + 2];
  }

  positions[0] = flyingStar.position.x;
  positions[1] = flyingStar.position.y;
  positions[2] = flyingStar.position.z;

  particleSystem.geometry.attributes.position.needsUpdate = true;
}


function animateStarTo(position) {
  gsap.to(flyingStar.position, {
    duration: 1,
    x: position.x,
    y: position.y,
    z: position.z,
    onUpdate: updateParticlePositions,
    onComplete: updateParticlePositions, // Ensure particles are updated at the end of the animation
  });
}


/**
 * Cursor
 */
const cursor = {};
cursor.x = 0;
cursor.y = 0;

window.addEventListener('mousemove', (event) => {
  cursor.x = event.clientX / sizes.width - 0.5;
  cursor.y = event.clientY / sizes.height - 0.5;
});

const clock = new THREE.Clock();
let previousTime = 0;


const tick = () => {
  updateParticlePositions();

  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  const parallaxX = cursor.x * 0.5;
  const parallaxY = -cursor.y * 0.5;
  camera.position.y = (-scrollY / sizes.height) * objectsDistance;

  cameraGroup.position.x += deltaTime * (parallaxX - cameraGroup.position.x) * 5;
  cameraGroup.position.y += deltaTime * (parallaxY - cameraGroup.position.y) * 5;

  if (sectionMeshes?.length) {
    for (const mesh of sectionMeshes) {
      mesh.rotation.x += deltaTime * 0.1;
      mesh.rotation.y += deltaTime * 0.12;
      mesh.rotation.z += deltaTime * 0.12;
    }
  }

  renderer.render(scene, camera);
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
parametersGalaxy.insideColor = '#ff6030';
parametersGalaxy.outsideColor = '#1b3984';

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

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
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


window.addEventListener('scroll', () => {
  scrollY = window.scrollY;

  const newSection = Math.round(scrollY / sizes.height);

  if (newSection != currentSection) {
    currentSection = newSection
    animateStarTo(starPositions[currentSection]);

    gsap.to(sectionMeshes[currentSection].rotation, {
      duration: 1.5,
      ease: 'power2.inOut',
      x: '+=6',
      y: '+=3',
    });
  }
});


window.addEventListener('resize', () => {
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

document.getElementById('aboutMe').onclick = function () {
  const link = document.createElement('a');

  link.href = 'assets/CV.pdf';
  link.download = 'Margareta-Galaju.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('CV successfully downloaded!');

};

document.getElementById('contactMe').onclick = function () {
  const win = window.open('https://www.linkedin.com/in/margareta-galaju/', '_blank');
  win.focus();
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(function () {
    document.body.removeChild(toast);
  }, 3000);
}