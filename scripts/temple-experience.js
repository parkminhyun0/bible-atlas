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
const MAX_INTERIOR_FLOOR_DROP = 1.15; // 내부 메시 틈을 통한 수직 추락만 차단한다.
const AVATAR_TEXTURE_URL = './assets/herod-temple/character/visitor-cloak-weave-v1.png?v=20260819a';
const touchMode = matchMedia('(hover: none), (pointer: coarse)').matches;
const AVATAR_MODEL_URL = touchMode
  ? './assets/herod-temple/character/visitor-realistic-mobile.glb?v=20260819c'
  : './assets/herod-temple/character/visitor-realistic-high.glb?v=20260819c';
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
const viewToggle = document.getElementById('viewToggle');

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
const playerPosition = new THREE.Vector3();
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
let thirdPerson = false;
let avatarWalkTime = 0;
let lastFloorHeight = null;

function createVisitorAvatar(){
  const group = new THREE.Group();
  group.name = 'visitorAvatar';
  const weave = new THREE.TextureLoader().load(AVATAR_TEXTURE_URL);
  weave.colorSpace = THREE.SRGBColorSpace;
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(2,3);
  const cloak = new THREE.MeshStandardMaterial({color:0xb9aa91,map:weave,roughness:0.96,side:THREE.DoubleSide});
  const tunic = new THREE.MeshStandardMaterial({color:0xe0d0ad,roughness:0.94});
  const headcloth = new THREE.MeshStandardMaterial({color:0xbcae97,roughness:0.95});
  const skin = new THREE.MeshStandardMaterial({color:0x966044,roughness:0.92});
  const hairMat = new THREE.MeshStandardMaterial({color:0x211713,roughness:0.98});
  const leather = new THREE.MeshStandardMaterial({color:0x4b3022,roughness:0.95});

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.38,1.08,12),tunic);
  body.position.y=0.98; group.add(body);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.37,0.43,0.55,12),tunic);
  skirt.position.y=0.48; group.add(skirt);
  const shoulderWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.35,0.32,12,1,true),cloak);
  shoulderWrap.position.y=1.33; group.add(shoulderWrap);
  const backCloak = new THREE.Mesh(new THREE.PlaneGeometry(0.82,1.28,3,5),cloak);
  backCloak.position.set(0,0.77,-0.27); group.add(backCloak);
  for(const side of [-1,1]){
    const frontPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.31,1.12,2,5),cloak);
    frontPanel.position.set(side*0.2,0.82,0.29); frontPanel.rotation.y=side*0.12; group.add(frontPanel);
  }
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.08,12),leather);
  belt.position.y=1.02; group.add(belt);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.055,0.9,0.035),leather);
  strap.position.set(-0.08,1.18,0.34); strap.rotation.z=-0.48; group.add(strap);
  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.28,0.3,0.13),leather);
  pouch.position.set(0.34,0.9,0.28); group.add(pouch);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19,14,10),skin);
  head.position.y=1.72; group.add(head);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045,0.12,7),skin);
  nose.rotation.x=Math.PI/2; nose.position.set(0,1.72,0.19); group.add(nose);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.202,12,8,0,Math.PI*2,0,Math.PI*0.68),hairMat);
  hair.position.y=1.77; group.add(hair);
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.17,0.38,10),hairMat);
  beard.position.set(0,1.5,0.13); group.add(beard);
  const scarfCap = new THREE.Mesh(new THREE.SphereGeometry(0.215,12,8,0,Math.PI*2,0,Math.PI*0.56),headcloth);
  scarfCap.position.y=1.82; group.add(scarfCap);
  const scarfBand = new THREE.Mesh(new THREE.TorusGeometry(0.202,0.025,6,16),headcloth);
  scarfBand.rotation.x=Math.PI/2; scarfBand.position.y=1.77; group.add(scarfBand);
  const scarfTail = new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.48,1,3),headcloth);
  scarfTail.position.set(0.1,1.56,-0.21); scarfTail.rotation.z=-0.15; group.add(scarfTail);

  const limbs={arms:[],legs:[]};
  for(const side of [-1,1]){
    const arm=new THREE.Group(); arm.position.set(side*0.34,1.35,0);
    const sleeve=new THREE.Mesh(new THREE.CylinderGeometry(0.105,0.085,0.48,8),tunic);
    sleeve.position.y=-0.21; arm.add(sleeve);
    const hand=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.06,0.3,8),skin);
    hand.position.y=-0.58; arm.add(hand); group.add(arm); limbs.arms.push(arm);
    const leg=new THREE.Group(); leg.position.set(side*0.14,0.68,0);
    const legMesh=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.075,0.62,8),skin);
    legMesh.position.y=-0.31; leg.add(legMesh);
    const foot=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.09,0.34),leather);
    foot.position.set(0,-0.66,0.07); leg.add(foot); group.add(leg); limbs.legs.push(leg);
  }
  group.userData.limbs=limbs;
  group.userData.forwardOffset=0; // procedural visitor faces local +Z
  group.visible=false;
  scene.add(group);
  return group;
}
let visitorAvatar=createVisitorAvatar();

function loadRealisticVisitorAvatar(){
  new GLTFLoader().load(AVATAR_MODEL_URL, gltf => {
    const loaded = gltf.scene;
    loaded.name = 'visitorAvatarRealistic';
    loaded.visible = thirdPerson;
    loaded.traverse(object => {
      if (!object.isMesh) return;
      object.frustumCulled = true;
      const mats = Array.isArray(object.material) ? object.material : [object.material];
      mats.forEach(mat => {
        if (mat?.map) mat.map.colorSpace = THREE.SRGBColorSpace;
        if (mat) { mat.side = THREE.FrontSide; mat.needsUpdate = true; }
      });
    });
    const arms = ['armLeft','armRight'].map(name => loaded.getObjectByName(name));
    const legs = ['legLeft','legRight'].map(name => loaded.getObjectByName(name));
    if ([...arms,...legs].some(node => !node)) {
      console.warn('Visitor GLB is missing runtime limb pivots; keeping procedural fallback.');
      return;
    }
    [...arms,...legs].forEach(node => {
      // A glTF bone's imported local rotation is its anatomical rest pose.
      // Walking offsets must be additive; zeroing this value folds the skinned body.
      node.userData.walkRestRotationX = node.rotation.x;
    });
    loaded.userData.limbs = {arms,legs};
    loaded.userData.forwardOffset = Math.PI; // Blender/glTF visitor faces local -Z
    loaded.position.copy(visitorAvatar.position);
    loaded.rotation.copy(visitorAvatar.rotation);
    scene.remove(visitorAvatar);
    visitorAvatar = loaded;
    scene.add(visitorAvatar);
  }, undefined, error => {
    console.warn('Realistic visitor GLB failed to load; using procedural fallback.', error);
  });
}
loadRealisticVisitorAvatar();

function setStatus(message){ statusText.textContent = message; }
function returnToAtlas(){
  const fallback = './index.html';
  const target = sessionStorage.getItem('bibleAtlas:returnUrl') || fallback;
  window.location.assign(target);
}
exitButton.addEventListener('click', returnToAtlas);
function setThirdPerson(active){
  thirdPerson=active;
  visitorAvatar.visible=active;
  viewToggle.setAttribute('aria-pressed',String(active));
  viewToggle.textContent=active?'1인칭':'3인칭';
  setStatus(active?'3인칭 시점 · 뒤에서 방문자 조작':'1인칭 시점');
}
viewToggle.addEventListener('click',()=>setThirdPerson(!thirdPerson));

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
  if (e.code === 'KeyV' && !e.repeat) setThirdPerson(!thirdPerson);
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

function floorHeightAt(position, referenceFloor = null){
  if (!bounds) return null;
  raycaster.set(new THREE.Vector3(position.x, bounds.max.y + 5, position.z), down);
  raycaster.far = bounds.max.y - bounds.min.y + 15;
  const hits = raycaster.intersectObjects(collisionMeshes, false);
  const belowEye = hits.find(hit => hit.point.y <= position.y - EYE_HEIGHT * 0.2);
  if (!belowEye) return null;
  const hasNearbyRoof = hits.some(hit => hit.point.y > position.y + 0.5 && hit.point.y < position.y + 30);
  if (referenceFloor != null && hasNearbyRoof && referenceFloor - belowEye.point.y > MAX_INTERIOR_FLOOR_DROP) {
    /* Box형 건물의 얇은 시각 바닥 틈 아래에 더 낮은 외부 바닥이 잡히더라도,
       실내에서는 마지막 연속 바닥 높이를 충돌 바닥으로 이어 붙인다. */
    return referenceFloor;
  }
  return belowEye.point.y;
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
  playerPosition.copy(spawn);
  camera.position.copy(playerPosition);
  camera.lookAt(target);
  camera.rotation.order = 'YXZ';
  verticalVelocity = 0;
  grounded = true;
  lastSafePosition = playerPosition.clone();
  lastFloorHeight = floorHeightAt(playerPosition) ?? playerPosition.y - EYE_HEIGHT;
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
  viewToggle.disabled = false;
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
    const distance = Math.hypot(playerPosition.x-door.center.x, playerPosition.z-door.center.z);
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
    const currentFloor = floorHeightAt(playerPosition,lastFloorHeight);
    const candidate = playerPosition.clone().addScaledVector(desired, distance);
    const nextFloor = floorHeightAt(candidate,currentFloor);
    const stepRise = currentFloor != null && nextFloor != null ? nextFloor - currentFloor : 0;
    const waistBlocked = blocked(playerPosition, desired, distance);
    const headBlocked = blocked(playerPosition, desired, distance, EYE_HEIGHT * 0.08);
    const normalStep = stepRise <= MAX_STEP_HEIGHT && !waistBlocked;
    /* 허리선에는 걸리지만 머리선은 비어 있는 낮은 턱은, 상면이 확인될 때만
       자동으로 올라간다. 벽을 통과시키지 않고 낮은 장애물에만 적용한다. */
    const autoClimb = stepRise > MAX_STEP_HEIGHT && stepRise <= MAX_AUTO_CLIMB_HEIGHT &&
                      waistBlocked && !headBlocked && nextFloor != null;
    if (normalStep || autoClimb) {
      playerPosition.x = candidate.x;
      playerPosition.z = candidate.z;
      if (grounded && nextFloor != null) {
        playerPosition.y = nextFloor + EYE_HEIGHT;
      }
    }
  }

  const floor = floorHeightAt(playerPosition,lastFloorHeight);
  if (floor != null) {
    const floorEye = floor + EYE_HEIGHT;
    if (grounded && verticalVelocity <= 0) {
      playerPosition.y = THREE.MathUtils.lerp(playerPosition.y, floorEye, Math.min(1, frameDt * 16));
    } else {
      verticalVelocity -= GRAVITY * frameDt;
      playerPosition.y += verticalVelocity * frameDt;
      if (verticalVelocity <= 0 && playerPosition.y <= floorEye) {
        playerPosition.y = floorEye;
        verticalVelocity = 0;
        grounded = true;
      }
    }
    if (grounded) {
      lastSafePosition = playerPosition.clone();
      lastFloorHeight = floor;
    }
  } else {
    /* 역사 지형 메시의 유효 경계 밖에는 바닥이 없다. 추락시키지 않고 마지막
       검증된 보행 지점으로 즉시 되돌려 체험 영역 경계를 명확히 한다. */
    if (lastSafePosition) {
      playerPosition.copy(lastSafePosition);
      lastFloorHeight = lastSafePosition.y - EYE_HEIGHT;
      verticalVelocity = 0;
      grounded = true;
      setStatus('체험 영역의 경계입니다 · 안전한 위치로 돌아왔습니다');
    }
  }

  const moving=desired.lengthSq()>0.001;
  if(moving){
    avatarWalkTime+=frameDt*(keys.has('KeyF')||touchSprint?12:7);
  }
  /* FPS-style third person: the body follows camera yaw, never the signed movement
     vector. W advances, S backpedals, and A/D strafe without flipping the body. */
  if(thirdPerson && forward.lengthSq()>0.001){
    const targetYaw=Math.atan2(forward.x,forward.z)+(visitorAvatar.userData.forwardOffset??0);
    visitorAvatar.rotation.y=targetYaw;
  }
  const swing=moving?Math.sin(avatarWalkTime)*0.42:0;
  const {arms,legs}=visitorAvatar.userData.limbs;
  const restX=node=>node.userData.walkRestRotationX??0;
  arms[0].rotation.x=THREE.MathUtils.damp(arms[0].rotation.x,restX(arms[0])+swing,10,frameDt);
  arms[1].rotation.x=THREE.MathUtils.damp(arms[1].rotation.x,restX(arms[1])-swing,10,frameDt);
  legs[0].rotation.x=THREE.MathUtils.damp(legs[0].rotation.x,restX(legs[0])-swing,10,frameDt);
  legs[1].rotation.x=THREE.MathUtils.damp(legs[1].rotation.x,restX(legs[1])+swing,10,frameDt);
}

function updateView(){
  visitorAvatar.position.set(playerPosition.x,playerPosition.y-EYE_HEIGHT,playerPosition.z);
  if(!thirdPerson){ camera.position.copy(playerPosition); return; }
  camera.getWorldDirection(forward); forward.y=0;
  if(forward.lengthSq()<0.001) forward.set(0,0,-1); else forward.normalize();
  const target=playerPosition.clone(); target.y-=0.55;
  const wanted=playerPosition.clone().addScaledVector(forward,-5.5); wanted.y+=2.4;
  const cameraRay=wanted.clone().sub(target);
  const cameraDistance=cameraRay.length(); cameraRay.normalize();
  raycaster.set(target,cameraRay); raycaster.far=cameraDistance;
  const hit=raycaster.intersectObjects(collisionMeshes,false)[0];
  const safeDistance=hit?Math.max(0.8,hit.distance-0.35):cameraDistance;
  camera.position.copy(target).addScaledVector(cameraRay,safeDistance);
  camera.lookAt(target);
  camera.rotation.order='YXZ';
}

function animate(){
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  updateDoors(dt);
  updateMovement(dt);
  updateView();
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
