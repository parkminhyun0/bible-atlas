import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const MODEL_URL = './assets/herod-temple/ad30/lod1.glb?v=20260819b';
const EYE_HEIGHT = 1.68;
const MOVE_SPEED = 7;
const COLLISION_RADIUS = 0.55;
const MAX_STEP_HEIGHT = 0.65; // 계단 자동 승단. 역사 치수가 아닌 보행 파라미터다.
const MAX_AUTO_CLIMB_HEIGHT = 1.05; // 낮은 턱을 자연스럽게 넘는 보행 보조
const GRAVITY = 22;
const JUMP_SPEED = 8.6;
/* openbibleinfo vendor/3d-temple-mount src/40-data.js PLACE_VIEWS.gentiles.
   이방인의 뜰 시작점을 새로 추정하지 않고 검증된 기존 시점을 그대로 쓴다. */
const GENTILES_SPAWN = { position:[186.8, 0, 321.2], lookAt:[104, 26, 227] };

const viewport = document.getElementById('viewport');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startExperience');
const statusText = document.getElementById('statusText');
const exitButton = document.getElementById('exitExperience');
const spawnChoices = [...document.querySelectorAll('.spawnChoice')];
const spawnFieldset = document.getElementById('spawnChoices');

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
let selectedSpawn = 'outside';
let verticalVelocity = 0;
let grounded = false;

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
spawnChoices.forEach(button => button.addEventListener('click', () => {
  selectedSpawn = button.dataset.spawn;
  spawnChoices.forEach(item => item.classList.toggle('active', item === button));
  if (modelReady) applySpawn();
}));

addEventListener('keydown', e => {
  if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
    keys.add(e.code); e.preventDefault();
  }
  if (e.code === 'Space') {
    e.preventDefault();
    if (!e.repeat && controls.isLocked && grounded) {
      verticalVelocity = JUMP_SPEED;
      grounded = false;
    }
  }
});
addEventListener('keyup', e => keys.delete(e.code));

function floorHeightAt(position){
  if (!bounds) return null;
  raycaster.set(new THREE.Vector3(position.x, bounds.max.y + 5, position.z), down);
  raycaster.far = bounds.max.y - bounds.min.y + 15;
  const hits = raycaster.intersectObjects(collisionMeshes, false);
  const belowEye = hits.find(hit => hit.point.y <= position.y - EYE_HEIGHT * 0.2);
  return belowEye ? belowEye.point.y : null;
}

function blocked(origin, direction, distance, eyeDrop = EYE_HEIGHT * 0.42){
  if (distance <= 0) return false;
  const eye = origin.clone();
  eye.y -= eyeDrop;
  raycaster.set(eye, direction.clone().normalize());
  raycaster.far = distance + COLLISION_RADIUS;
  return raycaster.intersectObjects(collisionMeshes, false).length > 0;
}

function applySpawn(){
  if (!bounds) return;
  const size = bounds.getSize(new THREE.Vector3());
  let spawn, target;
  if (selectedSpawn === 'gentiles') {
    spawn = new THREE.Vector3(...GENTILES_SPAWN.position);
    spawn.y += EYE_HEIGHT;
    target = new THREE.Vector3(...GENTILES_SPAWN.lookAt);
  } else {
    spawn = new THREE.Vector3(
      (bounds.min.x + bounds.max.x) / 2,
      bounds.max.y + EYE_HEIGHT,
      bounds.max.z - size.z * 0.06
    );
    const ground = floorHeightAt(spawn);
    spawn.y = (ground ?? bounds.min.y) + EYE_HEIGHT;
    target = new THREE.Vector3(spawn.x, spawn.y, bounds.getCenter(new THREE.Vector3()).z);
  }
  camera.position.copy(spawn);
  camera.lookAt(target);
  verticalVelocity = 0;
  grounded = true;
}

new GLTFLoader().load(MODEL_URL, gltf => {
  const model = gltf.scene;
  scene.add(model);
  model.traverse(object => {
    if (!object.isMesh) return;
    object.frustumCulled = true;
    collisionMeshes.push(object);
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    /* GLB의 문·아치·지붕에는 외부에서 숨겨지는 내부 삼각면이 있다.
       전체 DoubleSide는 그 면을 가시 모양 파편으로 노출하므로 원본과 동일하게
       앞면만 렌더한다. 내부에서 보이지 않는 곳은 추후 실제 내벽 메시로 보강한다. */
    mats.forEach(mat => { if (mat) { mat.side = THREE.FrontSide; mat.needsUpdate = true; } });
  });
  bounds = new THREE.Box3().setFromObject(model);
  applySpawn();
  modelReady = true;
  startButton.disabled = false;
  spawnFieldset.disabled = false;
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
  if (forward.lengthSq() >= 0.001) forward.normalize();
  right.crossVectors(forward, camera.up).normalize();
  desired.set(0,0,0);
  if (keys.has('KeyW') || keys.has('ArrowUp')) desired.add(forward);
  if (keys.has('KeyS') || keys.has('ArrowDown')) desired.sub(forward);
  if (keys.has('KeyD') || keys.has('ArrowRight')) desired.add(right);
  if (keys.has('KeyA') || keys.has('ArrowLeft')) desired.sub(right);
  const frameDt = Math.min(dt, 0.05);
  if (desired.lengthSq()) {
    desired.normalize();
    const distance = MOVE_SPEED * frameDt;
    const currentFloor = floorHeightAt(camera.position);
    const candidate = camera.position.clone().addScaledVector(desired, distance);
    const nextFloor = floorHeightAt(candidate);
    const stepRise = currentFloor != null && nextFloor != null ? nextFloor - currentFloor : 0;
    const waistBlocked = blocked(camera.position, desired, distance);
    const headBlocked = blocked(camera.position, desired, distance, EYE_HEIGHT * 0.08);
    const normalStep = stepRise <= MAX_STEP_HEIGHT && !waistBlocked;
    /* 허리선에는 걸리지만 머리선은 비어 있는 낮은 턱은, 상면이 확인될 때만
       자동으로 올라간다. 벽을 통과시키지 않고 낮은 장애물에만 적용한다. */
    const autoClimb = stepRise > MAX_STEP_HEIGHT && stepRise <= MAX_AUTO_CLIMB_HEIGHT &&
                      waistBlocked && !headBlocked && nextFloor != null;
    if (normalStep || autoClimb) {
      camera.position.x = candidate.x;
      camera.position.z = candidate.z;
      if (grounded && nextFloor != null) {
        camera.position.y = nextFloor + EYE_HEIGHT;
      }
    }
  }

  const floor = floorHeightAt(camera.position);
  if (floor != null) {
    const floorEye = floor + EYE_HEIGHT;
    if (grounded && verticalVelocity <= 0) {
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, floorEye, Math.min(1, frameDt * 16));
    } else {
      verticalVelocity -= GRAVITY * frameDt;
      camera.position.y += verticalVelocity * frameDt;
      if (verticalVelocity <= 0 && camera.position.y <= floorEye) {
        camera.position.y = floorEye;
        verticalVelocity = 0;
        grounded = true;
      }
    }
  } else {
    verticalVelocity -= GRAVITY * frameDt;
    camera.position.y += verticalVelocity * frameDt;
  }
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
