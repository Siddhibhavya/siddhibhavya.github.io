/* Koi-fish background — ported from Background/sketch.js.
   Every constant and all geometry below are unchanged from that sketch.
   Only the page integration differs (see the "SITE INTEGRATION" markers):
     - background is the Figma plum #190523 instead of near-black
     - the canvas mounts inside an element (landing: full screen, footer: the 368px strip)
     - in the footer the fish only wakes while the pointer is over the footer
     - the loop pauses while the canvas is off-screen */

// ---- SITE INTEGRATION: per-page configuration ------------------------------
const KOI = Object.assign({ mount: '#koi', bg: [25, 5, 35], hoverOnly: false }, window.KOI_CONFIG || {});
let KOI_HOST = null;

// idle Mechanism
let IDLE_TIME_MS            = 6000; // 6 seconds before fish/trail fades when mouse is abandoned

// Particle Field Opacity
let PARTICLE_OPACITY_ACTIVE = 0.15; // Brightness of ambient field during interaction
let PARTICLE_OPACITY_IDLE   = 0.15; // Dimness of ambient field when abandoned

// Dynamic Trail Geometry
let TRAIL_LENGTH_FRAMES     = 240;  // How long the trail is (historical frames)
let TRAIL_HEAD_WIDTH        = 65;   // Width of the trail right behind the fish
let TRAIL_TAIL_WIDTH        = 12;   // Tapered width at the very bottom/end of the trail
let TRAIL_GLOW_PEAK         = 1.1;  // Max brightness of the trail dots
let TRAIL_GLOW_FALLOFF      = 1.4;  // Smoothness of the trail edges
let TRAIL_STRIDE            = 3;    // OPTIMIZED: Increased from 1. Calculates trail 3x faster with no visual break

// ============================================================
// FISH & ENVIRONMENT CONFIGURATION
// ============================================================

let FISH_SIZE = 0.7;
let FISH_OPACITY_MULT  = 100;
let GLOW_OPACITY_MULT  = 100;

let CAVITY_PADDING    = 5;
let GLOW_WALL_WIDTH   = 20;
let COMET_TAIL_LENGTH = 10;
let COMET_TAIL_WIDTH  = 0.14;

// Base grid density
let PARTICLE_SPACING   = 10;   // OPTIMIZED: Increased from 8 to cut particle count by ~65%
let FIELD_NOISE_SCALE  = 0.05;
let FIELD_NOISE_SPEED  = 0.03;
let FIELD_NOISE_AMP    = 3.5;
let FIELD_FADE_OUT     = 0.006;  
let FIELD_FADE_IN      = 0.030;  

let VEL_SMOOTH        = 1.40;
let VEL_DECAY         = 0.93;

let STAR_CELL_SIZE    = 60;
let STAR_SPEED        = 0.14;

let SPINE_LEN         = 60;
let SPINE_SEG         = 2;
let HEAD_FOLLOW       = 0.12;

let BASE_SNOUT_W      = 4;
let BASE_HEAD_W       = 15;
let BASE_SHOULDER_W   = 18;
let BASE_PEDUNCLE_W   = 15;
let BASE_TAIL_W       = 4;

let TAIL_LOBE_SPAN    = 150;
let TAIL_LOBE_SWEEP   = -70;
let TAIL_NOTCH_DEPTH  = 6;
let TAIL_NOTCH_WIDTH  = 6;
let TAIL_ROOT_GUARD   = 1.5;
let TAIL_LOBE_ROWS    = 25; // OPTIMIZED: Halved from 50
let TAIL_LOBE_COLS    = 20; // OPTIMIZED: Halved from 60

let WAG_BASE_AMP      = 12;
let WAG_SPEED_SCALE   = 1.8;
let WAG_MAX_EXTRA     = 35;
let WAG_FREQ          = 0.08;
let WAG_U_FREQ        = 2.4;
let WAG_V_FREQ        = 0.9;

let FISH_ALPHA_MAX    = 145;
let FADE_RATE_HEAD    = 1.0;
let FADE_RATE_TAIL    = 5.5;
let RESTORE_RATE_HEAD = 9.0;
let RESTORE_RATE_TAIL = 1.5;

let SW_CORNER_SPREAD  = 0.28;
let SW_PER_CORNER     = 12;   
let SW_HEIGHT_MIN     = 120;
let SW_HEIGHT_MAX     = 260;
let SW_AMP_MIN        = 10; 
let SW_AMP_MAX        = 24;
let SW_SEG_MIN        = 10;   
let SW_SEG_MAX        = 16;
let SW_STRAND_RADIUS  = 22;
let SW_GLOW_PEAK      = 2.6;

// ============================================================
// STATE ARRAYS
// ============================================================

let backgroundStars = [];
let fieldParticles  = [];
let koiSpine        = [];
let spineAlphas     = [];
let lastMoveTime    = 0;
let noiseT          = 0;
let frameN          = 0;

let smoothVelX = 0, smoothVelY = 0;
let prevMX     = 0, prevMY     = 0;
let wagPhase   = 0;
let fishSpeed  = 0;
let fishVelocityVector;
let fieldOpacityScale = PARTICLE_OPACITY_IDLE;
let trailBuffer   = [];
let seaweeds     = [];
let SW_PHASE     = 0;
let seaweedSamples = [];
let seaweedStrands = [];

let BODY_SNOUT_W, BODY_HEAD_W, BODY_SHOULDER_W, BODY_PEDUNCLE_W, BODY_TAIL_W;

function updateFishProportions() {
  BODY_SNOUT_W    = BASE_SNOUT_W    * FISH_SIZE;
  BODY_HEAD_W     = BASE_HEAD_W     * FISH_SIZE;
  BODY_SHOULDER_W = BASE_SHOULDER_W * FISH_SIZE;
  BODY_PEDUNCLE_W = BASE_PEDUNCLE_W * FISH_SIZE;
  BODY_TAIL_W     = BASE_TAIL_W     * FISH_SIZE;
}

// ============================================================
// GEOMETRIC STARS
// ============================================================

function buildStarGrid() {
  backgroundStars = [];
  let cols = ceil(width  / STAR_CELL_SIZE);
  let rows = ceil(height / STAR_CELL_SIZE);
  for (let ci = 0; ci < cols; ci++) {
    for (let ri = 0; ri < rows; ri++) {
      backgroundStars.push(new BackgroundStar(
        (ci + random(0.1, 0.9)) * STAR_CELL_SIZE,
        (ri + random(0.1, 0.9)) * STAR_CELL_SIZE
      ));
    }
  }
}

class BackgroundStar {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.size  = random(0.014, 0.032);
    this.angle = random(360);
    this.phase = random(360); 
    this.twSpd = random(1.0, 3.0);
  }
  recycle() {
    let rows = ceil(height / STAR_CELL_SIZE);
    this.x     = random(-STAR_CELL_SIZE, 0);
    this.y     = (floor(random(rows)) + random(0.1, 0.9)) * STAR_CELL_SIZE;
    this.size  = random(0.014, 0.032);
    this.angle = random(360);
    this.phase = random(360);
    this.twSpd = random(1.0, 3.0);
  }
  update() {
    this.x     += STAR_SPEED;
    this.phase += this.twSpd;
    if (this.x > width + STAR_CELL_SIZE) this.recycle();
    this.angle += 0.38;
  }
  show() {
    let tw = sin(this.phase) * 0.5 + 0.5;
    let op = lerp(55, 105, tw);
    let sz = this.size * lerp(0.88, 1.12, tw);
    push();
    translate(this.x, this.y); rotate(this.angle); scale(sz);
    stroke(255, 255, 255, op); strokeWeight(20);
    let R = 150;
    line(0,-R,0,R); line(-R,0,R,0);
    for (let k = 0; k < R; k += 30) {
      line(R-k,0,0,-k); line(R-k,0,0,k);
      line(-R+k,0,0,-k); line(-R+k,0,0,k);
    }
    pop();
  }
}

// ============================================================
// SEAWEEDS
// ============================================================

function buildSeaweeds() {
  seaweeds = [];
  let cw = width * SW_CORNER_SPREAD;
  let zones = [[0, cw], [width - cw, width]];
  for (let zone of zones) {
    for (let i = 0; i < SW_PER_CORNER; i++) {
      seaweeds.push({
        x: random(zone[0] + 8, zone[1] - 8),
        h: random(SW_HEIGHT_MIN, SW_HEIGHT_MAX),
        seg: floor(random(SW_SEG_MIN, SW_SEG_MAX)),
        swaySpd: random(0.006, 0.014), 
        swayAmp: random(SW_AMP_MIN, SW_AMP_MAX),
        phase: random(360),
        thickBase: random(14, 24)
      });
    }
  }
}

function evalSeaweedStrands() {
  SW_PHASE += 0.007; 
  seaweedSamples = [];
  seaweedStrands = [];
  for (let sw of seaweeds) {
    let baseY = height - 2;
    let segH  = sw.h / sw.seg;
    let strand = [];
    for (let s = 0; s <= sw.seg; s++) {
      let t = s / sw.seg;
      let sCurve = sin(t * 180 + 90);
      let sway   = sin(SW_PHASE * sw.swaySpd * 180 + sw.phase) * sw.swayAmp * sCurve * t;
      let sx = sw.x + sway;
      let sy = baseY - s * segH;
      // Pre-compute squared thickness for faster particle distance checks
      let thick = sw.thickBase * (1 - t * 0.65);
      let sample = { x: sx, y: sy, thick: thick, thickSq: thick * thick, opacity: lerp(1.0, 0.65, t * t) };
      strand.push(sample);
      seaweedSamples.push(sample);
    }
    seaweedStrands.push(strand);
  }
}

function drawSeaweedStrands() {
  noStroke();
  for (let strand of seaweedStrands) {
    for (let i = 0; i < strand.length; i++) {
      let pt = strand[i];
      let sz = pt.thick * (0.85 + 0.15 * sin(i * 0.55 + SW_PHASE * 1.5)) * 0.38;
      let glow = pt.opacity * SW_GLOW_PEAK;
      fill(255, 255, 255, constrain(glow * 90, 0, 255));
      circle(pt.x, pt.y, sz);
      fill(255, 255, 255, constrain(glow * 170, 0, 255));
      circle(pt.x, pt.y, sz * 0.42);
    }
  }
}

// ============================================================
// CORE SETUP & DRAW
// ============================================================

function setup() {
  // SITE INTEGRATION: mount inside the host element and size to it
  KOI_HOST = document.querySelector(KOI.mount);
  createCanvas(KOI_HOST.clientWidth, KOI_HOST.clientHeight).parent(KOI_HOST);
  pixelDensity(1);
  angleMode(DEGREES);
  updateFishProportions();

  koiSpine = [];
  spineAlphas = [];
  for (let i = 0; i < SPINE_LEN; i++) {
    koiSpine.push(createVector(width/2, height/2));
    spineAlphas.push(KOI.hoverOnly ? 0 : FISH_ALPHA_MAX);   // SITE INTEGRATION
  }

  initField();
  buildStarGrid();
  buildSeaweeds();

  prevMX = width/2; prevMY = height/2;
  fishVelocityVector = createVector(0, 0);
  lastMoveTime = KOI.hoverOnly ? -1e9 : millis();   // SITE INTEGRATION: footer starts idle

  // SITE INTEGRATION: don't burn CPU while the canvas is scrolled out of view
  // (a strip that merely touches the viewport edge counts as "intersecting" — require real visibility, or it never pauses)
  new IntersectionObserver((entries) => (entries[0].intersectionRatio > 0.03 ? loop() : noLoop()), { threshold: [0, 0.03, 0.1, 0.5, 1] }).observe(KOI_HOST);
}

// SITE INTEGRATION: in the footer the fish reacts only to a pointer inside it
function koiPointerInside() { return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height; }
function mouseMoved()   { if (!KOI.hoverOnly || koiPointerInside()) lastMoveTime = millis(); }
function mouseDragged() { if (!KOI.hoverOnly || koiPointerInside()) lastMoveTime = millis(); }

function initField() {
  fieldParticles = [];
  let cols = ceil(width  / PARTICLE_SPACING) + 2;
  let rows = ceil(height / PARTICLE_SPACING) + 2;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      fieldParticles.push(new FieldParticle(
        -PARTICLE_SPACING * 2 + i * PARTICLE_SPACING,
        -PARTICLE_SPACING * 2 + j * PARTICLE_SPACING
      ));
    }
  }
}

function draw() {
  background(KOI.bg[0], KOI.bg[1], KOI.bg[2]);   // SITE INTEGRATION: #190523
  noiseT   += FIELD_NOISE_SPEED;
  wagPhase += WAG_FREQ;
  frameN++;

  let rawVX = mouseX - prevMX;
  let rawVY = mouseY - prevMY;
  smoothVelX = smoothVelX * (1 - VEL_SMOOTH) * VEL_DECAY + rawVX * VEL_SMOOTH;
  smoothVelY = smoothVelY * (1 - VEL_SMOOTH) * VEL_DECAY + rawVY * VEL_SMOOTH;
  prevMX = mouseX; prevMY = mouseY;

  fishVelocityVector.set(smoothVelX, smoothVelY);
  fishVelocityVector.limit(15);
  let spd = fishVelocityVector.mag();
  fishSpeed = lerp(fishSpeed, spd, 0.12);

  for (let s of backgroundStars) { s.update(); s.show(); }

  updateKoi();

  // Handle the abandon timer and opacity crossfade
  let idle = (millis() - lastMoveTime) > IDLE_TIME_MS;
  if (idle) {
    fieldOpacityScale = max(PARTICLE_OPACITY_IDLE, fieldOpacityScale - FIELD_FADE_OUT);
  } else {
    fieldOpacityScale = min(PARTICLE_OPACITY_ACTIVE, fieldOpacityScale + FIELD_FADE_IN);
  }

  // Generate historical trail points for the flexible path
  if (koiSpine.length > 1) {
    let tail = koiSpine[SPINE_LEN - 1];
    let prev = koiSpine[SPINE_LEN - 2];
    let tdx  = tail.x - prev.x, tdy = tail.y - prev.y;
    let tmag = sqrt(tdx*tdx + tdy*tdy) || 1;
    trailBuffer.push({ x: tail.x, y: tail.y, dx: tdx/tmag, dy: tdy/tmag });
    if (trailBuffer.length > TRAIL_LENGTH_FRAMES) trailBuffer.shift();
  }

  evalSeaweedStrands();
  drawSeaweedStrands();
  updateFluidFieldFast(idle);
  drawKoi();
  drawFieldParticles();
}

// ============================================================
// FIELD LOGIC & DYNAMIC RIPPLE TRAIL
// ============================================================

class FieldParticle {
  constructor(x, y) {
    this.baseX = x; this.baseY = y;
    this.x = x;     this.y = y;
    this.voidOpacityModifier = 2.0;
    this.highOpacityTeardrop = 0.0;
    this.trailGlow           = 0.0;
    this.relativeSpinePos    = 0.0;
    this.seaweedGlow         = 0.0;
    this.seaweedThick        = 0.0;
  }
}

function updateFluidFieldFast(idle) {
  let swLen   = seaweedSamples.length;
  let swZoneY = height - SW_HEIGHT_MAX - SW_STRAND_RADIUS * 2;

  let headPt       = koiSpine[0];
  let tailPt       = koiSpine[SPINE_LEN - 1];
  let spineVectorX = headPt.x - tailPt.x;
  let spineVectorY = headPt.y - tailPt.y;
  let spineMagSq   = spineVectorX * spineVectorX + spineVectorY * spineVectorY;
  
  let fwdVecX   = headPt.x - koiSpine[1].x;
  let fwdVecY   = headPt.y - koiSpine[1].y;
  let fmag      = sqrt(fwdVecX*fwdVecX + fwdVecY*fwdVecY) || 1;
  let spineDirX = fwdVecX / fmag;
  let spineDirY = fwdVecY / fmag;
  let trailLen  = trailBuffer.length;

  // OPTIMIZATION: Pre-compute trail geometry once per frame instead of per-particle
  let activeTrailGeometry = [];
  if (trailLen > 0) {
    for (let k = trailLen - 1; k >= 0; k -= TRAIL_STRIDE) {
      let age = k / max(trailLen - 1, 1); 
      let baseRadius = lerp(TRAIL_TAIL_WIDTH, TRAIL_HEAD_WIDTH, age);
      let ripplePhase = (age * 10) - (frameN * 0.15); 
      let rippleFactor = 1.0 + sin(ripplePhase) * 0.25; 
      let dynamicRadius = baseRadius * rippleFactor;
      let swayAmp = (1 - age) * 15;
      let swayX = sin(age * 15 + frameN * 0.05) * swayAmp;
      let swayY = cos(age * 15 + frameN * 0.05) * swayAmp;
      let s = trailBuffer[k];
      
      activeTrailGeometry.push({
        x: s.x + swayX,
        y: s.y + swayY,
        r: dynamicRadius,
        r2: dynamicRadius * dynamicRadius,
        glowScale: age * TRAIL_GLOW_PEAK
      });
    }
  }

  for (let p of fieldParticles) {
    // Natural environment sway
    let nx = (noise(p.baseX * FIELD_NOISE_SCALE, p.baseY * FIELD_NOISE_SCALE + noiseT) - 0.5) * FIELD_NOISE_AMP;
    let ny = (noise(p.baseX * FIELD_NOISE_SCALE + 100, p.baseY * FIELD_NOISE_SCALE + 100 + noiseT) - 0.5) * FIELD_NOISE_AMP;
    p.x = p.baseX + nx;
    p.y = p.baseY + ny;

    p.voidOpacityModifier = 2.0;
    p.highOpacityTeardrop = 0.0;
    p.trailGlow           = 0.0;
    p.seaweedGlow         = 0.0;
    p.seaweedThick        = 0.0;

    if (spineMagSq > 0 && !idle) {
      let toNodeX = p.baseX - tailPt.x;
      let toNodeY = p.baseY - tailPt.y;
      let t = constrain((toNodeX * spineVectorX + toNodeY * spineVectorY) / spineMagSq, 0, 1);
      p.relativeSpinePos = t;

      let nox  = p.baseX - headPt.x;
      let noy  = p.baseY - headPt.y;
      let nFwd = nox * spineDirX + noy * spineDirY;
      let nLat = nox * (-spineDirY) + noy * spineDirX;
      let dFromEdge = 0, isInside = false;
      let bodyW = bodyHalfWidth(t);

      if (nFwd >= 0) {
        let dSq  = nFwd * nFwd + nLat * nLat;
        let er = bodyHalfWidth(1.0);
        let erPad = er + CAVITY_PADDING;
        if (dSq <= erPad * erPad) isInside = true;
        else dFromEdge = sqrt(dSq) - erPad;
      } else {
        let s  = (-nFwd) / COMET_TAIL_LENGTH;
        let te = s*s*s*(s*(s*6-15)+60);
        let er = bodyW * (1 - te * (1 - COMET_TAIL_WIDTH));
        let erPad = er + CAVITY_PADDING;
        if (abs(nLat) <= erPad) isInside = true;
        else dFromEdge = abs(nLat) - erPad;
      }

      if (isInside) {
        p.voidOpacityModifier = 0.0;
      } else if (dFromEdge < GLOW_WALL_WIDTH) {
        let wn = dFromEdge / GLOW_WALL_WIDTH;
        p.highOpacityTeardrop = sin(wn * 180);
      }
    }

    // DYNAMIC FLEXIBLE & RIPPLING TRAIL CALCULATION (Optimized with Pre-computation)
    if (activeTrailGeometry.length > 0) {
      for (let at of activeTrailGeometry) {
        let ox = p.baseX - at.x;
        let oy = p.baseY - at.y;
        let dSq = ox*ox + oy*oy;
        
        // Bounding Box check - bypasses costly Square Roots
        if (dSq < at.r2) {
          let spatial = Math.pow(1 - sqrt(dSq) / at.r, TRAIL_GLOW_FALLOFF);
          let glowHere = spatial * at.glowScale;
          if (glowHere > p.trailGlow) p.trailGlow = glowHere;
        }
      }
      p.trailGlow *= (fieldOpacityScale / PARTICLE_OPACITY_ACTIVE); 
    }

    // SEAWEED EVALUATION (Optimized with Squared Distances)
    if (p.baseY > swZoneY) {
      let bestGlow  = 0.0;
      let bestThick = 0.0;
      for (let si = 0; si < swLen; si += 2) { 
        let sw  = seaweedSamples[si];
        let ox  = p.baseX - sw.x;
        let oy  = p.baseY - sw.y;
        let dSq = ox*ox + oy*oy;
        if (dSq < sw.thickSq) {
          let g = (1 - sqrt(dSq) / sw.thick) * sw.opacity * SW_GLOW_PEAK;
          if (g > bestGlow) { bestGlow = g; bestThick = sw.thick; }
        }
      }
      p.seaweedGlow  = bestGlow;
      p.seaweedThick = bestThick;
    }
  }
}

// ============================================================
// PARTICLE RENDERER (DYNAMIC DENSITY BOOST)
// ============================================================

function drawFieldParticles() {
  noStroke();
  let baseAlpha = fieldOpacityScale * 255;
  
  for (let p of fieldParticles) {
    if (p.voidOpacityModifier <= 0.1) continue;

    let finalAlpha = baseAlpha;
    let pSize = 1.2; 

    if (p.highOpacityTeardrop > 0.05) {
      let targetOp = lerp(100, 255, p.highOpacityTeardrop) * (fieldOpacityScale / PARTICLE_OPACITY_ACTIVE);
      finalAlpha = max(finalAlpha, targetOp);
    }
    
    if (p.trailGlow > 0.0) {
      finalAlpha = max(finalAlpha, p.trailGlow * 255);
    }

    if (p.seaweedGlow > 0.0) {
      fill(255, 255, 255, constrain(p.seaweedGlow * 230, 0, 255));
      circle(p.baseX, p.baseY, max(1.5, lerp(2.0, 5.5, p.seaweedGlow) * (p.seaweedThick / 24)));
      continue;
    }

    let isGlowing = (p.highOpacityTeardrop > 0.05) || (p.trailGlow > 0.05);

    fill(255, 255, 255, constrain(finalAlpha, 0, 255));
    circle(p.x, p.y, pSize);

    if (isGlowing && (floor(p.baseX * 7 + p.baseY * 13) % 2 === 0)) {
      circle(p.x + PARTICLE_SPACING * 0.45, p.y + PARTICLE_SPACING * 0.45, pSize * 0.9);
    }
  }
}

// ============================================================
// FISH GEOMETRY - OPTIMIZED
// ============================================================

function updateKoi() {
  if (koiSpine.length === 0) return;
  let idle = (millis() - lastMoveTime) > IDLE_TIME_MS;
  koiSpine[0].lerp(createVector(KOI.hoverOnly ? constrain(mouseX, 0, width) : mouseX,
                                KOI.hoverOnly ? constrain(mouseY, 0, height) : mouseY), HEAD_FOLLOW);   // SITE INTEGRATION
  for (let i = 1; i < SPINE_LEN; i++) {
    let dir = p5.Vector.sub(koiSpine[i], koiSpine[i-1]);
    if (dir.mag() < 0.001) dir.set(0, 1);
    dir.setMag(SPINE_SEG);
    koiSpine[i] = p5.Vector.add(koiSpine[i-1], dir);
  }
  for (let i = 0; i < SPINE_LEN; i++) {
    let t = i / (SPINE_LEN - 1);
    if (idle) spineAlphas[i] = max(0, spineAlphas[i] - lerp(FADE_RATE_HEAD, FADE_RATE_TAIL, t));
    else      spineAlphas[i] = min(FISH_ALPHA_MAX, spineAlphas[i] + lerp(RESTORE_RATE_HEAD, RESTORE_RATE_TAIL, t));
  }
}

function bodyHalfWidth(t) {
  if (t < 0.10) return map(t, 0.00, 0.10, BODY_SNOUT_W, BODY_HEAD_W);
  if (t < 0.28) return map(t, 0.10, 0.28, BODY_HEAD_W,     BODY_SHOULDER_W);
  if (t < 0.52) return map(t, 0.28, 0.52, BODY_SHOULDER_W, BODY_SHOULDER_W * 0.85);
  if (t < 0.70) return map(t, 0.52, 0.70, BODY_SHOULDER_W * 0.85, BODY_PEDUNCLE_W);
  if (t < 0.83) return map(t, 0.70, 0.83, BODY_PEDUNCLE_W, BODY_PEDUNCLE_W * 0.65);
  return         map(t, 0.83, 1.00, BODY_PEDUNCLE_W * 0.65, BODY_TAIL_W);
}

function drawKoi() {
  if (koiSpine.length < SPINE_LEN) return;
  noStroke();
  let dirs = [];
  for (let i = 0; i < SPINE_LEN; i++) {
    let a = koiSpine[max(0, i-1)];
    let b = koiSpine[min(SPINE_LEN-1, i+1)];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let mag = sqrt(dx*dx + dy*dy);
    if (mag < 0.001) { dx = 1; dy = 0; mag = 1; }
    dirs.push({x: dx/mag, y: dy/mag});
  }

  for (let i = 0; i < SPINE_LEN; i++) {
    let alpha = spineAlphas[i] * FISH_OPACITY_MULT; if (alpha < 2) continue;
    let pt = koiSpine[i];
    let perpX = -dirs[i].y, perpY = dirs[i].x; // OPTIMIZED: Avoid createVector
    let hw = bodyHalfWidth(i/(SPINE_LEN-1));
    let dorsalHW = hw*0.88, ventralHW = hw*1.12;
    let dotCount = max(2, floor((dorsalHW+ventralHW)/1.4));
    for (let d = 0; d < dotCount; d++) {
      let frac = map(d, 0, dotCount-1, 1, -1);
      let so   = frac >= 0 ? frac*dorsalHW : frac*ventralHW;
      let hwMod = hw+0.001;
      let env  = sqrt(max(0,1-(so/hwMod)*(so/hwMod)));
      let dotR = lerp(0.5,1.0,env)*FISH_SIZE;
      if (dotR < 0.4) continue;
      fill(255,255,255, constrain(alpha*lerp(0.12,1.0,env),0,255));
      circle(pt.x+perpX*so, pt.y+perpY*so, dotR*2);
    }
  }

  let pecStart = floor(SPINE_LEN*0.08), pecEnd = floor(SPINE_LEN*0.70);
  let pecRows  = pecEnd-pecStart;
  for (let i = pecStart; i < pecEnd; i++) {
    let alpha = spineAlphas[i]*FISH_OPACITY_MULT; if (alpha < 2) continue;
    let pt = koiSpine[i];
    let perpX = -dirs[i].y, perpY = dirs[i].x;
    let u = (i-pecStart)/(pecRows-1), hw = bodyHalfWidth(i/(SPINE_LEN-1));
    let dSP = sin(u*45);
    for (let side = -1; side <= 1; side += 2) {
      for (let vi = 0; vi < 14; vi++) {
        let v  = vi/15;
        let fx = pt.x+perpX*side*(hw+0.1)+perpX*side*v*100*FISH_SIZE*dSP;
        let fy = pt.y+perpY*side*(hw+0.1)+perpY*side*v*75*FISH_SIZE*dSP;
        let sw = sin(degrees(wagPhase)*0.01+(u*-60)+(v*-50))*((0.5+min(fishSpeed*0.3,5))*v*FISH_SIZE);
        fill(255,255,255, constrain(alpha*lerp(0.12,0.45,sin(v*40))*(1-v*0.15),0,255));
        circle(fx+perpX*side*sw, fy+perpY*side*sw, max(0.4,(lerp(1.1,0,v)*dSP*FISH_SIZE+0.2)*2));
      }
    }
  }

  let dorsalStart = floor(SPINE_LEN*0.30), dorsalEnd = floor(SPINE_LEN*0.77);
  let dorsalRows  = dorsalEnd-dorsalStart;
  for (let i = dorsalStart; i < dorsalEnd; i++) {
    let alpha = spineAlphas[i]*FISH_OPACITY_MULT; if (alpha < 2) continue;
    let pt = koiSpine[i], fwdX = dirs[i].x, fwdY = dirs[i].y;
    let perpX = -fwdY, perpY = fwdX;
    let ni = (i-dorsalStart)/(dorsalRows-1);
    let fHP = sin(ni*150)*50*FISH_SIZE;
    for (let vi = 0; vi < 12; vi++) {
      let v  = vi/11;
      let sr = sin(degrees(wagPhase)*1.5+(ni*130)+(v*-70))*((2+min(fishSpeed,9))*v*FISH_SIZE);
      let fx = pt.x+perpX*sr-fwdX*v*(ni*30+15)*FISH_SIZE-perpY*v*fHP;
      let fy = pt.y+perpY*sr-fwdY*v*(ni*30+15)*FISH_SIZE+perpX*v*fHP;
      fill(255,255,255, constrain(alpha*sin(v*180)*0.6,0,255));
      circle(fx, fy, max(0.4,(lerp(1.4,0.4,v)*sin(ni*180)*FISH_SIZE+0.25)*2));
    }
  }

  let tailIdx = SPINE_LEN-1;
  if (spineAlphas[tailIdx] > 2) {
    let alpha = spineAlphas[tailIdx]*FISH_OPACITY_MULT;
    let pt = koiSpine[tailIdx], fwdX = dirs[tailIdx].x, fwdY = dirs[tailIdx].y;
    let perpX = -fwdY, perpY = fwdX;
    let wagAmp = (WAG_BASE_AMP+min(fishSpeed*WAG_SPEED_SCALE,WAG_MAX_EXTRA))*FISH_SIZE;
    let span = TAIL_LOBE_SPAN*FISH_SIZE, sweep = TAIL_LOBE_SWEEP*FISH_SIZE;
    let notchD = TAIL_NOTCH_DEPTH*FISH_SIZE;
    for (let side = -1; side <= 1; side += 2) {
      for (let ui = 0; ui < TAIL_LOBE_ROWS; ui++) {
        let u = ui/(TAIL_LOBE_ROWS-1);
        let rr = constrain(map(u,0,TAIL_ROOT_GUARD,0,1),0,1);
        for (let vi = 0; vi < TAIL_LOBE_COLS; vi++) {
          let v  = vi/(TAIL_LOBE_COLS-1);
          let lw = sin(u*180)*rr;
          let lat = side*u*span*(0.5+0.5*lw)*rr;
          let back = u*u*sweep+v*(u*sweep*0.8);
          let wo = wagAmp*sin(degrees(wagPhase)+u*WAG_U_FREQ*57.3+v*WAG_V_FREQ*57.3)*u*u*rr;
          
          // OPTIMIZED: Replaced pow() with direct multiplication
          let ns  = 1-Math.exp(-((u/0.22)*(u/0.22)));
          let notchCalc = (lat-side*notchD)/(TAIL_NOTCH_WIDTH*FISH_SIZE);
          let ni2 = 1-Math.exp(-(notchCalc*notchCalc));
          
          if (max(ns,ni2)<0.25) continue;
          let wx = pt.x+perpX*(lat+wo)-fwdX*back;
          let wy = pt.y+perpY*(lat+wo)-fwdY*back;
          let dotR  = lerp(1.4,0.3,u)*lerp(1.2,0.5,v)*max(lw,0.1)*1.5*FISH_SIZE+0.3;
          let dotA  = alpha*(1-Math.pow(u,1.3))*lerp(0.72,0.98,sin(v*180))*max(ns,ni2)*rr;
          fill(255,255,255, constrain(dotA,0,255));
          circle(wx, wy, max(0.4,dotR*2));
        }
      }
    }
  }
}

function windowResized() {
  resizeCanvas(KOI_HOST.clientWidth, KOI_HOST.clientHeight);   // SITE INTEGRATION
  koiSpine = [];
  spineAlphas = [];
  for (let i = 0; i < SPINE_LEN; i++) {
    koiSpine.push(createVector(width/2, height/2));
    spineAlphas.push(KOI.hoverOnly ? 0 : FISH_ALPHA_MAX);
  }
  initField();
  buildStarGrid();
  buildSeaweeds();
}