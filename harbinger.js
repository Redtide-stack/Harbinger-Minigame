const gameContainer = document.getElementById('game-container');
const blankCircle = document.getElementById('blank-circle');
const bar = document.getElementById('bar');
const jumpscareContainer = document.getElementById('jumpscare-container');

const cursor = document.createElement('div');
cursor.id = 'cursor';
document.body.appendChild(cursor);

const mainTheme = new Audio('');
const jumpscareSound = new Audio('https://codehs.com/uploads/4a29e07fd52e0344d572536e1d9016ac');
mainTheme.loop = true;
mainTheme.play();

let barWidth = 250; 
const barDecreaseRate = 1; 
const rapidBarDecreaseRate = 4;
const slowerBarDecreaseRate = 0.5; // Even slower bar decrease rate for the invisibility period
const intervalTime = 100; // Interval time (ms) for the game loop

const jitterAmount = 6; // Amount of jitter in pixels
const jitterFrequency = 50; // Frequency of jitter in milliseconds

let phase1Duration = 15000; // Phase 1 duration in milliseconds (15 seconds)
let phaseDuration = 20000; // Each subsequent phase duration in milliseconds (20 seconds)
let gameStartTime = Date.now();

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let redCircles = []; // Array to hold red circles
let gameStarted = false;
let isInvisible = false;
let invisibleTimeout;
let currentPhase = 1; // Starting phase

// Function to get cursor position changes
function updateCursorPosition(event) {
    cursorX += event.movementX;
    cursorY += event.movementY;

    // Ensure the cursor stays within the window bounds
    cursorX = Math.max(0, Math.min(window.innerWidth - cursor.offsetWidth, cursorX));
    cursorY = Math.max(0, Math.min(window.innerHeight - cursor.offsetHeight, cursorY));

    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    updateBar({ x: cursorX + cursor.offsetWidth / 2, y: cursorY + cursor.offsetHeight / 2 });
}

// Function to check if the cursor is inside a circle
function isCursorInsideCircle(cursorPos, circleElement) {
    const circleRect = circleElement.getBoundingClientRect();
    const circleCenter = {
        x: circleRect.left + circleRect.width / 2,
        y: circleRect.top + circleRect.height / 2
    };
    const distance = Math.sqrt(
        Math.pow(cursorPos.x - circleCenter.x, 2) +
        Math.pow(cursorPos.y - circleCenter.y, 2)
    );
    return distance < (circleRect.width / 2);
}

// Function to displace the cursor position and the circles
function displaceCursorAndCircles() {
    if (!gameStarted) return; // Only displace after game starts

    const edge = Math.floor(Math.random() * 4); // Randomly choose an edge: 0 = top, 1 = right, 2 = bottom, 3 = left

    switch (edge) {
        case 0: // Top edge
            cursorX = Math.random() * (window.innerWidth - cursor.offsetWidth);
            cursorY = 0;
            break;
        case 1: // Right edge
            cursorX = window.innerWidth - cursor.offsetWidth;
            cursorY = Math.random() * (window.innerHeight - cursor.offsetHeight);
            break;
        case 2: // Bottom edge
            cursorX = Math.random() * (window.innerWidth - cursor.offsetWidth);
            cursorY = window.innerHeight - cursor.offsetHeight;
            break;
        case 3: // Left edge
            cursorX = 0;
            cursorY = Math.random() * (window.innerHeight - cursor.offsetHeight);
            break;
    }

    const blankCircleX = Math.random() * (window.innerWidth - blankCircle.offsetWidth);
    const blankCircleY = Math.random() * (window.innerHeight - blankCircle.offsetHeight);

    // Add class for smooth transition
    cursor.classList.add('teleporting');
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    blankCircle.classList.add('teleporting');
    blankCircle.style.left = `${blankCircleX}px`;
    blankCircle.style.top = `${blankCircleY}px`;

    // Remove the teleporting class after the transition duration
    setTimeout(() => {
        cursor.classList.remove('teleporting');
        blankCircle.classList.remove('teleporting');
    }, 50); // Faster transition duration (50ms)

    // Update the bar status immediately after teleporting
    updateBar({ x: cursorX + cursor.offsetWidth / 2, y: cursorY + cursor.offsetHeight / 2 });
}

// Function to update the bar based on cursor position
function updateBar(cursorPos) {
    let isOverRedCircle = false;
    for (let redCircle of redCircles) {
        if (isCursorInsideCircle(cursorPos, redCircle)) {
            cursor.classList.add('red');
            bar.style.backgroundColor = 'red';
            barWidth -= rapidBarDecreaseRate; // Rapid bar decrease rate for hovering over the red circle
            isOverRedCircle = true;
            if (!isInvisible) {
                bar.style.backgroundColor = 'maroon';
            }
            break;
        }
    }

    if (!isOverRedCircle) {
        if (isCursorInsideCircle(cursorPos, blankCircle)) {
            cursor.classList.remove('red');
            bar.style.backgroundColor = 'white';
            barWidth = Math.min(barWidth + 5, 250); // Regain width more slowly
        } else {
            cursor.classList.add('red');
            bar.style.backgroundColor = 'red';
            barWidth -= isInvisible ? slowerBarDecreaseRate : barDecreaseRate; // Drain bar when cursor is outside the target circle
        }
    }

    bar.style.width = `${barWidth}px`;

    if (barWidth <= 0) {
        triggerJumpscare();
    }
}

// Function to reset the game
function resetGame() {
    barWidth = 250; // Reset bar width to the smaller value
    bar.style.width = `${barWidth}px`;
    bar.style.backgroundColor = 'white';
    gameStartTime = Date.now();
    currentPhase = 1;
    redCircles.forEach(circle => circle.remove());
    redCircles = [];
    applyPhaseChanges();
}

// Function to apply jitter to the cursor
function applyJitter() {
    const jitterX = (Math.random() - 0.5) * jitterAmount * 2;
    const jitterY = (Math.random() - 0.5) * jitterAmount * 2;

    cursorX += jitterX;
    cursorY += jitterY;

    // Ensure the cursor stays within the window bounds
    cursorX = Math.max(0, Math.min(window.innerWidth - cursor.offsetWidth, cursorX));
    cursorY = Math.max(0, Math.min(window.innerHeight - cursor.offsetHeight, cursorY));

    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    updateBar({ x: cursorX + cursor.offsetWidth / 2, y: cursorY + cursor.offsetHeight / 2 });
}

// Function to trigger the jumpscare
function triggerJumpscare() {
    mainTheme.pause(); // Stop the main theme
    mainTheme.currentTime = 0; // Reset the main theme to the start

    jumpscareContainer.style.display = 'flex';
    setTimeout(() => {
        location.reload();
    }, 1000); // Adjust the delay as needed
}

// Function to handle winning the game
function handleWin() {
    alert("You won?! 0_o");
    window.close();
}

// Function to request pointer lock
function requestPointerLock() {
    gameContainer.requestPointerLock = gameContainer.requestPointerLock || gameContainer.mozRequestPointerLock || gameContainer.webkitRequestPointerLock;
    gameContainer.requestPointerLock();
}

// Function to handle pointer lock change events
function pointerLockChange() {
    if (document.pointerLockElement === gameContainer || document.mozPointerLockElement === gameContainer || document.webkitPointerLockElement === gameContainer) {
        // Pointer lock is active
        document.addEventListener('mousemove', updateCursorPosition, false);
    } else {
        // Pointer lock is inactive
        document.removeEventListener('mousemove', updateCursorPosition, false);
    }
}

// Function to check the game duration and change phases
function checkGameDuration() {
    const elapsedTime = Date.now() - gameStartTime;
    if ((currentPhase === 1 && elapsedTime >= phase1Duration) || (currentPhase > 1 && elapsedTime >= phaseDuration)) {
        currentPhase++;
        gameStartTime = Date.now();
        if (currentPhase > 7) {
            // Player wins the game
            handleWin();
            return;
        }
        applyPhaseChanges();
    }
}

// Function to apply phase changes
function applyPhaseChanges() {
    const blankCircleSize = parseFloat(getComputedStyle(blankCircle).width);
    const redCircleSize = blankCircleSize + 10; // Red circles are 10px larger than the white target circle

    switch (currentPhase) {
        case 1:
            // Phase 1: Normal Pandemonium
            setInterval(displaceCursorAndCircles, 2000); // Teleport every 2 seconds
            break;
        case 2:
            // Phase 2: Add red circle
            addRedCircle(redCircleSize);
            break;
        case 3:
            // Phase 3: Make the blank circle invisible
            makeBlankCircleInvisible();
            break;
        case 4:
            // Phase 4: Reduce the size of the target circle
            blankCircle.style.transition = 'width 1s, height 1s';
            blankCircle.style.width = getComputedStyle(cursor).width; // Match the size of the cursor circle
            blankCircle.style.height = getComputedStyle(cursor).height; // Match the size of the cursor circle
            break;
        case 5:
            // Phase 5: Add a second red circle
            addRedCircle(redCircleSize);
            break;
        case 6:
            // Phase 6: Add a third red circle and increase speed
            addRedCircle(redCircleSize);
            redCircleDecreaseRate = 10;
            break;
        case 7:
            // Phase 7: Hide the stamina bar
            bar.style.transition = 'opacity 1s';
            bar.style.opacity = '0';
            break;
    }
}

// Function to add a red circle
function addRedCircle(size) {
    const redCircle = document.createElement('div');
    redCircle.classList.add('red-circle');
    redCircle.style.width = `${size}px`; // Set the red circle size
    redCircle.style.height = `${size}px`; // Set the red circle size
    redCircle.style.position = 'absolute';
    redCircle.style.top = `${Math.random() * (window.innerHeight - size)}px`;
    redCircle.style.left = `${Math.random() * (window.innerWidth - size)}px`;
    document.body.appendChild(redCircle);
    redCircles.push(redCircle);
    redCircle.style.display = 'block'; // Ensure the red circle is visible
    moveRedCircle(redCircle);
}

// Function to move a red circle to a random position with animation
function moveRedCircle(redCircle) {
    const maxX = window.innerWidth - redCircle.offsetWidth;
    const maxY = window.innerHeight - redCircle.offsetHeight;
    const moveDistance = 400; // Increased move distance
    const redCircleX = redCircle.offsetLeft + (Math.random() - 0.5) * moveDistance;
    const redCircleY = redCircle.offsetTop + (Math.random() - 0.5) * moveDistance;

    // Ensure red circle stays within screen boundaries
    const newLeft = Math.max(0, Math.min(maxX, redCircleX));
    const newTop = Math.max(0, Math.min(maxY, redCircleY));
    
    redCircle.style.transition = `left ${currentPhase === 6 ? 0.5 : 1}s, top ${currentPhase === 6 ? 0.5 : 1}s`; // Faster animation in phase 6
    redCircle.style.left = `${newLeft}px`;
    redCircle.style.top = `${newTop}px`;
    
    setTimeout(() => moveRedCircle(redCircle), currentPhase === 6 ? 1500 : 3000); // Move again after 1.5 or 3 seconds
}

// Function to make the blank circle invisible for Phase 3 and when hovered over red circles
function makeBlankCircleInvisible() {
    isInvisible = true;
    blankCircle.style.transition = 'opacity 1s';
    blankCircle.style.opacity = '0';

    clearTimeout(invisibleTimeout);
    const invisibleDuration = Math.random() * 2000 + 3000; // 3-5 seconds
    invisibleTimeout = setTimeout(() => {
        blankCircle.style.opacity = '1';
        setTimeout(() => {
            isInvisible = false;
        }, 3000); // Keep slower bar decrease rate for 3 seconds after reappearing
    }, invisibleDuration);
}

// Function to start the game after 6 seconds
function startGame() {
    setTimeout(() => {
        gameStarted = true;
        applyPhaseChanges(); // Apply initial phase changes
    }, 6000);
}

// Reset the bar width when the page loads
window.onload = function() {
    resetGame();
    document.addEventListener('click', requestPointerLock, false);
    document.addEventListener('pointerlockchange', pointerLockChange, false);
    document.addEventListener('mozpointerlockchange', pointerLockChange, false);
    document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
    startGame(); // Start the game after 6 seconds
}

// Set interval for game loop to decrease bar width at a balanced rate and check game duration
setInterval(() => {
    const cursorPos = {
        x: cursorX + cursor.offsetWidth / 2,
        y: cursorY + cursor.offsetWidth / 2
    };
    updateBar(cursorPos);
    checkGameDuration(); // Check if the game duration has been reached
}, intervalTime); // Interval time for the game loop

// Set interval to apply jitter to the cursor
setInterval(applyJitter, jitterFrequency);

function handleWin() {
    // 1. Stop phase-changing timers and freezing circles.
    // Remove all timeouts for moving circles or making blank invisible
    redCircles.forEach(circle => {
        // Remove moveRedCircle's future moves by clearing old timeouts if any were stored (not strictly needed if using setTimeout directly)
        circle.style.transition = ''; // Remove transitions
    });
    // Stop blank circle invisibility
    if (invisibleTimeout) clearTimeout(invisibleTimeout);
    isInvisible = false;
    blankCircle.style.opacity = '1';
    // Prevent circles from moving any more:
    freezeCircles = true;
    // 2. Wait 3 seconds, then close the page
    setTimeout(() => {
        window.close();
    }, 3000);
}

// --- Changes in functions that move circles: ---

// Add this to top-level variables:
let freezeCircles = false;

// In moveRedCircle, add a freeze check:
function moveRedCircle(redCircle) {
    if (freezeCircles) return; // <<<< FREEZE CHECK
    const maxX = window.innerWidth - redCircle.offsetWidth;
    const maxY = window.innerHeight - redCircle.offsetHeight;
    const moveDistance = 400; // Increased move distance
    const redCircleX = redCircle.offsetLeft + (Math.random() - 0.5) * moveDistance;
    const redCircleY = redCircle.offsetTop + (Math.random() - 0.5) * moveDistance;

    // Ensure red circle stays within screen boundaries
    const newLeft = Math.max(0, Math.min(maxX, redCircleX));
    const newTop = Math.max(0, Math.min(maxY, redCircleY));

    redCircle.style.transition = `left ${currentPhase === 6 ? 0.5 : 1}s, top ${currentPhase === 6 ? 0.5 : 1}s`;
    redCircle.style.left = `${newLeft}px`;
    redCircle.style.top = `${newTop}px`;

    setTimeout(() => moveRedCircle(redCircle), currentPhase === 6 ? 1500 : 3000);
}

// In displaceCursorAndCircles, add the freeze check:
function displaceCursorAndCircles() {
    if (!gameStarted || freezeCircles) return; // <<<< FREEZE CHECK

    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
        case 0:
            cursorX = Math.random() * (window.innerWidth - cursor.offsetWidth);
            cursorY = 0;
            break;
        case 1:
            cursorX = window.innerWidth - cursor.offsetWidth;
            cursorY = Math.random() * (window.innerHeight - cursor.offsetHeight);
            break;
        case 2:
            cursorX = Math.random() * (window.innerWidth - cursor.offsetWidth);
            cursorY = window.innerHeight - cursor.offsetHeight;
            break;
        case 3:
            cursorX = 0;
            cursorY = Math.random() * (window.innerHeight - cursor.offsetHeight);
            break;
    }

    const blankCircleX = Math.random() * (window.innerWidth - blankCircle.offsetWidth);
    const blankCircleY = Math.random() * (window.innerHeight - blankCircle.offsetHeight);

    cursor.classList.add('teleporting');
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    blankCircle.classList.add('teleporting');
    blankCircle.style.left = `${blankCircleX}px`;
    blankCircle.style.top = `${blankCircleY}px`;

    setTimeout(() => {
        cursor.classList.remove('teleporting');
        blankCircle.classList.remove('teleporting');
    }, 50);

    updateBar({ x: cursorX + cursor.offsetWidth / 2, y: cursorY + cursor.offsetHeight / 2 });
}

// In makeBlankCircleInvisible, add freeze check:
function makeBlankCircleInvisible() {
    if (freezeCircles) return; // <<<< FREEZE CHECK
    isInvisible = true;
    blankCircle.style.transition = 'opacity 1s';
    blankCircle.style.opacity = '0';

    clearTimeout(invisibleTimeout);
    const invisibleDuration = Math.random() * 2000 + 3000;
    invisibleTimeout = setTimeout(() => {
        blankCircle.style.opacity = '1';
        setTimeout(() => {
            isInvisible = false;
        }, 3000);
    }, invisibleDuration);
}
