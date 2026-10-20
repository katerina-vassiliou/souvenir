export const $ = id => document.getElementById(id)

export function element(tag, { className, text, attrs = {} } = {}, children = []) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  node.append(...children)
  return node
}
