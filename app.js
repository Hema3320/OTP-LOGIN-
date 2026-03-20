/* ============================================
   OTP Login — app.js
   Stack: HTML5 / CSS3 / Vanilla JS
   ============================================ */

"use strict";

// ─── State ────────────────────────────────────
const state = {
  email:      '',
  generatedOTP: '',
  timerInterval: null,
  secondsLeft: 120,
};

// ─── DOM helpers ──────────────────────────────
const $ = (id) => document.getElementById(id);

// ─── Screens ──────────────────────────────────
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = $(screenId);
  target.classList.add('active');
}

function updateSteps(active) {
  ['step-1', 'step-2', 'step-3'].forEach((id, i) => {
    const el = $(id);
    el.classList.remove('active', 'completed');
    if (i + 1 < active) el.classList.add('completed');
    if (i + 1 === active) el.classList.add('active');
  });
}

// ─── Validation ───────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── OTP Generator ────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Timer ────────────────────────────────────
function startTimer() {
  clearInterval(state.timerInterval);
  state.secondsLeft = 120;

  $('resend-btn').disabled = true;
  renderTimer();

  state.timerInterval = setInterval(() => {
    state.secondsLeft--;
    renderTimer();

    if (state.secondsLeft <= 0) {
      clearInterval(state.timerInterval);
      $('timer-display').textContent = 'expired';
      $('resend-btn').disabled = false;
    }
  }, 1000);
}

function renderTimer() {
  const m = Math.floor(state.secondsLeft / 60);
  const s = state.secondsLeft % 60;
  $('timer-display').textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

function stopTimer() {
  clearInterval(state.timerInterval);
}

// ─── Button Loading State ─────────────────────
function setLoading(btnId, loading) {
  const btn = $(btnId);
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<div class="btn-spinner"></div>`;
  } else {
    btn.disabled = false;
  }
}

// ─── Toast ────────────────────────────────────
let toastTimer = null;

function showToast(message) {
  const toast = $('toast');
  $('toast-text').textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// ─── OTP Input Setup ──────────────────────────
function setupOTPInputs() {
  const boxes = document.querySelectorAll('.otp-box');

  boxes.forEach((box, index) => {
    // Clear previous value and state
    box.value = '';
    box.classList.remove('filled', 'has-error');

    box.addEventListener('input', (e) => {
      // Allow digits only
      const char = e.target.value.replace(/\D/g, '');
      e.target.value = char;

      if (char) {
        box.classList.add('filled');
        // Move to next box
        if (index < boxes.length - 1) {
          boxes[index + 1].focus();
        }
      } else {
        box.classList.remove('filled');
      }

      checkOTPComplete();
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!box.value && index > 0) {
          boxes[index - 1].focus();
          boxes[index - 1].value = '';
          boxes[index - 1].classList.remove('filled');
          checkOTPComplete();
        }
      }
      if (e.key === 'ArrowLeft' && index > 0)  boxes[index - 1].focus();
      if (e.key === 'ArrowRight' && index < boxes.length - 1) boxes[index + 1].focus();
    });

    // Handle paste — user pastes "123456" into any box
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData)
        .getData('text')
        .replace(/\D/g, '')
        .slice(0, 6);

      [...pasted].forEach((char, i) => {
        if (boxes[i]) {
          boxes[i].value = char;
          boxes[i].classList.add('filled');
        }
      });

      const nextEmpty = Math.min(pasted.length, boxes.length - 1);
      boxes[nextEmpty].focus();
      checkOTPComplete();
    });
  });

  // Focus first box
  boxes[0].focus();
}

function checkOTPComplete() {
  const boxes = document.querySelectorAll('.otp-box');
  const complete = [...boxes].every(b => b.value !== '');
  $('verify-otp-btn').disabled = !complete;
  $('otp-error').textContent = '';
  boxes.forEach(b => b.classList.remove('has-error'));
}

function getEnteredOTP() {
  return [...document.querySelectorAll('.otp-box')]
    .map(b => b.value)
    .join('');
}

function clearOTPBoxes() {
  document.querySelectorAll('.otp-box').forEach(b => {
    b.value = '';
    b.classList.remove('filled', 'has-error');
  });
  $('verify-otp-btn').disabled = true;
  $('otp-error').textContent = '';
  document.querySelectorAll('.otp-box')[0].focus();
}

// ─── Screen 1: Send OTP ───────────────────────
function handleSendOTP() {
  const emailInput = $('email-input');
  const email = emailInput.value.trim();

  // Validate
  if (!email) {
    showEmailError('Please enter your email address.');
    emailInput.classList.add('has-error');
    return;
  }
  if (!isValidEmail(email)) {
    showEmailError('Please enter a valid email address.');
    emailInput.classList.add('has-error');
    return;
  }

  // Clear errors
  clearEmailError();
  emailInput.classList.remove('has-error');

  // Simulate API call
  setLoading('send-otp-btn', true);

  setTimeout(() => {
    state.email = email;
    state.generatedOTP = generateOTP();

    // Restore button (will be hidden anyway)
    $('send-otp-btn').disabled = false;
    $('send-otp-btn').innerHTML = `
      <span class="btn-text">Send code</span>
      <svg class="btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

    // Fill email display
    $('email-display-text').textContent = email;

    // Move to OTP screen
    showScreen('screen-otp');
    updateSteps(2);
    setupOTPInputs();
    startTimer();

    // Show OTP in toast (demo only — in real app this goes via email)
    showToast(`Demo OTP: ${state.generatedOTP}`);
    console.log(`%c OTP: ${state.generatedOTP} `, 'background:#5b8dee;color:#fff;font-size:14px;padding:4px 8px;border-radius:4px;');

  }, 1400);
}

function showEmailError(msg) {
  $('email-error').textContent = msg;
}

function clearEmailError() {
  $('email-error').textContent = '';
}

// ─── Screen 2: Verify OTP ─────────────────────
function handleVerifyOTP() {
  const entered = getEnteredOTP();

  setLoading('verify-otp-btn', true);

  setTimeout(() => {
    if (entered === state.generatedOTP) {
      // ✅ Correct
      stopTimer();
      buildSuccessScreen();
      showScreen('screen-success');
      updateSteps(3);

    } else {
      // ❌ Wrong code
      $('verify-otp-btn').disabled = false;
      $('verify-otp-btn').innerHTML = `
        <span class="btn-text">Verify &amp; Sign in</span>
        <svg class="btn-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

      document.querySelectorAll('.otp-box').forEach(b => b.classList.add('has-error'));
      $('otp-error').textContent = 'Incorrect code. Please try again.';

      // Auto-clear after shake animation
      setTimeout(() => {
        clearOTPBoxes();
      }, 1500);
    }
  }, 1000);
}

function buildSuccessScreen() {
  const name = state.email.split('@')[0];
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  const initials = displayName.charAt(0);

  $('user-avatar').textContent = initials;
  $('user-name-display').textContent = displayName;
  $('user-email-final').textContent = state.email;
}

// ─── Resend Code ──────────────────────────────
function handleResend() {
  state.generatedOTP = generateOTP();
  clearOTPBoxes();
  startTimer();
  showToast(`New OTP: ${state.generatedOTP}`);
  console.log(`%c New OTP: ${state.generatedOTP} `, 'background:#5b8dee;color:#fff;font-size:14px;padding:4px 8px;border-radius:4px;');
}

// ─── Go Back ──────────────────────────────────
function goBack() {
  stopTimer();
  clearOTPBoxes();
  showScreen('screen-email');
  updateSteps(1);
}

// ─── Sign Out ─────────────────────────────────
function handleSignOut() {
  // Reset state
  state.email = '';
  state.generatedOTP = '';
  stopTimer();

  // Reset email input
  $('email-input').value = '';
  clearEmailError();
  $('email-input').classList.remove('has-error');

  // Go back to start
  showScreen('screen-email');
  updateSteps(1);
}

// ─── Init: Enter key support ──────────────────
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;

  const emailScreen = $('screen-email');
  const otpScreen   = $('screen-otp');

  if (emailScreen.classList.contains('active')) {
    handleSendOTP();
  } else if (otpScreen.classList.contains('active')) {
    if (!$('verify-otp-btn').disabled) {
      handleVerifyOTP();
    }
  }
});
