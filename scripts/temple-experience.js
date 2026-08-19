import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const MODEL_URL = './assets/herod-temple/ad30/lod1.glb?v=20260819c';
const EYE_HEIGHT = 1.68;
const MOVE_SPEED = 7;
const SPRINT_SPEED = 19;
const COLLISION_RADIUS = 0.55;
const MAX_STEP_HEIGHT = 0.65; // 계단 자동 승단. 역사 치수가 아닌 보행 파라미터다.
const MAX_AUTO_CLIMB_HEIGHT = 1.05; // 낮은 턱을 자연스럽게 넘는 보행 보조
const GRAVITY = 22;
const JUMP_SPEED = 8.6;
const touchMode = matchMedia('(hover: none), (pointer: coarse)').matches;
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
const movePad = document.getElementById('movePad');
const moveStick = document.getElementById('moveStick');
const lookZone = document.getElementById('lookZone');
const sprintButton = document.getElementById('sprintButton');
const jumpButton = document.getElementById('jumpButton');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x86add4);
scene.fog = new THREE.FogExp2(0xc8b895, 0.0016);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 1800);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, touchMode ? 1.5 : 2));
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
const interactiveDoors = [];
const registeredInteractiveNodes = new Set();
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
let lastSafePosition = null;
let debirNoticeShown = false;
let experienceActive = false;
let touchSprint = false;
const touchMove = new THREE.Vector2();

function setStatus(message){ statusText.textContent = message; }
function returnToAtlas(){
  const fallback = './index.html';
  const target = sessionStorage.getItem('bibleAtlas:returnUrl') || fallback;
  window.location.assign(target);
}
exitButton.addEventListener('click', returnToAtlas);

controls.addEventListener('lock', () => {
  experienceActive = true;
  startScreen.classList.remove('open');
  document.body.classList.add('locked');
  setStatus('체험 중 · Esc로 시선 조작 해제');
});
controls.addEventListener('unlock', () => {
  experienceActive = false;
  document.body.classList.remove('locked');
  if (modelReady) {
    startScreen.classList.add('open');
    startButton.textContent = '체험 계속하기';
    setStatus('일시 정지');
  }
});
startButton.addEventListener('click', () => {
  if (touchMode) {
    experienceActive = true;
    startScreen.classList.remove('open');
    document.body.classList.add('touch-active');
    setStatus('모바일 체험 중 · 왼쪽 이동 / 오른쪽 시선');
  } else controls.lock();
});
spawnChoices.forEach(button => button.addEventListener('click', () => {
  selectedSpawn = button.dataset.spawn;
  spawnChoices.forEach(item => item.classList.toggle('active', item === button));
  if (modelReady) applySpawn();
}));

addEventListener('keydown', e => {
  if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyF'].includes(e.code)) {
    keys.add(e.code); e.preventDefault();
  }
  if (e.code === 'Space') {
    e.preventDefault();
    if (!e.repeat) jump();
  }
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); touchSprint = false; sprintButton?.classList.remove('active'); });

function jump(){
  if (experienceActive && grounded) {
    verticalVelocity = JUMP_SPEED;
    grounded = false;
  }
}

if (touchMode) {
  let movePointer = null;
  const updateMovePad = event => {
    const rect = movePad.getBoundingClientRect();
    const radius = rect.width * 0.36;
    let x = event.clientX - (rect.left + rect.width / 2);
    let y = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(x, y);
    if (length > radius) { x *= radius / length; y *= radius / length; }
    touchMove.set(x / radius, -y / radius);
    moveStick.style.transform = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
  };
  movePad.addEventListener('pointerdown', event => {
    movePointer = event.pointerId; movePad.setPointerCapture(movePointer); updateMovePad(event); event.preventDefault();
  });
  movePad.addEventListener('pointermove', event => { if (event.pointerId === movePointer) updateMovePad(event); });
  const stopMove = event => {
    if (event.pointerId !== movePointer) return;
    movePointer = null; touchMove.set(0,0); moveStick.style.transform = 'translate(-50%,-50%)';
  };
  movePad.addEventListener('pointerup', stopMove);
  movePad.addEventListener('pointercancel', stopMove);

  let lookPointer = null, lastLookX = 0, lastLookY = 0;
  lookZone.addEventListener('pointerdown', event => {
    lookPointer = event.pointerId; lastLookX = event.clientX; lastLookY = event.clientY;
    lookZone.setPointerCapture(lookPointer); event.preventDefault();
  });
  lookZone.addEventListener('pointermove', event => {
    if (event.pointerId !== lookPointer || !experienceActive) return;
    camera.rotation.order = 'YXZ';
    camera.rotation.y -= (event.clientX - lastLookX) * 0.004;
    camera.rotation.x -= (event.clientY - lastLookY) * 0.004;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x, -Math.PI * 0.48, Math.PI * 0.48);
    lastLookX = event.clientX; lastLookY = event.clientY;
  });
  const stopLook = event => { if (event.pointerId === lookPointer) lookPointer = null; };
  lookZone.addEventListener('pointerup', stopLook);
  lookZone.addEventListener('pointercancel', stopLook);

  const setSprint = active => { touchSprint = active; sprintButton.classList.toggle('active', active); };
  sprintButton.addEventListener('pointerdown', event => { sprintButton.setPointerCapture(event.pointerId); setSprint(true); event.preventDefault(); });
  sprintButton.addEventListener('pointerup', () => setSprint(false));
  sprintButton.addEventListener('pointercancel', () => setSprint(false));
  jumpButton.addEventListener('pointerdown', event => { jumpButton.classList.add('active'); jump(); event.preventDefault(); });
  jumpButton.addEventListener('pointerup', () => jumpButton.classList.remove('active'));
  jumpButton.addEventListener('pointercancel', () => jumpButton.classList.remove('active'));
}

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
  camera.rotation.order = 'YXZ';
  verticalVelocity = 0;
  grounded = true;
  lastSafePosition = camera.position.clone();
}

function registerInteractiveNode(object){
  let owner = object;
  while (owner && !/^(stairsChel|door|veil)/.test(owner.name || '')) owner = owner.parent;
  if (!owner) return;
  const name = owner.name;
  if (name === 'stairsChel') {
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    mats.forEach(mat => { if (mat) { mat.side = THREE.DoubleSide; mat.needsUpdate = true; } });
  }
  if (!name.startsWith('door') && !name.startsWith('veil')) return;
  if (registeredInteractiveNodes.has(owner)) return;
  registeredInteractiveNodes.add(owner);
  const box = new THREE.Box3().setFromObject(owner);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  let axis = 'y', sign = 1, travel = size.y + 0.4;
  if (name.startsWith('door')) {
    const bits = name.split('_');
    axis = bits[1];
    sign = bits[2] === 'm' ? -1 : 1;
    travel = (axis === 'x' ? size.x : size.z) * 0.94;
  }
  interactiveDoors.push({object:owner,name,center,axis,sign,travel,amount:0,closed:owner.position.clone()});
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
    registerInteractiveNode(object);
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
function updateDoors(dt){
  for (const door of interactiveDoors) {
    const distance = Math.hypot(camera.position.x-door.center.x, camera.position.z-door.center.z);
    const target = distance < 7.5 ? 1 : 0;
    if (target && door.name.startsWith('veilDebir') && !debirNoticeShown) {
      debirNoticeShown = true;
      setStatus('지성소 · AD 30에는 기반석 외 성물이 없었습니다');
    }
    door.amount = THREE.MathUtils.damp(door.amount, target, 6, dt);
    door.object.position.copy(door.closed);
    door.object.position[door.axis] += door.sign * door.travel * door.amount;
    door.object.updateMatrixWorld(true);
  }
}
function updateMovement(dt){
  if (!experienceActive || !modelReady) return;
  camera.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() >= 0.001) forward.normalize();
  right.crossVectors(forward, camera.up).normalize();
  desired.set(0,0,0);
  if (keys.has('KeyW') || keys.has('ArrowUp')) desired.add(forward);
  if (keys.has('KeyS') || keys.has('ArrowDown')) desired.sub(forward);
  if (keys.has('KeyD') || keys.has('ArrowRight')) desired.add(right);
  if (keys.has('KeyA') || keys.has('ArrowLeft')) desired.sub(right);
  if (touchMove.y) desired.addScaledVector(forward, touchMove.y);
  if (touchMove.x) desired.addScaledVector(right, touchMove.x);
  const frameDt = Math.min(dt, 0.05);
  if (desired.lengthSq()) {
    desired.normalize();
    const distance = (keys.has('KeyF') || touchSprint ? SPRINT_SPEED : MOVE_SPEED) * frameDt;
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
    if (grounded) lastSafePosition = camera.position.clone();
  } else {
    /* 역사 지형 메시의 유효 경계 밖에는 바닥이 없다. 추락시키지 않고 마지막
       검증된 보행 지점으로 즉시 되돌려 체험 영역 경계를 명확히 한다. */
    if (lastSafePosition) {
      camera.position.copy(lastSafePosition);
      verticalVelocity = 0;
      grounded = true;
      setStatus('체험 영역의 경계입니다 · 안전한 위치로 돌아왔습니다');
    }
  }
}

function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  updateDoors(dt);
  updateMovement(dt);
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
