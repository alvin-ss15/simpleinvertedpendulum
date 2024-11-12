const canvas = document.getElementById('invertedPendulumCanvas');
const ctx = canvas.getContext('2d');

// Constants for the pendulum system
const gravity = 9.81;
const rodLength = 150;
const cartWidth = 80;
const cartHeight = 40;
const damping = 0.02;
const dt = 0.016;
const edgeTimeThreshold = 2;

// Initial PID Controller Coefficients (will be adjusted by sliders)
let Kp = 50;
let Ki = 1;
let Kd = 5;
let integralError = 0;
let convergenceRate = 5;

// Initial states for the cart and pendulum
let cartX = canvas.width / 2; // Start cart at the center
let prevCartX = cartX;
let cartVelocity = 0;
let theta = Math.PI;
let angularVelocity = 0;

// Timer and direction variables for edge handling
let atEdge = false;
let edgeTimer = 0;
let direction = 1;

// Simulation control variables
let isRunning = false;
let animationFrameId = null;

// Convergence Rate and PID Coefficient Sliders
const convergenceRateSlider = document.getElementById('convergenceRateSlider');
const convergenceRateValue = document.getElementById('convergenceRateValue');
const kpSlider = document.getElementById('kpSlider');
const kpValue = document.getElementById('kpValue');
const kiSlider = document.getElementById('kiSlider');
const kiValue = document.getElementById('kiValue');
const kdSlider = document.getElementById('kdSlider');
const kdValue = document.getElementById('kdValue');

// Update convergence rate and PID coefficients based on slider values
convergenceRateSlider.addEventListener('input', (event) => {
    convergenceRate = parseFloat(event.target.value);
    convergenceRateValue.textContent = event.target.value;
});

kpSlider.addEventListener('input', (event) => {
    Kp = parseFloat(event.target.value) * convergenceRate;
    kpValue.textContent = event.target.value;
});

kiSlider.addEventListener('input', (event) => {
    Ki = parseFloat(event.target.value) * convergenceRate;
    kiValue.textContent = event.target.value;
});

kdSlider.addEventListener('input', (event) => {
    Kd = parseFloat(event.target.value) * convergenceRate;
    kdValue.textContent = event.target.value;
});

// Button elements for controlling the simulation
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');

// Start the animation
startButton.addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        animate();
    }
});

// Pause the animation
pauseButton.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
    }
});

// Reset the simulation
resetButton.addEventListener('click', () => {
    resetSimulation();
    draw();
});

function resetSimulation() {
    cartX = canvas.width / 2;
    prevCartX = cartX;
    cartVelocity = 0;
    theta = Math.PI;
    angularVelocity = 0;
    integralError = 0;
    atEdge = false;
    edgeTimer = 0;
    direction = 1;
    isRunning = false;
    cancelAnimationFrame(animationFrameId);
}

// Physics Update for Pendulum Rotation and Cart Translation with PI-D Control
function updatePhysics() {
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    const cartAcceleration = (cartX - prevCartX) / dt;
    prevCartX = cartX;

    const gravitationalTorque = (gravity / rodLength) * sinTheta;
    const dampingTorque = -damping * angularVelocity;
    const cartEffect = -cartAcceleration * cosTheta / rodLength;

    const angularAcceleration = gravitationalTorque + dampingTorque + cartEffect;
    angularVelocity += angularAcceleration * dt;
    theta += angularVelocity * dt;

    const angleError = Math.PI - theta;
    integralError += angleError * dt;

    const controlForce = Kp * angleError + Ki * integralError - Kd * angularVelocity;

    cartVelocity = controlForce * dt * direction;
    cartX += cartVelocity;

    if (cartX <= cartWidth / 2) {
        cartX = cartWidth / 2;
        atEdge = true;
        edgeTimer += dt;
    } else if (cartX >= canvas.width - cartWidth / 2) {
        cartX = canvas.width - cartWidth / 2;
        atEdge = true;
        edgeTimer += dt;
    } else {
        atEdge = false;
        edgeTimer = 0;
    }

    if (atEdge && edgeTimer >= edgeTimeThreshold) {
        direction *= -1;
        edgeTimer = 0;
        atEdge = false;
    }
}

// Render the cart and pendulum
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pivotX = cartX;
    const pivotY = canvas.height / 2;
    const bobX = pivotX + rodLength * Math.sin(theta);
    const bobY = pivotY - rodLength * Math.cos(theta);

    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(cartX - cartWidth / 2, pivotY - cartHeight / 2, cartWidth, cartHeight);

    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(bobX, bobY, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#ff6347';
    ctx.fill();
}

// Handle keyboard input for left/right arrow keys
window.addEventListener('keydown', (event) => {
    const deviationStep = 5; // Amount of deviation per key press
    if (event.key === 'ArrowLeft') {
        cartX -= deviationStep;
    } else if (event.key === 'ArrowRight') {
        cartX += deviationStep;
    }
});

// Animation loop
function animate() {
    if (isRunning) {
        updatePhysics();
        draw();
        animationFrameId = requestAnimationFrame(animate);
    }
}

// Start the animation
resetSimulation();
