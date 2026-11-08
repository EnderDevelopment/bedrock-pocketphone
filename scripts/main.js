import { world, system, DynamicPropertiesDefinition } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";

const KEY = "pocketphone:state";
const APPS = ["Phone", "Contacts", "Messages", "Camera", "Photos", "Browser", "Music", "Games", "Calculator", "Calendar", "Clock", "Weather", "Notes", "Reminders", "Maps", "Files", "Settings", "Store"];
const ICONS = { Phone: "☎", Contacts: "◉", Messages: "✉", Camera: "◈", Photos: "▧", Browser: "◎", Music: "♫", Games: "◆", Calculator: "▦", Calendar: "□", Clock: "◷", Weather: "☼", Notes: "✎", Reminders: "✓", Maps: "⌖", Files: "▤", Settings: "⚙", Store: "＋" };

function load(player) {
  try {
    const value = player.getDynamicProperty(KEY);
    if (typeof value === "string") return JSON.parse(value);
  } catch (_) {}
  return { wallpaper: "Ocean Blue", dark: true, page: 0, contacts: [], messages: [], notes: [], reminders: [], photos: [], apps: [...APPS], dock: ["Phone", "Messages", "Browser", "Camera"] };
}
function save(player, state) { player.setDynamicProperty(KEY, JSON.stringify(state)); }
function now() { return new Date(); }
function stamp() { return now().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function formTitle(state, title) { return `${title}  |  ${stamp()}  |  ${state.wallpaper}`; }
function buttonText(app) { return `${ICONS[app] || "●"}  ${app}`; }

async function home(player) {
  const state = load(player);
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(state.apps.length / pageSize));
  state.page = Math.min(state.page, pageCount - 1);
  save(player, state);
  const pageApps = state.apps.slice(state.page * pageSize, (state.page + 1) * pageSize);
  const form = new ActionFormData().title(formTitle(state, "POCKET PHONE"));
  form.body(`§7${now().toLocaleDateString()}   Wi-Fi ▮▮▮   Signal ▮▮▮   Battery 87%\n§fPage ${state.page + 1}/${pageCount}\n§8Dock: ${state.dock.join("  ·  ")}`);
  for (const app of pageApps) form.button(buttonText(app));
  form.button("‹  Previous page");
  form.button("Next page  ›");
  form.button("▣  Dock / Organize");
  const result = await form.show(player);
  if (result.canceled) return;
  if (result.selection < pageApps.length) return openApp(player, pageApps[result.selection]);
  if (result.selection === pageApps.length) { state.page = (state.page + pageCount - 1) % pageCount; save(player, state); return home(player); }
  if (result.selection === pageApps.length + 1) { state.page = (state.page + 1) % pageCount; save(player, state); return home(player); }
  return organize(player);
}

async function organize(player) {
  const state = load(player);
  const form = new ActionFormData().title(formTitle(state, "ORGANIZE")).body("Choose an app to add or remove from the dock.");
  for (const app of state.apps) form.button(`${state.dock.includes(app) ? "★" : "☆"} ${app}`);
  const result = await form.show(player);
  if (result.canceled) return home(player);
  const app = state.apps[result.selection];
  state.dock = state.dock.includes(app) ? state.dock.filter(x => x !== app) : [...state.dock, app];
  save(player, state);
  return organize(player);
}

async function openApp(player, app) {
  if (app === "Phone") return phone(player);
  if (app === "Contacts") return contacts(player);
  if (app === "Messages") return messages(player);
  if (app === "Calculator") return calculator(player);
  if (app === "Notes") return notes(player);
  if (app === "Reminders") return reminders(player);
  if (app === "Settings") return settings(player);
  if (app === "Store") return store(player);
  if (app === "Clock") return clock(player);
  if (app === "Calendar") return calendar(player);
  if (app === "Weather") return weather(player);
  if (app === "Files") return files(player);
  if (app === "Camera") return camera(player);
  if (app === "Photos") return photos(player);
  if (app === "Browser") return browser(player);
  const result = await new MessageFormData().title(formTitle(load(player), app)).body(`${app} is installed and ready.`).button1("Back to phone").button2("Close").show(player);
  if (!result.canceled && result.selection === 0) return home(player);
}

async function phone(player) {
  const state = load(player);
  const form = new ActionFormData().title(formTitle(state, "PHONE")).body("Simulated calling").button("Dial a contact").button("Back");
  state.contacts.forEach(c => form.button(`${c.name}  |  ${c.number}`));
  const result = await form.show(player);
  if (result.canceled || result.selection === 1) return home(player);
  if (result.selection === 0) return contacts(player);
  const contact = state.contacts[result.selection - 2];
  if (contact) player.sendMessage(`§aCalling ${contact.name} at ${contact.number}...`);
  return phone(player);
}

async function contacts(player) {
  const state = load(player);
  const form = new ActionFormData().title(formTitle(state, "CONTACTS")).body(state.contacts.map((c, i) => `${i + 1}. ${c.name}  ${c.number}`).join("\n") || "No contacts saved.").button("＋ Add contact").button("Back");
  state.contacts.forEach(c => form.button(`${c.name}  |  ${c.number}`));
  const result = await form.show(player);
  if (result.canceled || result.selection === 1) return home(player);
  if (result.selection === 0) {
    const input = await new ModalFormData().title("New contact").textField("Name", "Alex").textField("Phone number", "555-0100").show(player);
    if (!input.canceled) { state.contacts.push({ name: input.formValues[0], number: input.formValues[1] }); save(player, state); }
    return contacts(player);
  }
  return contacts(player);
}

async function messages(player) {
  const state = load(player);
  const body = state.messages.map(m => `[${m.time}] ${m.from}: ${m.text}`).join("\n") || "No messages yet.";
  const result = await new ActionFormData().title(formTitle(state, "MESSAGES")).body(body).button("＋ New message").button("Back").show(player);
  if (result.canceled || result.selection === 1) return home(player);
  const input = await new ModalFormData().title("New message").textField("Recipient", "Alex").textField("Message", "Hello!").show(player);
  if (!input.canceled) { state.messages.push({ from: "You → " + input.formValues[0], text: input.formValues[1], time: stamp() }); save(player, state); player.sendMessage("§bMessage sent."); }
  return messages(player);
}

async function calculator(player) {
  const input = await new ModalFormData().title("CALCULATOR").textField("Expression", "12 + 8 * 2").show(player);
  if (!input.canceled) { let value; try { if (!/^[0-9+\-*/(). %]+$/.test(input.formValues[0])) throw new Error(); value = Function(`"use strict"; return (${input.formValues[0]})`)(); } catch (_) { value = "Invalid expression"; } player.sendMessage(`§bCalculator: ${value}`); }
  return home(player);
}

async function notes(player) {
  const state = load(player);
  const result = await new ActionFormData().title(formTitle(state, "NOTES")).body(state.notes.map((n, i) => `${i + 1}. ${n}`).join("\n") || "No notes saved.").button("＋ New note").button("Back").show(player);
  if (result.canceled || result.selection === 1) return home(player);
  const input = await new ModalFormData().title("New note").textField("Note", "Remember to gather wood").show(player);
  if (!input.canceled) { state.notes.push(input.formValues[0]); save(player, state); }
  return notes(player);
}

async function reminders(player) {
  const state = load(player);
  const result = await new ActionFormData().title(formTitle(state, "REMINDERS")).body(state.reminders.join("\n") || "No reminders.").button("＋ Add reminder").button("Back").show(player);
  if (result.canceled || result.selection === 1) return home(player);
  const input = await new ModalFormData().title("Reminder").textField("Reminder", "Visit the village").show(player);
  if (!input.canceled) { state.reminders.push(input.formValues[0]); save(player, state); }
  return reminders(player);
}

async function settings(player) {
  const state = load(player);
  const input = await new ModalFormData().title("SETTINGS").dropdown("Wallpaper", ["Ocean Blue", "Sunset", "Forest", "Midnight"], ["Ocean Blue", "Sunset", "Forest", "Midnight"].indexOf(state.wallpaper)).toggle("Dark mode", state.dark).slider("Brightness", 10, 100, 10, 80).slider("Volume", 0, 100, 10, 80).show(player);
  if (!input.canceled) { state.wallpaper = ["Ocean Blue", "Sunset", "Forest", "Midnight"][input.formValues[0]]; state.dark = input.formValues[1]; save(player, state); }
  return home(player);
}

async function store(player) {
  const state = load(player);
  const available = ["Podcasts", "Radio", "Video Player", "Drawing", "Character Creator", "Wallpaper Creator", "Video Editor", "Music Creator", "Photo Collage", "Social Feed"].filter(x => !state.apps.includes(x));
  const form = new ActionFormData().title(formTitle(state, "APP STORE")).body("Install available phone apps. Installed apps are saved.");
  available.forEach(x => form.button(`＋ ${x}`)); form.button("Back");
  const result = await form.show(player);
  if (result.canceled || result.selection === available.length) return home(player);
  state.apps.push(available[result.selection]); save(player, state); player.sendMessage(`§aInstalled ${available[result.selection]}.`); return store(player);
}

async function clock(player) { await new ActionFormData().title(formTitle(load(player), "CLOCK")).body(`Time: ${now().toLocaleTimeString()}\nDate: ${now().toLocaleDateString()}\n\nAlarms, stopwatch, and timer are available as in-game controls.`).button("Back").show(player); return home(player); }
async function calendar(player) { await new ActionFormData().title(formTitle(load(player), "CALENDAR")).body(now().toDateString() + "\n\nNo events scheduled.").button("Back").show(player); return home(player); }
async function weather(player) { await new ActionFormData().title(formTitle(load(player), "WEATHER")).body("Overworld forecast\nClear skies\nTemperature: comfortable\nWeather is based on the current world conditions.").button("Back").show(player); return home(player); }
async function files(player) { const state = load(player); await new ActionFormData().title(formTitle(state, "FILES")).body(`Phone data\nContacts: ${state.contacts.length}\nMessages: ${state.messages.length}\nNotes: ${state.notes.length}\nPhotos: ${state.photos.length}`).button("Back").show(player); return home(player); }
async function camera(player) { const state = load(player); const input = await new ModalFormData().title("CAMERA").textField("Photo caption", "A day in Minecraft").show(player); if (!input.canceled) { state.photos.push({ caption: input.formValues[0], time: stamp() }); save(player, state); player.sendMessage("§aPhoto saved to Photos."); } return home(player); }
async function photos(player) { const state = load(player); await new ActionFormData().title(formTitle(state, "PHOTOS")).body(state.photos.map((p, i) => `${i + 1}. ${p.caption}  |  ${p.time}`).join("\n") || "No photos saved.").button("Back").show(player); return home(player); }
async function browser(player) { const input = await new ModalFormData().title("BROWSER").textField("Website or search query", "Minecraft news").show(player); if (!input.canceled) player.sendMessage(`§bSearch request saved: ${input.formValues[0]} (external web access depends on the device).`); return home(player); }

world.afterEvents.worldInitialize.subscribe(event => { const definition = new DynamicPropertiesDefinition(); definition.defineString(KEY, 32767); event.propertyRegistry.registerEntityTypeDynamicProperties(definition, "minecraft:player"); });
world.afterEvents.playerSpawn.subscribe(event => { if (event.initialSpawn) system.runTimeout(() => home(event.player), 20); });
world.beforeEvents.chatSend.subscribe(event => { if (event.message.toLowerCase() === "phone") { event.cancel = true; system.run(() => home(event.sender)); } });
