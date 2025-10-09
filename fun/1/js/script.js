"use strict";

// Vertical motion with constant acceleration g:
// y(t) = y0 + vy0*t + (1/2)*g*t^2 
// y0: starting height
// vy0: initial upward velocity
// g: acceleration du to gravity (negative since it points down)
// t: time, in seconds

// At top of the jump (also called apex), vertical velocity becomes 0:
// Ta: Time to Apex
// derivative:
// dy/dt = vy0 + g*Ta
// 0 = vy0 + g*Ta
// -g*Ta = vy0

// Height at apex:
// H = y(Ta) = y0 + vy0*Ta + (1/2)*g*Ta^2
// assuming y0 = 0
// H = vy0*Ta + 1/2*g*Ta^2
//  -> replacing vy0 = -g*Ta:
//     H = -g*Ta*Ta + 1/2*g*Ta^2
//     H = (-1/2)*g*Ta^2
// solving for g:
//     -2H / Ta^2  = g
// Hence if we have a set max jump height (H), and a set time to apex (Ta), 
// we can calculate the gravity (downwards acceleration) as:
// const g = -(2 * H) / Math.pow(Ta, 2);
const x0 = 100;
let x = 0;
let y = 300;
let vx = 0;
let vy = 0;
const H = 90 // px
const Ta = 0.35; // s
const g = -(2 * H) / Math.pow(Ta, 2); // px/s^2
const vy0 = -g * Ta; // px/s


// ground line (y0)
const groundY = 300;

let leftDownSince = null
let rightDownSince = null
let leftReleasedSince = null
let rightReleasedSince = null
// px/s horizontal when holding arrow
const maxSpeed = 400;
const speedDeltaFrame = 10
const speedIncCount = 20

function setup(){
  createCanvas(500, 350);
  frameRate(60);
}

function draw(){
  const dt = deltaTime/1000;
  // only allow left right velocity change when on ground
  if (onGround()) {
    leftDownSince = keyIsDown(LEFT_ARROW) ? leftDownSince ?? frameCount : null
    rightDownSince = keyIsDown(RIGHT_ARROW) ? rightDownSince ?? frameCount : null

    // accelerate the longer the arrow is down
    const vxdl = leftDownSince === null ? 0 : -constrain((frameCount - leftDownSince) / speedDeltaFrame, 0, speedIncCount) / speedIncCount * maxSpeed
    const vxdr = rightDownSince === null ? 0 : +constrain((frameCount - rightDownSince) / speedDeltaFrame, 0, speedIncCount) / speedIncCount * maxSpeed
    vx = vxdl + vxdr
    
    // vx = (keyIsDown(LEFT_ARROW) ? -1 : 0 + keyIsDown(RIGHT_ARROW) ? 1 : 0) * speed;
    if (keyIsDown(32)) {
      vy = vy0
    }
  }
  // handle jump physics
  if (keyIsDown(32) || !onGround()) {
    vy += g*dt;
    y  += -vy*dt;
  }
  // apply x velocity, negative
  x += vx*dt;

  // handle collision, reset vy to zero
  if (y > groundY){
    y = groundY;
    vy = 0;
  }

  background(240);
  line(0, groundY + 10, width, groundY + 10);
  // infinite square scroll
  // x = 1200
  // x0 = 100
  // dx = 1100
  // dx/width = 1.375 -> the first block should be 0.375 * width behind 100
  // x default
  // x + 200, x + 400
  // infinite series of positions [100, 300, 500, 700, 900, ...].
  // what we want is a window
  // and we want to project that window to map to the position of x
  // when x = 0, we have [100, 300, 500, 700, 900, ...]
  // when x = 1, we have [99, 299, 499, 699, 899, ...]
  // when x = 2, we have [98, 298, 498, 698, 898, ...]
  // when x = 100, we have [0, 200, 400, 600, 800, ...]
  // when x = 800, we have [-700, -500, -300, -100, 100, 300, 500, 700, ...]
  // f(x, n) = 200*n + 100-x
  // f_visible(x, n) = 200*n + 100-x where f(x, n) >= 0 and f(x, n) < 800
  // 200*n + 100-x >= 0
  // 200n + 100 >= x
  // 200n >= x-100
  // n >= (x-100)/200
  // also:
  // 200*n + 100-x < 800
  // n < (700+x)/200
  
  // for (let rx = x/200; rx < (x+width)/200; rx += 200) {
  //   rect(rx*width, groundY - 50, 50, 50)
  // }
  ellipse(x+x0, y, 24, 24);
}

function onGround(){ return y >= 300 - 0.5; }
