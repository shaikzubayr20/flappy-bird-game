const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Load sound effects
const flapSound = new Audio('data/flap-101soundboards.mp3');
const pointSound = new Audio('data/point-101soundboards.mp3');
const hitSound = new Audio('data/swoosh-101soundboards.mp3');
const passSound = new Audio('data/swoosh-101soundboards.mp3');
const gameOverSound = new Audio('data/gameover.mp3'); // New game over sound

// Ensure all sounds are set to full volume and are not muted
[flapSound, pointSound, hitSound, passSound, gameOverSound].forEach(sound => {
    sound.volume = 1.0;
    sound.muted = false;
    sound.onerror = function() {
        console.error(`Failed to load sound: ${sound.src}`);
    };
});

// Declare variables that will be used later
let bird;
let pipes = [];
let score = 0;
let gameLoop;
let isGameOver = false;
let cloudImage, cloudX1, cloudX2;

// Load the cloud image and set initial positions
cloudImage = new Image();
cloudImage.src = 'data/pngwing.com (13).png'; // Update path if necessary
cloudImage.onload = function() {
    cloudX1 = 0;
    cloudX2 = canvas.width;
};

function adjustCanvasSize() {
    if (window.innerWidth > window.innerHeight) {
        canvas.width = window.innerWidth * 0.8; // 80% of the screen width
        canvas.height = window.innerHeight * 0.6; // 60% of the screen height
    } else {
        canvas.width = window.innerWidth * 0.9; // 90% of the screen width
        canvas.height = window.innerHeight * 0.8; // 80% of the screen height
    }
    resetGameElements();
}

function resetGameElements() {
    bird = {
        x: 50,
        y: canvas.height / 2,
        width: 60,
        height: 45,
        velocity: 0,
        gravity: 0.5,
        lift: -10,
        flapSpeed: 0,
        flapDirection: 1
    };

    pipes = [];
    score = 0;
    scoreElement.textContent = score;
    isGameOver = false;

    generateInitialPipes();
}

function generateInitialPipes() {
    const gap = 150;
    let pipeDistance = canvas.width / 2;

    for (let i = 0; i < 3; i++) {
        let pipeTop = Math.random() * (canvas.height - gap - 100) + 50;
        pipes.push({
            x: canvas.width + i * pipeDistance,
            top: pipeTop,
            bottom: pipeTop + gap,
            width: 50,
            counted: false
        });
    }
}

adjustCanvasSize();
window.addEventListener('resize', adjustCanvasSize);

// Load the bird image
const birdImage = new Image();
birdImage.src = 'data/pngegg (5).png';

birdImage.onload = function() {
    startGame();
};

birdImage.onerror = function() {
    console.error("Failed to load the bird image.");
};

function drawClouds() {
    // Draw the clouds
    ctx.drawImage(cloudImage, cloudX1, 50, canvas.width, cloudImage.height * (canvas.width / cloudImage.width));
    ctx.drawImage(cloudImage, cloudX2, 100, canvas.width, cloudImage.height * (canvas.width / cloudImage.width));

    // Move the clouds to the left
    cloudX1 -= 1;
    cloudX2 -= 1;

    // Reset clouds when they go off screen
    if (cloudX1 + canvas.width <= 0) cloudX1 = canvas.width;
    if (cloudX2 + canvas.width <= 0) cloudX2 = canvas.width;
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.velocity * 0.05);
    ctx.drawImage(birdImage, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.restore();

    bird.flapSpeed += 0.2 * bird.flapDirection;
    if (bird.flapSpeed > 5 || bird.flapSpeed < -5) {
        bird.flapDirection *= -1;
    }
    bird.y += bird.flapSpeed * 0.1;
}

function drawPipes() {
    pipes.forEach(pipe => {
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
        ctx.fillRect(pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom);
    });
}

function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if (bird.y + bird.height / 2 > canvas.height) {
        bird.y = canvas.height - bird.height / 2;
        bird.velocity = 0;
    }

    if (bird.y - bird.height / 2 < 0) {
        bird.y = bird.height / 2;
        bird.velocity = 0;
    }
}

function updatePipes() {
    const pipeSpacing = canvas.width / 2;

    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeSpacing) {
        let gap = 150;
        let pipeTop = Math.random() * (canvas.height - gap - 100) + 50;
        pipes.push({
            x: canvas.width,
            top: pipeTop,
            bottom: pipeTop + gap,
            width: 50,
            counted: false
        });
    }

    pipes.forEach(pipe => {
        pipe.x -= 2;

        // Check if the bird successfully passed through the pipe
        if (!pipe.counted && pipe.x + pipe.width < bird.x - bird.width / 2) {
            score++;
            scoreElement.textContent = score;
            pipe.counted = true;

            // Play point sound when passing through pipes
            pointSound.play().catch(error => {
                console.error("Error playing point sound:", error);
            });
        }

        // Check for collision
        if (bird.x + bird.width / 2 > pipe.x && bird.x - bird.width / 2 < pipe.x + pipe.width) {
            if (bird.y - bird.height / 2 < pipe.top || bird.y + bird.height / 2 > pipe.bottom) {
                gameOver();
            }
        }
    });

    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px Arial';
    ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 40);

    // Play hit sound on game over
    hitSound.play();

    // Play game over sound
    gameOverSound.play().catch(error => {
        console.error("Error playing game over sound:", error);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawClouds(); // Draw clouds first as background
    drawBird();
    drawPipes();
    updateBird();
    updatePipes();
}

function startGame() {
    // Stop game over sound if it is playing
    gameOverSound.pause();
    gameOverSound.currentTime = 0; // Reset the sound to the beginning

    resetGameElements();
    gameLoop = setInterval(draw, 20);
}

document.addEventListener('keydown', event => {
    if (event.code === 'Space') {
        if (isGameOver) {
            startGame();
        } else {
            bird.velocity = bird.lift;
            flapSound.play().catch(error => {
                console.error("Error playing flap sound:", error);
            });
        }
    }
});

document.addEventListener('keyup', event => {
    if (event.code === 'Space') {
        bird.velocity = 0;
    }
});
