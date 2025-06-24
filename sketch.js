// VARIÁVEIS PRINCIPAIS
let pizzaiolo;
let gravity = 0.6;
let jumpForce = -12;
let platforms = [];
let pizzas = [];
let spikes = [];
let score = 0;
let lives = 3;
let phase = 3;

const PLATFORM_WIDTH = 120;
const PLATFORM_HEIGHT = 10;
const PLATFORM_SPACING_Y = 60;
const PLATFORM_SPACING_X = 180;

let imgIdle, imgWalk, imgJump, pizzaImg, imgMenu, imgSpike;
let pizzaSound;

let gameState = 'menu';
let startButton, aboutButton;

let highScorePhase = 0;
let highScorePizzas = 0;

function preload() {
  imgIdle = loadImage('player_idle.png');
  imgWalk = loadImage('player_walk.png');
  imgJump = loadImage('player_jump.png');
  pizzaImg = loadImage('pizza.png');
  imgMenu = loadImage('fireplace.png');
  imgSpike = loadImage('spike.png');
  pizzaSound = loadSound('pizza_sound.mp3');
}

function setup() {
  createCanvas(800, 400);
  pizzaiolo = new Pizzaiolo();

  generatePhase();

  startButton = new Button(width / 2 - 60, height / 2, 120, 40, 'Iniciar');
  aboutButton = new Button(width / 2 - 60, height / 2 + 60, 120, 40, 'Sobre');

  highScorePhase = int(localStorage.getItem('highScorePhase')) || 0;
  highScorePizzas = int(localStorage.getItem('highScorePizzas')) || 0;
}

function draw() {
  background(135, 206, 235);

  if (gameState === 'menu') {
    drawMenu();
  } else if (gameState === 'about') {
    drawAbout();
  } else if (gameState === 'game') {
    for (let p of platforms) p.show();
    for (let s of spikes) s.show();

    for (let i = pizzas.length - 1; i >= 0; i--) {
      pizzas[i].show();
      if (pizzas[i].checkCollision(pizzaiolo)) {
        pizzas.splice(i, 1);
        score++;
        if (pizzaSound.isLoaded()) pizzaSound.play();

        if (score > highScorePizzas) {
          highScorePizzas = score;
          localStorage.setItem('highScorePizzas', highScorePizzas);
        }

        if (pizzas.length === 0) {
          phase++;

          if (phase > highScorePhase) {
            highScorePhase = phase;
            localStorage.setItem('highScorePhase', highScorePhase);
          }

          generatePhase();
        }
      }
    }

    for (let s of spikes) {
      if (s.checkCollision(pizzaiolo)) {
        lives--;
        if (lives <= 0) {
          gameState = 'gameOver';
        } else {
          pizzaiolo = new Pizzaiolo();
        }
      }
    }

    pizzaiolo.applyGravity();
    pizzaiolo.checkPlatforms(platforms);
    pizzaiolo.update();
    pizzaiolo.show();

    fill(0);
    textSize(20);
    text(`Fase: ${phase}`, 20, 20);
    text(`Pizzas: ${score}`, 20, 45);
    text(`Vidas: ${lives}`, 20, 70);
  } else if (gameState === 'gameOver') {
    drawGameOver();
  }
}

function keyPressed() {
  if (keyCode === UP_ARROW && pizzaiolo.onGround && gameState === 'game') {
    pizzaiolo.vel.y = jumpForce;
    pizzaiolo.onGround = false;
  }
}

function mousePressed() {
  if (gameState === 'menu') {
    if (startButton.isClicked(mouseX, mouseY)) {
      resetGame();
      gameState = 'game';
    }
    if (aboutButton.isClicked(mouseX, mouseY)) {
      gameState = 'about';
    }
  } else if (gameState === 'about' || gameState === 'gameOver') {
    gameState = 'menu';
  }
}

function drawMenu() {
  background(0);
  imageMode(CORNER);
  image(imgMenu, 0, 0, width, height);
  textAlign(CENTER);
  fill(255);
  textSize(36);
  text('Pizza Platformer', width / 2, 120);
  startButton.show();
  aboutButton.show();
}

function drawAbout() {
  background(255);
  textAlign(CENTER);
  imageMode(CORNER);
  image(imgMenu, 0, 0, width, height);
  fill(255);
  textSize(24);
  text('Jogo desenvolvido por', width / 2, height / 2 - 30);
  text('Lohan Berg Bello Lima', width / 2, height / 2 + 10);
  textSize(16);
  text('Clique para voltar', width / 2, height - 30);
}

function drawGameOver() {
  background(0);
  fill(255);
  textAlign(CENTER);
  textSize(40);
  text('GAME OVER', width / 2, height / 2 - 40);
  textSize(20);
  text(`Recorde de Fase: ${highScorePhase}`, width / 2, height / 2 + 20);
  text(`Recorde de Pizzas: ${highScorePizzas}`, width / 2, height / 2 + 50);
  text('Clique para voltar ao menu', width / 2, height / 2 + 80);
}

function resetGame() {
  score = 0;
  lives = 3;
  phase = 1;
  pizzaiolo = new Pizzaiolo();
  generatePhase();
}

function generatePhase() {
  platforms = [];
  pizzas = [];
  spikes = [];
  generateEvenlySpacedPlatforms(6);
  if (phase >= 2) placeSpikes(2); // Reduzido para 2 espinhos
  placePizzasOnPlatforms(4);
}

class Spike {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 25;
    this.h = 25;
  }
  show() {
    image(imgSpike, this.x, this.y, this.w, this.h);
  }
  checkCollision(player) {
    return (
      player.pos.x + player.size > this.x &&
      player.pos.x < this.x + this.w &&
      player.pos.y + player.size > this.y &&
      player.pos.y < this.y + this.h
    );
  }
}

class Pizzaiolo {
  constructor() {
    this.pos = createVector(50, 0);
    this.vel = createVector(0, 0);
    this.size = 60;
    this.onGround = false;
    this.facing = 1;
    this.state = 'idle';
  }
  applyGravity() {
    this.vel.y += gravity;
  }
  update() {
    let moving = false;
    if (keyIsDown(LEFT_ARROW)) {
      this.pos.x -= 4;
      this.facing = -1;
      moving = true;
    }
    if (keyIsDown(RIGHT_ARROW)) {
      this.pos.x += 4;
      this.facing = 1;
      moving = true;
    }
    this.pos.add(this.vel);
    this.pos.x = constrain(this.pos.x, 0, width - this.size);
    if (this.pos.y > height + 50) {
      lives--;
      if (lives <= 0) {
        gameState = 'gameOver';
      } else {
        this.pos = createVector(50, 0);
        this.vel = createVector(0, 0);
      }
    }
    this.state = !this.onGround ? 'jump' : moving ? 'walk' : 'idle';
  }
  checkPlatforms(platforms) {
    this.onGround = false;
    for (let p of platforms) {
      if (!p.visible) continue;
      let futureBottom = this.pos.y + this.size + this.vel.y;
      let onTop = this.pos.y + this.size <= p.y;
      let withinX = this.pos.x + this.size > p.x && this.pos.x < p.x + p.w;
      if (onTop && futureBottom >= p.y && withinX) {
        this.pos.y = p.y - this.size;
        this.vel.y = 0;
        this.onGround = true;
        if (p.disappearing && !p.timerStarted) {
          p.startTimer();
        }
      }
    }
  }
  show() {
    push();
    translate(this.pos.x + this.size / 2, this.pos.y + this.size);
    scale(this.facing, 1);
    imageMode(CENTER);
    let imgToUse =
      this.state === 'jump'
        ? imgJump
        : this.state === 'walk'
        ? imgWalk
        : imgIdle;
    let imgHeight = imgToUse.height;
    let drawHeight = this.size;
    let ratio = drawHeight / imgHeight;
    image(imgToUse, 0, -drawHeight / 2, imgToUse.width * ratio, drawHeight);
    pop();
  }
}

class Platform {
  constructor(x, y, disappearing = false) {
    this.x = x;
    this.y = y;
    this.w = PLATFORM_WIDTH;
    this.h = PLATFORM_HEIGHT;
    this.visible = true;
    this.disappearing = disappearing;
    this.timer = 0;
    this.timerStarted = false;
  }
  startTimer() {
    this.timerStarted = true;
  }
  update() {
    if (this.disappearing && this.timerStarted && this.visible) {
      this.timer++;
      if (this.timer > 120) {
        this.visible = false;
      }
    }
  }
  show() {
    this.update();
    if (!this.visible) return;
    if (this.disappearing && this.timer > 60) {
      fill(255, 100, 100, frameCount % 30 < 15 ? 255 : 100);
    } else {
      fill(100);
    }
    rect(this.x, this.y, this.w, this.h);
  }
}

class Pizza {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 16;
  }
  show() {
    imageMode(CENTER);
    image(pizzaImg, this.x, this.y, this.r * 2, this.r * 2);
  }
  checkCollision(player) {
    let px = player.pos.x + player.size / 2;
    let py = player.pos.y + player.size / 2;
    let d = dist(this.x, this.y, px, py);
    return d < this.r + player.size / 2;
  }
}

class Button {
  constructor(x, y, w, h, label) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.label = label;
  }
  show() {
    fill(255, 255, 255, 200);
    rect(this.x, this.y, this.w, this.h, 10);
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(this.label, this.x + this.w / 2, this.y + this.h / 2);
  }
  isClicked(mx, my) {
    return (
      mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h
    );
  }
}

function generateEvenlySpacedPlatforms(count) {
  platforms = [];
  platforms.push(new Platform(0, height - 20));
  let startY = height - 80;
  let lastX = 50; // próximo do spawn
  for (let i = 0; i < count; i++) {
    let minX = max(0, lastX - PLATFORM_SPACING_X);
    let maxX = min(width - PLATFORM_WIDTH, lastX + PLATFORM_SPACING_X);
    let x = random(minX, maxX);
    let y = startY - i * PLATFORM_SPACING_Y;
    let disappearing = phase >= 3 && random() < 0.5;
    platforms.push(new Platform(x, y, disappearing));
    lastX = x;
  }
}

function placePizzasOnPlatforms(pizzaCount) {
  pizzas = [];
  let validPlatforms = platforms.slice(1);
  shuffle(validPlatforms, true);

  let fallbackFound = false;

  for (
    let i = 0;
    i < validPlatforms.length && pizzas.length < pizzaCount;
    i++
  ) {
    let p = validPlatforms[i];

    // Testa se tem spike sobre a plataforma
    let hasSpike = spikes.some(s => s.x >= p.x && s.x < p.x + PLATFORM_WIDTH);

    if (!p.visible || p.disappearing || hasSpike) {
      if (!fallbackFound) {
        // Marca como fallback para garantir que ao menos uma pizza apareça
        fallbackFound = true;
        let x = p.x + PLATFORM_WIDTH / 2;
        let y = p.y - 14;
        pizzas.push(new Pizza(x, y));
      }
      continue;
    }

    let x = p.x + PLATFORM_WIDTH / 2;
    let y = p.y - 14;
    pizzas.push(new Pizza(x, y));
  }

  // Se ainda assim nenhuma foi criada, forçamos uma em qualquer plataforma visível
  if (pizzas.length === 0 && platforms.length > 1) {
    let fallbackPlatform = platforms.find(p => p.visible);
    if (fallbackPlatform) {
      let x = fallbackPlatform.x + PLATFORM_WIDTH / 2;
      let y = fallbackPlatform.y - 14;
      pizzas.push(new Pizza(x, y));
    }
  }
}

function placeSpikes(spikeCount) {
  spikes = [];
  let availablePlatforms = platforms.filter(p => p.y < height - 20);
  shuffle(availablePlatforms, true);
  for (let i = 0; i < spikeCount && i < availablePlatforms.length; i++) {
    let p = availablePlatforms[i];
    let x = random(p.x, p.x + p.w - 40);
    let y = p.y - 40;
    spikes.push(new Spike(x, y));
  }
}
