import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const MODEL_URL = './assets/herod-temple/ad30/lod1.glb?v=20260819b';
const EYE_HEIGHT = 1.68;
const MOVE_SPEED = 7;
const COLLISION_RADIUS = 0.55;

const viewport = document.getElementById('viewport');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startExperience');
const statusText = document.getElementById('statusText');
const exitButton = document.getElementById('exitExperience');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x86add4);
scene.fog = new THREE.FogExp2(0xc8b895, 0.0016);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 1800);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = false;
viewport.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xcfe5ff, 0x766044, 2.4));
const sun = new THREE.DirectionalLight(0xfff2d0, 3.3);
sun.position.set(-180, 280, 110);
scene.add(sun);

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(camera);
const keys = new Set();
const collisionMeshes = [];
const raycaster = new THREE.Raycaster();
const down = new THREE.Vector3(0,-1,0);
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const desired = new THREE.Vector3();
let modelReady = false;
let bounds = null;

function setStatus(message){ statusText.textContent = message; }
function returnToAtlas(){
  const fallback = './index.html';
  const target = sessionStorage.getItem('bibleAtlas:returnUrl') || fallback;
  window.location.assign(target);
}
exitButton.addEventListener('click', returnToAtlas);

controls.addEventListener('lock', () => {
  startScreen.classList.remove('open');
  document.body.classList.add('locked');
  setStatus('체험 중 · Esc로 시선 조작 해제');
});
controls.addEventListener('unlock', () => {
  document.body.classList.remove('locked');
  if (modelReady) {
    startScreen.classList.add('open');
    startButton.textContent = '체험 계속하기';
    setStatus('일시 정지');
  }
});
startButton.addEventListener('click', () => controls.lock());

addEventListener('keydown', e => {
  if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
    keys.add(e.code); e.preventDefault();
  }
});
addEventListener('keyup', e => keys.delete(e.code));

function floorHeightAt(position){
  if (!bounds) return null;
  raycaster.set(new THREE.Vector3(position.x, bounds.max.y + 5, position.z), down);
  raycaster.far = bounds.max.y - bounds.min.y + 15;
  const hits = raycaster.intersectObjects(collisionMeshes, false);
  const belowEye = hits.find(hit => hit.point.y <= position.y + EYE_HEIGHT);
  return belowEye ? belowEye.point.y : null;
}

function blocked(origin, direction, distance){
  if (distance <= 0) return false;
  const eye = origin.clone();
  eye.y -= EYE_HEIGHT * 0.42;
  raycaster.set(eye, direction.clone().normalize());
  raycaster.far = distance + COLLISION_RADIUS;
  return raycaster.intersectObjects(collisionMeshes, false).length > 0;
}

function spawnFromModel(model){
  bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const spawn = new THREE.Vector3(
    (bounds.min.x + bounds.max.x) / 2,
    bounds.max.y + EYE_HEIGHT,
    bounds.max.z - size.z * 0.06
  );
  const ground = floorHeightAt(spawn);
  spawn.y = (ground ?? bounds.min.y) + EYE_HEIGHT;
  camera.position.copy(spawn);
  camera.lookAt(new THREE.Vector3(spawn.x, spawn.y, bounds.getCenter(new THREE.Vector3()).z));
}

new GLTFLoader().load(MODEL_URL, gltf => {
  const model = gltf.scene;
  scene.add(model);
  model.traverse(object => {
    if (!object.isMesh) return;
    object.frustumCulled = true;
    collisionMeshes.push(object);
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    mats.forEach(mat => { if (mat) { mat.side = THREE.FrontSide; mat.needsUpdate = true; } });
  });
  spawnFromModel(model);
  modelReady = true;
  startButton.disabled = false;
  startButton.textContent = '체험 시작하기';
  setStatus('모델 준비 완료');
}, progress => {
  if (progress.total) setStatus(`모델 ${Math.round(progress.loaded / progress.total * 100)}%`);
}, error => {
  console.error(error);
  setStatus('모델을 불러오지 못했습니다');
  startButton.textContent = '불러오기 실패';
});

const clock = new THREE.Clock();
function updateMovement(dt){
  if (!controls.isLocked || !modelReady) return;
  camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() < 0.001) return;
  forward.normalize();
  right.crossVectors(forward, camera.up).normalize();
  desired.set(0,0,0);
  if (keys.has('KeyW') || keys.has('ArrowUp')) desired.add(forward);
  if (keys.has('KeyS') || keys.has('ArrowDown')) desired.sub(forward);
  if (keys.has('KeyD') || keys.has('ArrowRight')) desired.add(right);
  if (keys.has('KeyA') || keys.has('ArrowLeft')) desired.sub(right);
  if (!desired.lengthSq()) return;
  desired.normalize();
  const distance = MOVE_SPEED * Math.min(dt, 0.05);
  if (!blocked(camera.position, desired, distance)) camera.position.addScaledVector(desired, distance);
  const floor = floorHeightAt(camera.position);
  if (floor != null) camera.position.y = THREE.MathUtils.lerp(camera.position.y, floor + EYE_HEIGHT, Math.min(1, dt * 12));
}

function animate(){
  requestAnimationFrame(animate);
  updateMovement(clock.getDelta());
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
