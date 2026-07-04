/**
 * Melody PWA - Animation Utilities
 * Smooth animations, transitions, and scroll behaviors
 * @version 1.0.0
 */

/**
 * Animate an element with CSS class
 */
function animate(element, animationClass, options = {}) {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    const duration = options.duration || 300;
    const onComplete = options.onComplete;

    element.classList.add(animationClass);

    const handler = () => {
      element.classList.remove(animationClass);
      element.removeEventListener('animationend', handler);
      if (onComplete) onComplete();
      resolve();
    };

    element.addEventListener('animationend', handler);

    // Fallback timeout
    setTimeout(handler, duration + 50);
  });
}

/**
 * Fade in an element
 */
function fadeIn(element, duration = 300) {
  if (!element) return Promise.resolve();

  element.style.opacity = '0';
  element.style.display = '';
  element.style.transition = `opacity ${duration}ms ease`;

  requestAnimationFrame(() => {
    element.style.opacity = '1';
  });

  return new Promise(resolve => {
    setTimeout(() => {
      element.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Fade out an element
 */
function fadeOut(element, duration = 300) {
  if (!element) return Promise.resolve();

  element.style.transition = `opacity ${duration}ms ease`;
  element.style.opacity = '0';

  return new Promise(resolve => {
    setTimeout(() => {
      element.style.display = 'none';
      element.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Slide up animation
 */
function slideUp(element, duration = 400) {
  if (!element) return Promise.resolve();

  element.style.transform = 'translateY(100%)';
  element.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  element.style.display = '';

  requestAnimationFrame(() => {
    element.style.transform = 'translateY(0)';
  });

  return new Promise(resolve => {
    setTimeout(() => {
      element.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Slide down animation
 */
function slideDown(element, duration = 400) {
  if (!element) return Promise.resolve();

  element.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  element.style.transform = 'translateY(100%)';

  return new Promise(resolve => {
    setTimeout(() => {
      element.style.display = 'none';
      element.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Scale in animation
 */
function scaleIn(element, duration = 300) {
  if (!element) return Promise.resolve();

  element.style.transform = 'scale(0.92)';
  element.style.opacity = '0';
  element.style.transition = `all ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
  element.style.display = '';

  requestAnimationFrame(() => {
    element.style.transform = 'scale(1)';
    element.style.opacity = '1';
  });

  return new Promise(resolve => {
    setTimeout(() => {
      element.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Stagger animation for children
 */
function staggerChildren(container, animationClass = 'anim-fade-in-up', staggerDelay = 60) {
  if (!container) return;

  const children = container.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    child.style.animationDelay = `${i * staggerDelay}ms`;
    child.classList.add(animationClass);
  }
}

/**
 * Smooth scroll to element
 */
function scrollToElement(element, options = {}) {
  if (!element) return;

  const behavior = options.behavior || 'smooth';
  const offset = options.offset || 0;

  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior });
}

/**
 * Scroll element into center view
 */
function scrollIntoCenter(element, container) {
  if (!element || !container) return;

  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) 
    - (containerRect.height / 2) + (elementRect.height / 2);

  container.scrollTo({
    top: scrollTop,
    behavior: 'smooth'
  });
}

/**
 * Parallax effect on scroll
 */
function parallax(element, speed = 0.5) {
  if (!element) return;

  const handler = () => {
    const scrolled = window.scrollY;
    const rate = scrolled * speed;
    element.style.transform = `translateY(${rate}px)`;
  };

  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}

/**
 * Intersection observer for lazy loading / reveal animations
 */
function observeIntersection(elements, callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        if (options.once !== false) {
          observer.unobserve(entry.target);
        }
      }
    });
  }, defaultOptions);

  const elementList = Array.isArray(elements) ? elements : [elements];
  elementList.forEach(el => el && observer.observe(el));

  return observer;
}

/**
 * Reveal elements on scroll
 */
function revealOnScroll(selector, animationClass = 'anim-fade-in-up') {
  const elements = document.querySelectorAll(selector);

  observeIntersection(elements, (el) => {
    el.classList.add(animationClass);
  }, { once: true });
}

/**
 * Ripple effect on click
 */
function createRipple(event, element, options = {}) {
  const ripple = document.createElement('span');
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: ${options.color || 'rgba(35, 35, 35, 0.1)'};
    border-radius: 50%;
    transform: scale(0);
    animation: rippleEffect 600ms ease-out;
    pointer-events: none;
  `;

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
}

/**
 * Add ripple styles to document
 */
function addRippleStyles() {
  if (document.getElementById('ripple-styles')) return;

  const style = document.createElement('style');
  style.id = 'ripple-styles';
  style.textContent = `
    @keyframes rippleEffect {
      to {
        transform: scale(2.5);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Spring animation (custom easing)
 */
function springAnimation(element, properties, options = {}) {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    const duration = options.duration || 500;
    const easing = options.easing || 'cubic-bezier(0.34, 1.56, 0.64, 1)';

    const transitions = Object.keys(properties).map(prop => {
      return `${prop} ${duration}ms ${easing}`;
    }).join(', ');

    element.style.transition = transitions;

    requestAnimationFrame(() => {
      Object.entries(properties).forEach(([prop, value]) => {
        element.style[prop] = value;
      });
    });

    setTimeout(() => {
      element.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Count up animation for numbers
 */
function countUp(element, target, duration = 1000) {
  if (!element) return;

  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * easeProgress);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Typewriter effect
 */
function typewriter(element, text, options = {}) {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    const speed = options.speed || 50;
    let index = 0;
    element.textContent = '';

    function type() {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
        setTimeout(type, speed);
      } else {
        resolve();
      }
    }

    type();
  });
}
