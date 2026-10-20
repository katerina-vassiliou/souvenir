export function createOverlay({ zIndex, css, html }) {
  const host = document.createElement('div')
  host.style.cssText = `all:initial;position:fixed;inset:0;z-index:${zIndex};pointer-events:none`
  const root = host.attachShadow({ mode: 'open' })
  root.innerHTML = `<style>${css}</style>${html}`
  document.documentElement.append(host)
  return { host, root, remove: () => host.remove() }
}
