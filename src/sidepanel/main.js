import { Message } from '../shared/messages.js'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../shared/settings.js'
import {
  clearSouvenirs,
  loadSouvenirs,
  onSouvenirsChange,
  removeSouvenirs,
  saveSouvenirs,
} from '../shared/souvenirs.js'
import { copyPalette, copySouvenir, downloadSouvenir } from './clipboard.js'
import { $ } from './dom.js'
import { say } from './toast.js'
import { isShowing, showView } from './views.js'
import { renderCollection, setColumns } from './views/collection.js'
import { fillDetail } from './views/detail.js'
import { bindSettings, paintSettings } from './views/settings.js'
import { renderWhatsNew } from './views/whatsnew.js'

const state = {
  souvenirs: [],
  settings: { ...DEFAULT_SETTINGS },
  query: '',
  openId: null,
  known: new Set(),
}

const find = id => state.souvenirs.find(souvenir => souvenir.id === id)
const storedFlag = key => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const storeFlag = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable, and these are only conveniences.
  }
}

function render() {
  if (state.openId && !find(state.openId)) closeDetail()
  renderCollection({ souvenirs: state.souvenirs, query: state.query, known: state.known, actions })
  state.known = new Set(state.souvenirs.map(souvenir => souvenir.id))
}

const actions = {
  copy: copySouvenir,
  palette: copyPalette,
  open: souvenir => openDetail(souvenir.id),
  remove: souvenir => removeSouvenirs([souvenir.id]),
}

function openDetail(id) {
  state.openId = id
  fillDetail(find(id))
  showView('detail')
}

function closeDetail() {
  state.openId = null
  showView('list')
}

function openHelp() {
  storeFlag('souvenir-seen-help', '1')
  showView('help')
}

function openWhatsNew() {
  storeFlag('souvenir-seen-version', chrome.runtime.getManifest().version)
  $('helpBtn').classList.remove('has-update')
  renderWhatsNew()
  showView('whatsnew')
}

function flagUpdate() {
  const { version } = chrome.runtime.getManifest()
  const seen = storedFlag('souvenir-seen-version')
  if (seen === version) return
  if (seen === null && !storedFlag('souvenir-seen-help')) storeFlag('souvenir-seen-version', version)
  else $('helpBtn').classList.add('has-update')
}

function renameOpenSouvenir() {
  const souvenir = find(state.openId)
  const name = $('name').value.trim()
  if (!souvenir || (souvenir.name || '') === name) return
  saveSouvenirs(state.souvenirs.map(other => (other.id === souvenir.id ? { ...other, name } : other)))
}

function changeSettings(patch) {
  state.settings = { ...state.settings, ...patch }
  paintSettings(state.settings)
  saveSettings(state.settings)
}

function chooseColumns(columns) {
  setColumns(columns)
  storeFlag('souvenir-cols', String(columns))
}

let clearTimer
function confirmClear() {
  const button = $('clear')
  if (button.dataset.sure) {
    clearTimeout(clearTimer)
    delete button.dataset.sure
    button.textContent = 'Clear all'
    clearSouvenirs()
    return
  }
  button.dataset.sure = '1'
  button.textContent = 'Sure?'
  clearTimer = setTimeout(() => {
    delete button.dataset.sure
    button.textContent = 'Clear all'
  }, 2500)
}

async function startPicking() {
  const reply = await chrome.runtime.sendMessage({ type: Message.PICK })
  if (!reply?.ok)
    say(
      'Souvenir can’t start on this tab yet. Use the shortcut or right-click the page once, then try again.',
      4500
    )
}

function goBack() {
  if (isShowing('whatsnew')) showView('help')
  else if (isShowing('help') || isShowing('settings')) showView('list')
  else if (state.openId) closeDetail()
}

function bindEvents() {
  $('layout').addEventListener('click', event => {
    const button = event.target.closest('button')
    if (button) chooseColumns(Number(button.dataset.cols))
  })
  $('clear').addEventListener('click', confirmClear)
  $('pick').addEventListener('click', startPicking)
  $('search').addEventListener('input', event => {
    state.query = event.target.value.trim()
    render()
  })
  $('back').addEventListener('click', closeDetail)
  $('helpBack').addEventListener('click', () => showView('list'))
  $('whatsNew').addEventListener('click', openWhatsNew)
  $('whatsnewBack').addEventListener('click', () => showView('help'))
  $('settingsBack').addEventListener('click', () => showView('list'))
  $('helpBtn').addEventListener('click', openHelp)
  $('settingsBtn').addEventListener('click', () => showView('settings'))
  $('copy').addEventListener('click', () => find(state.openId) && copySouvenir(find(state.openId)))
  $('copyPalette').addEventListener('click', () => find(state.openId) && copyPalette(find(state.openId)))
  $('download').addEventListener('click', () => find(state.openId) && downloadSouvenir(find(state.openId)))
  $('remove').addEventListener('click', () => state.openId && actions.remove(find(state.openId)))
  $('shortcuts').addEventListener('click', () => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }))
  $('name').addEventListener('blur', renameOpenSouvenir)
  $('name').addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      $('name').blur()
    } else if (event.key === 'Escape') {
      event.stopPropagation()
      $('name').value = find(state.openId)?.name || ''
      $('name').blur()
    }
  })
  bindSettings(changeSettings)

  document.addEventListener('keydown', event => {
    const typing = event.target.closest('input, textarea')
    if (event.key === 'Escape') goBack()
    else if (event.key === '?' && !typing) openHelp()
    else if (event.key === '/' && !typing && isShowing('list') && !$('searchWrap').hidden) {
      event.preventDefault()
      $('search').focus()
    }
  })
}

async function showShortcut() {
  const commands = await chrome.commands.getAll()
  $('keyHint').textContent =
    commands.find(command => command.name === 'pick')?.shortcut || 'a shortcut (not set yet)'
}

async function start() {
  bindEvents()
  setColumns(storedFlag('souvenir-cols') === '2' ? 2 : 1)
  showShortcut().catch(() => {})
  ;[state.souvenirs, state.settings] = await Promise.all([loadSouvenirs(), loadSettings()])
  paintSettings(state.settings)
  render()
  flagUpdate()
  if (!storedFlag('souvenir-seen-help') && !state.souvenirs.length) openHelp()
  onSouvenirsChange(souvenirs => {
    state.souvenirs = souvenirs
    render()
  })
}

start()
