const PAGE_ROUTES = ['home', 'inspect', 'analyzing', 'report', 'obd', 'compare']
const HOME_SECTIONS = ['features', 'how', 'pricing']
let activeRoute

function showRoute(route) {
  if (route === activeRoute) return
  const section = HOME_SECTIONS.includes(route)
  const page = section ? 'home' : route
  const content = document.getElementById('page-' + page)
  activeRoute = route
  if (page !== 'analyzing') state.draft = null
  document.querySelectorAll('.page').forEach(el => el.classList.toggle('active', el === content))
  document.querySelectorAll('nav a[data-route]').forEach(link => {
    if (link.hash === '#' + route) link.setAttribute('aria-current', section ? 'location' : 'page')
    else link.removeAttribute('aria-current')
  })
  setMobileMenu(false)
  if (page === 'compare') renderComparison()
  const heading = (section ? document.getElementById(route) : content).querySelector('h1,h2')
  if (heading) {
    heading.tabIndex = -1
    heading.focus({ preventScroll: true })
  }
  if (section) document.getElementById(route).scrollIntoView()
  else window.scrollTo({ top: 0, behavior: 'instant' })
}

function goTo(route) {
  if (![...PAGE_ROUTES, ...HOME_SECTIONS].includes(route)) return
  if (activeRoute === route) {
    setMobileMenu(false)
    if (HOME_SECTIONS.includes(route)) document.getElementById(route).scrollIntoView()
    return
  }
  if (location.hash !== '#' + route) {
    const method = activeRoute === 'analyzing' ? 'replaceState' : 'pushState'
    // Keep the inspection form as the Back destination after analysis.
    history[method](null, '', '#' + route)
  }
  showRoute(route)
}

function syncRoute() {
  let route = location.hash.slice(1) || 'home'
  if (route === 'analyzing' && !state.draft) route = state.report ? 'report' : 'inspect'
  if (![...PAGE_ROUTES, ...HOME_SECTIONS].includes(route)) route = 'home'
  if (location.hash && location.hash !== '#' + route) history.replaceState(null, '', '#' + route)
  showRoute(route)
}

function setMobileMenu(open) {
  document.getElementById('navMobile').classList.toggle('open', open)
  document.getElementById('mobileMenuButton').setAttribute('aria-expanded', String(open))
}

function toggleMobile() {
  setMobileMenu(document.getElementById('mobileMenuButton').getAttribute('aria-expanded') !== 'true')
}

window.addEventListener('popstate', syncRoute)
window.addEventListener('hashchange', syncRoute)
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-route]')
  if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
  event.preventDefault()
  goTo(link.hash.slice(1))
})
document.addEventListener('keydown', event => {
  const menu = document.getElementById('mobileMenuButton')
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    setMobileMenu(false)
    menu.focus()
  }
})
