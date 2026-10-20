export function scrollContainersOf(el) {
  const containers = []
  for (let node = el.parentElement; node && node !== document.documentElement; node = node.parentElement) {
    const style = getComputedStyle(node)
    const scrollsY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1
    const scrollsX = /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1
    if (scrollsY || scrollsX) containers.push(node)
  }
  return containers
}

export function scrollTo(el, containers, x, y) {
  for (const container of containers) {
    const area = container.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    container.scrollTop += rect.top + y - (area.top + container.clientTop)
    container.scrollLeft += rect.left + x - (area.left + container.clientLeft)
  }
  const rect = el.getBoundingClientRect()
  window.scrollBy(rect.left + x, rect.top + y)
}

export function rememberScroll(containers) {
  const { scrollX, scrollY } = window
  const restorers = [() => window.scrollTo(scrollX, scrollY)]
  for (const node of containers) {
    const { scrollLeft, scrollTop } = node
    restorers.push(() => {
      node.scrollLeft = scrollLeft
      node.scrollTop = scrollTop
    })
  }
  return () => restorers.forEach(restore => restore())
}
