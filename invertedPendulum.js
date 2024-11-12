const canvas = document.getElementById('invertedPendulumCanvas');
const ctx = canvas.getContext('2d');

// Constants for the pendulum system
const gravity = 9.81;
const rodLength = 150;
const cartWidth = 80;
const cartHeight = 40;
const damping = 0.02;
const dt = 0.02;
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
let isRunning = true; // Start running automatically
let animationFrameId = null;

// Trail
const trail = [];
const maxTrailLength = 100; // Maximum trail length

// Convergence Rate and PID Coefficient Sliders
document.getElementById('convergenceRateSlider').addEventListener('input', (event) => {
    convergenceRate = parseFloat(event.target.value);
    document.getElementById('convergenceRateValue').textContent = event.target.value;
});
document.getElementById('kpSlider').addEventListener('input', (event) => {
    Kp = parseFloat(event.target.value) * convergenceRate;
    document.getElementById('kpValue').textContent = event.target.value;
});
document.getElementById('kiSlider').addEventListener('input', (event) => {
    Ki = parseFloat(event.target.value) * convergenceRate;
    document.getElementById('kiValue').textContent = event.target.value;
});
document.getElementById('kdSlider').addEventListener('input', (event) => {
    Kd = parseFloat(event.target.value) * convergenceRate;
    document.getElementById('kdValue').textContent = event.target.value;
});

// Reset button functionality
document.getElementById('resetButton').addEventListener('click', resetSimulation);

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
    isRunning = true;

    trail.length = 10; // Clear trail

    // Draw the initial state of the cart and pendulum
    draw();

    // Automatically start the animation
    animate();

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear trail canvas
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
    const pivotY = 0.3*canvas.height;
    const bobX = pivotX + rodLength * Math.sin(theta);
    const bobY = pivotY - rodLength * Math.cos(theta);

    trail.push({ x: bobX, y: bobY, opacity: 1.0 });
    if (trail.length > maxTrailLength) trail.shift();

    drawTrail();
    ctx.fillStyle = '#47e3ff';
    ctx.fillRect(cartX - cartWidth / 2, pivotY - cartHeight / 2, cartWidth, cartHeight);

    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(bobX, bobY, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#ff6347';
    ctx.fill();
    
}

// Draw fading trail
function drawTrail() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    trail.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 71, 255, ${point.opacity})`;
        ctx.fill();
        point.opacity -= 0.03;
        if (point.opacity < 0) point.opacity = 0;
    });
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

// Automatically start the animation
resetSimulation();
