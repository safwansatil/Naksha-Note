
// Constants
const API_KEY = "AIzaSyBs381LGOePP1TSoZOEDAGAiLm11ypsInU";

// Elements
const navbar = document.getElementById('navbar');
const authSection = document.getElementById('auth-section');
const dynamicTextElement = document.getElementById('dynamic-text');
const enterCanvasBtn = document.getElementById('enter-canvas-btn');
const profileDropdown = document.getElementById('profileDropdown');
const yearElement = document.getElementById('year');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const profileForm = document.getElementById('profileForm');
const googleSignInBtn = document.querySelectorAll('#googleSignInBtn');
const logoutBtn = document.querySelectorAll('#logoutBtn');
const particles = document.getElementById('particles');

// Check if user is logged in
let currentUser = JSON.parse(localStorage.getItem('user'));

// Dynamic text content
const dynamicTexts = [
  "Let's take study grinding to the next level",
  "Transform your notes into powerful learning tools",
  "AI-powered insights for better learning outcomes",
  "Study smarter, not harder"
];

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
  console.log("Document loaded");
  
  // Initialize particles if on home page
  if (particles) {
    initParticles();
  }
  
  // Initialize dynamic text
  if (dynamicTextElement) {
    initDynamicText();
  }

  // Update navbar on scroll
  window.addEventListener('scroll', handleScroll);

  // Update auth section based on login status
  updateAuthSection();

  // Set up event listeners
  setupEventListeners();

  // Initialize profile page if on that page
  if (window.location.pathname.includes('profile.html')) {
    initProfilePage();
  }
  
  // Update footer year
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Log what page we're on for debugging
  console.log("Current path:", window.location.pathname);
});

// Initialize particles animation
function initParticles() {
  console.log("Initializing particles");
  
  // Clear any existing particles
  particles.innerHTML = '';
  
  // Create particles
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');
    
    // Random size
    const size = Math.random() * 6 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Random position
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.left = `${Math.random() * 100}%`;
    
    // Random opacity
    particle.style.opacity = Math.random() * 0.5 + 0.3;
    
    // Random animation delay
    particle.style.animationDuration = `${Math.random() * 8 + 4}s`;
    particle.style.animationDelay = `${Math.random() * 4}s`;
    
    particles.appendChild(particle);
  }
}

// Initialize dynamic text animation
function initDynamicText() {
  console.log("Initializing dynamic text");
  
  let currentIndex = 0;
  let currentText = '';
  let isDeleting = false;
  let typingSpeed = 100;
  let erasingSpeed = 50;
  let delayBetweenTexts = 2000;

  function type() {
    const fullText = dynamicTexts[currentIndex];
    
    if (isDeleting) {
      // Erasing text
      currentText = fullText.substring(0, currentText.length - 1);
    } else {
      // Typing text
      currentText = fullText.substring(0, currentText.length + 1);
    }
    
    dynamicTextElement.textContent = currentText;
    
    let typeSpeed = isDeleting ? erasingSpeed : typingSpeed;
    
    if (!isDeleting && currentText === fullText) {
      // Done typing, wait before erasing
      typeSpeed = delayBetweenTexts;
      isDeleting = true;
    } else if (isDeleting && currentText === '') {
      // Done erasing, move to next text
      isDeleting = false;
      currentIndex = (currentIndex + 1) % dynamicTexts.length;
    }
    
    setTimeout(type, typeSpeed);
  }
  
  // Start the typing animation
  setTimeout(() => {
    type();
  }, 500);
}

// Handle navbar appearance on scroll
function handleScroll() {
  if (navbar) {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
}

// Update authentication section based on login status
function updateAuthSection() {
  if (!authSection) {
    console.log("Auth section not found");
    return;
  }
  
  console.log("Updating auth section, user:", currentUser);
  
  if (currentUser) {
    authSection.innerHTML = `
      <button id="profileButton" class="profile-button">
        ${currentUser.username || 'User'}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
    `;
    
    // Add event listener to the profile button
    const profileButton = document.getElementById('profileButton');
    if (profileButton) {
      profileButton.addEventListener('click', toggleProfileDropdown);
    }
  } else {
    authSection.innerHTML = `
      <a href="login.html" class="nav-link">Login</a>
      <a href="register.html" class="sign-up-btn">Sign Up</a>
    `;
  }
}

// Toggle profile dropdown
function toggleProfileDropdown(event) {
  event.stopPropagation();
  if (profileDropdown) {
    profileDropdown.classList.toggle('active');
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function closeDropdown(e) {
      if (!profileDropdown.contains(e.target) && e.target !== document.getElementById('profileButton')) {
        profileDropdown.classList.remove('active');
        document.removeEventListener('click', closeDropdown);
      }
    });
  }
}

// Set up event listeners
function setupEventListeners() {
  // Enter canvas button
  if (enterCanvasBtn) {
    enterCanvasBtn.addEventListener('click', () => {
      console.log("Enter canvas clicked, user:", currentUser);
      if (currentUser) {
        window.location.href = 'canvas.html';
      } else {
        showToast('Authentication Required', 'Please login or register to access the notes enhancer.', 'error');
      }
    });
  }

  // Login form
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    console.log("Login form listener added");
  }

  // Register form
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
    console.log("Register form listener added");
  }

  // Google sign-in buttons
  if (googleSignInBtn && googleSignInBtn.length > 0) {
    googleSignInBtn.forEach(btn => {
      btn.addEventListener('click', handleGoogleSignIn);
    });
    console.log("Google sign-in listeners added");
  }

  // Logout buttons
  if (logoutBtn && logoutBtn.length > 0) {
    logoutBtn.forEach(btn => {
      btn.addEventListener('click', handleLogout);
    });
    console.log("Logout listeners added");
  }

  // Profile form
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
  }
  
  // Contact form (if exists)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      showToast('Message Sent', 'Thank you for your message. We will get back to you soon!', 'success');
      contactForm.reset();
    });
  }
}

// Handle login
function handleLogin(event) {
  event.preventDefault();
  
  console.log("Login form submitted");
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');
  
  // Clear any previous errors
  if (errorMessage) {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }
  
  // Basic validation
  if (!email || !password) {
    if (errorMessage) {
      errorMessage.textContent = 'Please enter both email and password';
      errorMessage.style.display = 'block';
    }
    return;
  }
  
  // Simulate loading
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.textContent = 'Logging in...';
    loginButton.disabled = true;
  }
  
  // Mock login (with timeout to simulate network request)
  setTimeout(() => {
    // Mock user for demo
    const user = {
      id: 'user-' + Date.now(),
      username: email.split('@')[0],
      email: email,
      photoURL: null,
      bio: ''
    };
    
    // Save user to local storage
    localStorage.setItem('user', JSON.stringify(user));
    currentUser = user;
    
    // Show success toast
    showToast('Login Successful', `Welcome back, ${user.username}!`, 'success');
    
    // Redirect to home
    window.location.href = 'index.html';
  }, 1000);
}

// Handle register
function handleRegister(event) {
  event.preventDefault();
  
  console.log("Register form submitted");
  
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorMessage = document.getElementById('errorMessage');
  
  // Clear any previous errors
  if (errorMessage) {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
  }
  
  // Basic validation
  if (!username || !email || !password || !confirmPassword) {
    if (errorMessage) {
      errorMessage.textContent = 'Please fill all fields';
      errorMessage.style.display = 'block';
    }
    return;
  }
  
  if (password !== confirmPassword) {
    if (errorMessage) {
      errorMessage.textContent = 'Passwords do not match';
      errorMessage.style.display = 'block';
    }
    return;
  }
  
  // Simulate loading
  const registerButton = document.getElementById('registerButton');
  if (registerButton) {
    registerButton.textContent = 'Creating account...';
    registerButton.disabled = true;
  }
  
  // Mock registration (with timeout to simulate network request)
  setTimeout(() => {
    // Mock user for demo
    const user = {
      id: 'user-' + Date.now(),
      username: username,
      email: email,
      photoURL: null,
      bio: ''
    };
    
    // Save user to local storage
    localStorage.setItem('user', JSON.stringify(user));
    currentUser = user;
    
    // Show success toast
    showToast('Registration Successful', `Welcome, ${username}!`, 'success');
    
    // Redirect to home
    window.location.href = 'index.html';
  }, 1000);
}

// Handle Google Sign-In
function handleGoogleSignIn() {
  console.log("Google sign-in clicked");
  
  // Mock Google sign in
  const googleSignInButton = this;
  if (googleSignInButton) {
    googleSignInButton.textContent = 'Signing in with Google...';
    googleSignInButton.disabled = true;
  }
  
  // Simulate API call delay
  setTimeout(() => {
    // Mock Google user
    const user = {
      id: 'google-user-' + Date.now(),
      username: 'Google User',
      email: 'google.user@gmail.com',
      photoURL: 'https://via.placeholder.com/150',
      bio: ''
    };
    
    // Save user to local storage
    localStorage.setItem('user', JSON.stringify(user));
    currentUser = user;
    
    // Show success toast
    showToast('Google Sign-In Successful', 'Welcome!', 'success');
    
    // Redirect to home
    window.location.href = 'index.html';
  }, 1000);
}

// Handle logout
function handleLogout(event) {
  event.preventDefault();
  
  console.log("Logout clicked");
  
  // Remove user from local storage
  localStorage.removeItem('user');
  currentUser = null;
  
  // Show toast notification
  showToast('Logged Out', 'You have been successfully logged out.', 'success');
  
  // Close dropdown if open
  if (profileDropdown) {
    profileDropdown.classList.remove('active');
  }
  
  // Update auth section
  updateAuthSection();
  
  // Redirect to home if on profile page or canvas page
  if (window.location.pathname.includes('profile.html') || window.location.pathname.includes('canvas.html')) {
    window.location.href = 'index.html';
  }
}

// Initialize profile page
function initProfilePage() {
  if (!currentUser) {
    // Redirect to login if not logged in
    window.location.href = 'login.html';
    return;
  }
  
  const usernameField = document.getElementById('username');
  const emailField = document.getElementById('email');
  const bioField = document.getElementById('bio');
  const avatarContainer = document.getElementById('userAvatar');
  const avatarUpload = document.getElementById('avatarUpload');
  
  // Set current values
  if (usernameField) usernameField.value = currentUser.username || '';
  if (emailField) emailField.value = currentUser.email || '';
  if (bioField) bioField.value = currentUser.bio || '';
  
  // Set avatar
  if (avatarContainer) {
    if (currentUser.photoURL) {
      avatarContainer.innerHTML = `<img src="${currentUser.photoURL}" alt="${currentUser.username}">`;
    } else {
      avatarContainer.textContent = currentUser.username?.charAt(0).toUpperCase() || '';
    }
  }
  
  // Avatar upload
  if (avatarUpload) {
    avatarUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const photoURL = e.target.result;
          avatarContainer.innerHTML = `<img src="${photoURL}" alt="${currentUser.username}">`;
          
          // Update user
          currentUser.photoURL = photoURL;
          localStorage.setItem('user', JSON.stringify(currentUser));
          
          showToast('Profile photo updated', 'Your profile photo has been successfully updated.', 'success');
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Handle profile update
function handleProfileUpdate(event) {
  event.preventDefault();
  
  if (!currentUser) return;
  
  const usernameField = document.getElementById('username');
  const bioField = document.getElementById('bio');
  
  // Update user
  if (usernameField) currentUser.username = usernameField.value;
  if (bioField) currentUser.bio = bioField.value;
  
  // Save updated user
  localStorage.setItem('user', JSON.stringify(currentUser));
  
  showToast('Profile updated', 'Your profile has been successfully updated.', 'success');
}

// Show toast notification
function showToast(title, message, type = 'success') {
  const toast = document.getElementById('toast') || createToastElement();
  
  toast.className = 'toast';
  toast.classList.add(type);
  
  toast.innerHTML = `
    <div class="toast-icon">${type === 'success' ? '✓' : '!'}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="closeToast()">&times;</button>
  `;
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('active');
  }, 100);
  
  // Auto-hide toast after 5 seconds
  setTimeout(() => {
    closeToast();
  }, 5000);
}

// Create toast element if it doesn't exist
function createToastElement() {
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.className = 'toast';
  document.body.appendChild(toast);
  return toast;
}

// Close toast notification
function closeToast() {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.classList.remove('active');
  }
}

// Make closeToast available globally
window.closeToast = closeToast;
