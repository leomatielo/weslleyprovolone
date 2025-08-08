// Jogo protótipo: Wéslley & Provolone (Canvas 2D)

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const statusEl = document.getElementById('status');

// Mundo básico
const GRAV = 0.6;
const FRICTION = 0.85;
const GROUND_Y = H - 60; // altura do chão
const LEVEL_END_X = W - 40;

// Carrega a imagem do Wéslley
const weslleyImg = new Image();
weslleyImg.src = 'assets/weslley.jpg'; // <-- AQUI inserimos a imagem do Wéslley

// Player (Wéslley)
const player = {
  x: 60, y: GROUND_Y - 64,
  w: 48, h: 64,
  vx: 0, vy: 0,
  onGround: false,
  speed: 0.9,
  jump: 12
};

// Provolone (IA simples que tenta fugir para a direita, pulando obstáculos)
const cheese = {
  x: 180, y: GROUND_Y - 36,
  r: 18,
  vx: 2.2,
  vy: 0,
  onGround: false
};

// Plataformas simples
const platforms = [
  {x: 120, y: GROUND_Y - 18, w: 120, h: 18},
  {x: 300, y: GROUND_Y - 70, w: 100, h: 18},
  {x: 460, y: GROUND_Y - 110, w: 120, h: 18},
  {x: 620, y: GROUND_Y - 50, w: 100, h: 18}
];

let keys = {};
let gameOver = false;
let message = '';

document.addEventListener('keydown', (e)=>{
  keys[e.key.toLowerCase()] = true;
  if(e.key === ' '){ keys[' '] = true; }
  if(e.key.toLowerCase() === 'r') reset();
});

document.addEventListener('keyup', (e)=>{
  keys[e.key.toLowerCase()] = false;
  if(e.key === ' '){ keys[' '] = false; }
});

function reset(){
  player.x = 60; player.y = GROUND_Y - 64; player.vx=0; player.vy=0; player.onGround=false;
  cheese.x = 180; cheese.y = GROUND_Y - 36; cheese.vx = 2.2; cheese.vy = 0; cheese.onGround=false;
  gameOver = false; message = 'Pegue o provolone antes dele fugir!';
  statusEl.textContent = message;
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh){
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// Física do player/plataformas
function applyPhysics(entity, isPlayer){
  entity.vy += GRAV;
  entity.y += entity.vy;
  entity.onGround = false;

  // Chão
  if(entity.y + (isPlayer ? entity.h : entity.r*2) > GROUND_Y){
    entity.y = GROUND_Y - (isPlayer ? entity.h : entity.r*2);
    entity.vy = 0;
    entity.onGround = true;
  }

  // Plataformas (colisão apenas por cima, simples)
  for(const p of platforms){
    const ew = isPlayer ? entity.w : entity.r*2;
    const eh = isPlayer ? entity.h : entity.r*2;
    if(rectsOverlap(entity.x, entity.y, ew, eh, p.x, p.y, p.w, p.h)){
      // Se está caindo e veio de cima
      if(entity.vy >= 0 && entity.y + eh - entity.vy <= p.y + 4){
        entity.y = p.y - eh;
        entity.vy = 0;
        entity.onGround = true;
      }
    }
  }

  // Movimento horizontal
  entity.x += entity.vx;
  if(isPlayer){
    // Atrito leve
    entity.vx *= FRICTION;
  }
  // Limites
  if(entity.x < 0) entity.x = 0;
  if(isPlayer){
    if(entity.x + entity.w > W) entity.x = W - entity.w;
  } else {
    if(entity.x + entity.r*2 > W) entity.x = W - entity.r*2;
  }
}

// Entrada do jogador
function handleInput(){
  if(keys['arrowleft'] || keys['a']) player.vx -= player.speed;
  if(keys['arrowright'] || keys['d']) player.vx += player.speed;
  const jumpPressed = keys['arrowup'] || keys['w'] || keys[' '];
  if(jumpPressed && player.onGround){
    player.vy = -player.jump;
    player.onGround = false;
  }
}

// IA do Provolone: corre para a direita e tenta pular quando se aproxima de plataformas mais altas
function cheeseAI(){
  // Move sempre para a direita
  cheese.vx = 2.2;

  // Se estiver perto de uma plataforma "subida", tenta pular
  for(const p of platforms){
    // Se a plataforma está à frente e um pouco mais alta
    const ahead = p.x - (cheese.x + cheese.r*2);
    const heightDiff = (p.y) - (cheese.y + cheese.r*2);
    if(ahead > 0 && ahead < 40 && heightDiff < -6 && cheese.onGround){
      cheese.vy = -10.5; // pulo
      cheese.onGround = false;
      break;
    }
  }
}

// Detecção de vitória/derrota
function checkWinLose(){
  // Vitória: se o retângulo do player tocar o "círculo" do queijo
  const dx = (cheese.x + cheese.r) - (player.x + player.w/2);
  const dy = (cheese.y + cheese.r) - (player.y + player.h/2);
  const dist = Math.hypot(dx, dy);
  if(dist < cheese.r + Math.max(player.w, player.h)/3){
    gameOver = true;
    message = 'Você pegou o provolone! 🎉';
    statusEl.textContent = message;
  }
  // Derrota: se o queijo chegar ao fim da fase
  if(cheese.x + cheese.r*2 >= LEVEL_END_X){
    gameOver = true;
    message = 'O provolone escapou! 😭 Aperte R para tentar de novo.';
    statusEl.textContent = message;
  }
}

// Desenho
function draw(){
  ctx.clearRect(0,0,W,H);

  // Chão
  ctx.fillStyle = '#6cc24a';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(0, GROUND_Y+16, W, H - (GROUND_Y+16));

  // Plataformas
  ctx.fillStyle = '#6b8e23';
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });

  // Player (Wéslley) com imagem
  if(weslleyImg.complete){
    ctx.drawImage(weslleyImg, player.x, player.y, player.w, player.h);
  } else {
    // fallback retângulo
    ctx.fillStyle = '#222';
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }

  // Provolone (desenha um queijo redondinho)
  // corpo
  ctx.beginPath();
  ctx.arc(cheese.x + cheese.r, cheese.y + cheese.r, cheese.r, 0, Math.PI*2);
  ctx.fillStyle = '#ffd166';
  ctx.fill();
  // "casca"
  ctx.beginPath();
  ctx.arc(cheese.x + cheese.r, cheese.y + cheese.r, cheese.r, -Math.PI*0.1, Math.PI*1.1);
  ctx.strokeStyle = '#b5651d';
  ctx.lineWidth = 6;
  ctx.stroke();
  // "furinhos"
  ctx.fillStyle = '#e0a84f';
  for(let i=0;i<4;i++){
    const fx = cheese.x + 6 + i*8;
    const fy = cheese.y + 6 + (i%2)*8;
    ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, Math.PI*2); ctx.fill();
  }

  // Linha de chegada
  ctx.fillStyle = '#333';
  ctx.fillRect(LEVEL_END_X, GROUND_Y-80, 6, 80);
  for(let i=0;i<8;i++){
    ctx.fillStyle = i%2? '#fff':'#000';
    ctx.fillRect(LEVEL_END_X-14, GROUND_Y-80 + i*10, 14, 10);
  }
}

function loop(){
  if(!gameOver){
    handleInput();
    cheeseAI();
    applyPhysics(player, true);
    applyPhysics(cheese, false);
    checkWinLose();
  }
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
