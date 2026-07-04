/**
 * Melody PWA - Router
 * SPA navigation with page transitions and history management
 * @version 1.0.0
 */


class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.transitionDuration = 300;

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      this.handlePopState(e);
    });
  }

  /**
   * Register a route
   */
  register(path, options = {}) {
    this.routes[path] = {
      path,
      pageId: options.pageId || path.replace('#', ''),
      title: options.title || 'Melody',
      onEnter: options.onEnter || (() => {}),
      onLeave: options.onLeave || (() => {}),
      requiresAuth: options.requiresAuth || false,
      ...options
    };
    return this;
  }

  /**
   * Navigate to a route
   */
  async navigate(path, options = {}) {
    const route = this.routes[path];
    if (!route) {
      console.warn(`[Melody Router] Route not found: ${path}`);
      return;
    }

    // Check auth (first launch flow)
    if (route.requiresAuth) {
      const isFirstLaunch = state.get('isFirstLaunch');
      if (isFirstLaunch) {
        this.navigate('#first-launch', { replace: true });
        return;
      }
    }

    // Same route, do nothing
    if (this.currentRoute === path && !options.force) return;

    const previousRoute = this.currentRoute;
    const previousPage = previousRoute ? this.routes[previousRoute] : null;

    // Update state
    this.currentRoute = path;
    state.set('currentPage', route.pageId);

    // Update document title
    document.title = route.title;

    // Update URL
    if (options.replace) {
      history.replaceState({ path }, '', path);
    } else {
      history.pushState({ path }, '', path);
    }

    // Transition pages
    await this.transitionPages(previousPage, route, options);

    // Call lifecycle hooks
    if (previousPage?.onLeave) {
      previousPage.onLeave();
    }
    if (route.onEnter) {
      route.onEnter();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Transition between pages with animation
   */
  async transitionPages(fromPage, toPage, options = {}) {
    const fromEl = fromPage ? document.getElementById(`page-${fromPage.pageId}`) : null;
    const toEl = document.getElementById(`page-${toPage.pageId}`);

    if (!toEl) {
      console.warn(`[Melody Router] Page element not found: page-${toPage.pageId}`);
      return;
    }

    // If no previous page or instant transition
    if (!fromEl || options.instant) {
      if (fromEl) fromEl.classList.add('hidden');
      toEl.classList.remove('hidden');
      toEl.classList.add('active');
      return;
    }

    // Animate out current page
    fromEl.classList.remove('active');
    fromEl.classList.add('page-transition-exit');
    fromEl.classList.add('page-transition-exit-active');

    // Prepare next page
    toEl.classList.remove('hidden');
    toEl.classList.add('page-transition-enter');

    // Small delay for DOM reflow
    await this.delay(50);

    // Animate in next page
    toEl.classList.add('page-transition-enter-active');

    // Wait for transition
    await this.delay(this.transitionDuration);

    // Cleanup
    fromEl.classList.remove('page-transition-exit', 'page-transition-exit-active');
    fromEl.classList.add('hidden');
    toEl.classList.remove('page-transition-enter', 'page-transition-enter-active');
    toEl.classList.add('active');
  }

  /**
   * Handle browser back/forward buttons
   */
  handlePopState(event) {
    const path = event.state?.path || window.location.hash || '#home';
    const route = this.routes[path];
    if (route) {
      this.navigate(path, { replace: true, instant: true });
    }
  }

  /**
   * Go back
   */
  back() {
    history.back();
  }

  /**
   * Get current route
   */
  getCurrentRoute() {
    return this.currentRoute;
  }

  /**
   * Check if route is active
   */
  isActive(path) {
    return this.currentRoute === path;
  }

  /**
   * Utility: delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Initialize router with all app routes
   */
  init() {
    this.register('#first-launch', {
      pageId: 'first-launch',
      title: 'Welcome to Melody',
      instant: true
    });

    this.register('#greeting', {
      pageId: 'greeting',
      title: 'Welcome',
      instant: true
    });

    this.register('#home', {
      pageId: 'home',
      title: 'Home',
      requiresAuth: true
    });

    this.register('#library', {
      pageId: 'library',
      title: 'Library',
      requiresAuth: true
    });

    this.register('#search', {
      pageId: 'search',
      title: 'Search',
      requiresAuth: true
    });

    this.register('#favorites', {
      pageId: 'favorites',
      title: 'Favorites',
      requiresAuth: true
    });

    this.register('#playlists', {
      pageId: 'playlists',
      title: 'Playlists',
      requiresAuth: true
    });

    this.register('#queue', {
      pageId: 'queue',
      title: 'Queue',
      requiresAuth: true
    });

    this.register('#settings', {
      pageId: 'settings',
      title: 'Settings',
      requiresAuth: true
    });

    this.register('#equalizer', {
      pageId: 'equalizer',
      title: 'Equalizer',
      requiresAuth: true
    });

    // Handle initial route
    const hash = window.location.hash;
    const initialRoute = hash && this.routes[hash] ? hash : '#home';
    this.navigate(initialRoute, { replace: true, instant: true });
  }
}

// Singleton instance
const router = new Router();

// Module: router
