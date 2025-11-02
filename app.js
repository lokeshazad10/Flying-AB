const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let width, height;
function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Load assets
const birdImg = new Image();
birdImg.src = "./assets/Flying_AB.png"; // 👈 your custom bird

const pipeImg = new Image();
pipeImg.src = "./assets/pillar.png"; // 👈 your custom pillar

const bgImg = new Image();
bgImg.src = "./assets/game-bg.png"; //custom background

const bgMusic = new Audio("./assets/bg-song.mp3"); // 👈 background music
bgMusic.loop = true;

const hitSound = new Audio("./assets/hit-sound.mp3"); // 👈 sound for collision

// Game variables
let frames = 0;
// Adjust physics based on device
const isMobile = window.innerWidth < 768;

// Slightly slower physics on mobile
const gravity = isMobile ? 0.18 : 0.25;
const jump = isMobile ? 5 : 6;
const pipeSpeedRatio = isMobile ? 0.0028 : 0.004;

let score = 0;
let gameRunning = false;
let gameOverState = false;

const bird = {
  x: width * 0.2,
  y: height / 2,
  velocity: 0,
  radius: height * 0.03,
  draw() {
    const birdSize = height * 0.5;
    if (birdImg.complete) {
      ctx.drawImage(
        birdImg,
        this.x - birdSize / 2,
        this.y - birdSize / 2,
        birdSize,
        birdSize
      );
    } else {
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  flap() {
    this.velocity = -jump;
  },
  update() {
    this.velocity += gravity;
    this.y += this.velocity;
    if (this.y + this.radius > height - height * 0.1) {
      this.y = height - height * 0.1 - this.radius;
      triggerGameOver();
    }
    if (this.y - this.radius < 0) {
      triggerGameOver();
    }
  },
};

// Pipes
const pipes = [];
const pipeWidthRatio = 0.1;
// const pipeSpeedRatio = 0.004;

function getCurrentGap() {
  if (score < 100) return height * 0.3;
  if (score < 200) return height * 0.25;
  if (score < 300) return height * 0.2;
  if (score < 500) return height * 0.17;
  return height * 0.14;
}

function createPipe() {
  const gap = getCurrentGap();
  const topHeight = Math.random() * (height / 2);
  pipes.push({
    x: width,
    top: topHeight,
    bottom: topHeight + gap,
    passed: false,
  });
}

function drawPipes() {
  const pipeWidth = width * pipeWidthRatio;
  pipes.forEach((pipe) => {
    if (pipeImg.complete) {
      // Top pipe (flipped)
      ctx.save();
      ctx.translate(pipe.x + pipeWidth / 2, pipe.top);
      ctx.scale(1, -1);
      ctx.drawImage(pipeImg, -pipeWidth / 2, 0, pipeWidth, height);
      ctx.restore();

      // Bottom pipe
      ctx.drawImage(pipeImg, pipe.x, pipe.bottom, pipeWidth, height);
    } else {
      // fallback simple pipes
      ctx.fillStyle = "#228B22";
      ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
      ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, height - pipe.bottom);
    }
  });
}

function updatePipes() {
  const pipeSpeed = width * pipeSpeedRatio;
  if (frames % (isMobile ? 120 : 100) === 0) createPipe();

  pipes.forEach((pipe, i) => {
    pipe.x -= pipeSpeed;
    const pipeWidth = width * pipeWidthRatio;

    // Collision detection
    if (
      bird.x + bird.radius > pipe.x &&
      bird.x - bird.radius < pipe.x + pipeWidth &&
      (bird.y - bird.radius < pipe.top || bird.y + bird.radius > pipe.bottom)
    ) {
      triggerGameOver();
    }

    // Scoring
    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
      score++;
      pipe.passed = true;
      document.getElementById("score").innerText = `Score: ${score}`;
    }

    // Remove old pipes
    if (pipe.x + pipeWidth < 0) pipes.splice(i, 1);
  });
}

function drawGround() {
  ctx.fillStyle = "#ff2600ff";
  ctx.fillRect(0, height - height * 0.1, width, height * 0.1);
}

// Game Over Scene

function triggerGameOver() {
  if (gameOverState) return;
  gameOverState = true;
  gameRunning = false;
  bgMusic.pause();
  hitSound.currentTime = 0;
  hitSound.play();

  // Show scorecard
  const gameOverScreen = document.getElementById("gameOverScreen");
  const finalScore = document.getElementById("finalScore");
  finalScore.innerText = `Score: ${score}`;
  gameOverScreen.style.display = "flex";
}

function resetGame() {
  // Hide the Game Over UI
  const gameOverScreen = document.getElementById("gameOverScreen");
  gameOverScreen.style.display = "none";

  // Reset main variables
  pipes.length = 0;
  bird.y = height / 2;
  bird.velocity = 0;
  score = 0;
  frames = 0;
  gameOverState = false;
  gameRunning = true;

  // Reset score display
  document.getElementById("score").innerText = "Score: 0";

  // Reset and start background music
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {
    console.log(
      "Audio autoplay prevented — will play after next user interaction."
    );
  });

  // Force immediate frame render
  requestAnimationFrame(loop);
}

//custom bg
let bgX = 0;
function drawBackground() {
  const speed = width * (isMobile ? 0.001 : 0.0015);
  bgX -= speed;
  if (bgX <= -width) bgX = 0;

  if (bgImg.complete) {
    ctx.drawImage(bgImg, bgX, 0, width, height);
    ctx.drawImage(bgImg, bgX + width, 0, width, height);
  } else {
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, width, height);
  }
}

function loop() {
  drawBackground(); // 👈 use this instead of static background
  //   ctx.clearRect(0, 0, width, height);
  drawGround();
  bird.draw();

  if (gameRunning) {
    bird.update();
    updatePipes();
    drawPipes();
  } else if (gameOverState) {
    drawGameOver();
  } else {
    // Show "Tap to Start"
    ctx.fillStyle = "#fff";
    ctx.font = `${height * 0.05}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("Press SPACE or TAP to Start", width / 2, height / 2);
  }

  frames++;
  requestAnimationFrame(loop);
}

// Controls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    if (!gameRunning && !gameOverState) resetGame();
    if (gameRunning && !gameOverState) bird.flap();
  }
});

document.addEventListener("touchstart", () => {
  if (!gameRunning && !gameOverState) resetGame();
  if (gameRunning && !gameOverState) bird.flap();
});

loop();
document.getElementById("restartBtn").addEventListener("click", () => {
  resetGame();
});
