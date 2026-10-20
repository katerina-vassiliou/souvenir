import { Message } from '../shared/messages.js'
import { addSouvenir } from '../shared/souvenirs.js'

const MENU_ID = 'souvenir'
const CONTENT_ENTRY = 'src/content/main.js'
const BADGE_MS = 3000

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: MENU_ID, title: 'Collect element', contexts: ['all'] })
})

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})

function flagFailure(tabId) {
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#e5484d' })
  chrome.action.setBadgeText({ tabId, text: '!' })
  chrome.action.setTitle({ tabId, title: 'Souvenir can’t run on this page' })
  setTimeout(() => {
    chrome.action.setBadgeText({ tabId, text: '' })
    chrome.action.setTitle({ tabId, title: 'Open your collection' })
  }, BADGE_MS)
}

async function loadContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: url => import(url),
    args: [chrome.runtime.getURL(CONTENT_ENTRY)],
  })
}

async function startPicker(tabId, source) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: Message.START, source })
    return true
  } catch {
    // Souvenir has not been loaded into this page yet.
  }
  try {
    await loadContentScript(tabId)
    await chrome.tabs.sendMessage(tabId, { type: Message.START, source })
    return true
  } catch {
    flagFailure(tabId)
    return false
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID && tab?.id) startPicker(tab.id, 'menu')
})

async function pickInActiveTab(source, tab) {
  const target = tab?.id ? tab : (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
  return target?.id ? startPicker(target.id, source) : false
}

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'pick') pickInActiveTab('shortcut', tab)
})

const handlers = {
  async [Message.CAPTURE_TAB](_message, sender) {
    return { dataUrl: await chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' }) }
  },
  async [Message.KEEP]({ souvenir }) {
    await addSouvenir(souvenir)
    return { ok: true }
  },
  async [Message.OPEN_COLLECTION](_message, sender) {
    await chrome.sidePanel.open({ windowId: sender.tab.windowId })
    return { ok: true }
  },
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === Message.PICK && sender.url?.startsWith(chrome.runtime.getURL('/'))) {
    pickInActiveTab('sidepanel').then(started => sendResponse({ ok: started }))
    return true
  }
  const handler = handlers[message?.type]
  if (!handler || !sender.tab) return false
  handler(message, sender).then(sendResponse, error => sendResponse({ error: String(error) }))
  return true
})
