// Hashikko のホームページを作る（英語版）。src の中身から public にページを書き出す。
//   node site/build.js
// 部品を増やすときは src/parts.json に1つ足し、画面の写真を src/img/part-<id>.png に置く。
// 使っているところの動画は src/video/demo.mp4 に置くと、トップページに出る（なければ静止画の見本）。
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'public');
const parts = JSON.parse(fs.readFileSync(path.join(SRC, 'parts.json'), 'utf8'));
const YEAR = 2026;
const hasVideo = fs.existsSync(path.join(SRC, 'video', 'demo.mp4'));
const hasPoster = fs.existsSync(path.join(SRC, 'video', 'poster.png'));

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hasShot = (id) => fs.existsSync(path.join(SRC, 'img', `part-${id}.png`));

function page({ title, description, root, active, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="${root}style.css">
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="${root}index.html"><span class="mark" aria-hidden="true"></span>Hashikko</a>
  <nav>
    <a href="${root}index.html#how" class="hide-s">How it works</a>
    <a href="${root}index.html#make">Make a tool</a>
    <a href="${root}parts/index.html"${active === 'parts' ? ' aria-current="page"' : ''}>Parts</a>
    ${STORE_URL ? `<a href="${STORE_URL}">Store</a>` : ''}
    <a href="${root}help.html"${active === 'help' ? ' aria-current="page"' : ''}>Help</a>
    <a href="${root}download.html"${active === 'download' ? ' aria-current="page"' : ''}>Download</a>
  </nav>
</div></header>
${body}
<footer><div class="wrap">
  <span>© ${YEAR} Hashikko</span>
  <span><a href="${root}help.html">Help</a> · <a href="${root}privacy.html">Privacy</a></span>
</div></footer>
</body>
</html>
`;
}

const card = (p, root) => `<a class="part" href="${root}parts/${p.id}.html">
  <span class="emo" aria-hidden="true">${p.emoji}</span>
  <span><b>${esc(p.name)}</b><small>${esc(p.tagline)}</small>
  <span class="tag">${p.builtin ? 'Built in' : 'Add from ＋'}</span></span>
</a>`;

// 配る版（src/release.json）。zip は src/downloads に置く。version.json はアプリが「新しい版」を知るために読む
// みんなの部品のストア（公開したら set-addresses.mjs が入れる。空ならリンクを出さない）
const STORE_URL = 'https://taro9213.github.io/hashikko-store/';
const release = JSON.parse(fs.readFileSync(path.join(SRC, 'release.json'), 'utf8'));
const DOWNLOAD = (root = '') => `<a class="btn primary" href="${root}download.html">Download · Free · ${release.mac ? "Windows &amp; Mac" : "Windows"}</a>`;

// 最初の画面の右側：動画があれば動画、なければ「右端からパネルが出ている画面」の見本
const heroVisual = hasVideo
  ? `<video class="demo" src="video/demo.mp4"${hasPoster ? ' poster="video/poster.png"' : ''} autoplay muted loop playsinline aria-label="Hashikko in use: the panel slides out from the right edge while other apps stay open"></video>`
  : `<div class="desk" role="img" aria-label="A desktop with the Hashikko panel sliding out from the right edge">
    <div class="win"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="panel"><img src="img/part-timer.png" alt=""></div>
    <div class="bar"></div>
  </div>`;

// ---------- トップページ ----------
function home() {
  const root = '';
  const body = `
<section class="hero"><div class="wrap">
  <div>
    <p class="eyebrow">A toolbox at the edge of your Windows screen</p>
    <h1>Small tools,<br><em>right at the edge</em> of your screen.</h1>
    <p class="lead">Move your pointer to the right edge and click. A timer, notes, a calculator, a one-click screen cleanup — all right where you are, without leaving what you're doing. Can't find the tool you want? Describe it, and AI builds it for you.</p>
    <div class="ctas">${DOWNLOAD(root)}<a class="btn ghost" href="parts/index.html">See the parts</a></div>
    <p class="note">No account needed. Your data stays on your PC.</p>
  </div>
  ${heroVisual}
</div></section>

<section class="alt"><div class="wrap">
  <p class="eyebrow">How Hashikko is different</p>
  <h2>No searching. No switching.</h2>
  <p class="lead">For a small task, you usually hunt for an app, open it, and then find your way back. Hashikko skips all of that.</p>
  <div class="three">
    <div class="card"><div class="num">1</div><h3>No searching</h3><p>No typing names to find things. Only the tools you use are lined up at the edge.</p></div>
    <div class="card"><div class="num">2</div><h3>No switching</h3><p>The panel opens on top of your screen. The app you're working in stays right where it is.</p></div>
    <div class="card"><div class="num">3</div><h3>Done in place</h3><p>Finish the task inside the panel. Move your pointer away and it slides back.</p></div>
  </div>
</div></section>

<section id="how"><div class="wrap split">
  <div>
    <p class="eyebrow">How it works</p>
    <h2>Point, click, use.</h2>
    <ol class="steps">
      <li><b>Point at the middle of the right edge</b><span>A small tab slides out.</span></li>
      <li><b>Click the tab</b><span>The panel slides in. Switch tools with the icons at the top.</span></li>
      <li><b>Use it right there</b><span>When you're done, move your pointer away. The panel tucks itself back.</span></li>
    </ol>
  </div>
  <div class="shot"><img src="img/part-tidy.png" alt="The Tidy part: a large Tidy up button and options for what to tidy"><img src="img/part-todo.png" alt="The To-do part with three tasks"></div>
</div></section>

<section id="make" class="alt"><div class="wrap split flip">
  <div>
    <p class="eyebrow">Make your own</p>
    <h2>Need a tool? Just describe it.</h2>
    <p class="lead">No coding. Describe the tool you want in plain words, and AI builds it.</p>
    <ol class="steps">
      <li><b>Describe it</b><span>Like "a timer that alternates 25 minutes of work and 5 minutes of rest."</span></li>
      <li><b>Ask AI</b><span>Hashikko writes the request for you. Paste it into Claude or another AI and send.</span></li>
      <li><b>Add it</b><span>Load what the AI made and click Add. It's ready in your edge panel.</span></li>
    </ol>
    <p class="note">Tools you make run in a protected space that can't connect to the internet. Using an AI service requires an account with that service.</p>
  </div>
  <div class="shot"><img src="img/make-1.png" alt="Step 1 of making a tool: describe what you want"><img src="img/store.png" alt="The Find parts screen listing available parts"></div>
</div></section>

<section><div class="wrap">
  <p class="eyebrow">Parts</p>
  <h2>Tools you can use today</h2>
  <p class="lead">Three are built in. Add more from the ＋ button at the top right.</p>
  <div class="grid">
    ${parts.map((p) => card(p, root)).join('\n    ')}
  </div>
  <p style="margin-top:22px"><a href="parts/index.html">See all parts →</a></p>
</div></section>

<section class="alt"><div class="wrap">
  <p class="eyebrow">Peace of mind</p>
  <h2>Light, free, and private.</h2>
  <div class="safe">
    <div class="card"><h3>Free, no sign-up</h3><p>Install it and start using it. No email address needed.</p></div>
    <div class="card"><h3>Your data stays home</h3><p>Notes and settings are saved only on your PC. Nothing is sent anywhere.</p></div>
    <div class="card"><h3>About 1 MB</h3><p>A tiny app that won't slow your PC down.</p></div>
  </div>
</div></section>

<section class="cta"><div class="wrap">
  <h2>Make the edge of your screen your toolbox.</h2>
  <p class="lead">Free for Windows 10 and 11${release.mac ? ", and for Mac" : ". Mac version coming soon"}. Preview version.</p>
  <div class="ctas" style="justify-content:center;display:flex;margin-top:18px">${DOWNLOAD(root)}</div>
</div></section>
`;
  return page({
    title: 'Hashikko — Small tools at the edge of your screen',
    description: 'Point at the right edge of your screen and click. A timer, notes, a calculator and a one-click screen cleanup for Windows, right where you are. Describe a tool you want and AI builds it.',
    root, body,
  });
}

// ---------- 部品の一覧 ----------
function gallery() {
  const root = '../';
  const builtin = parts.filter((p) => p.builtin);
  const added = parts.filter((p) => !p.builtin);
  const body = `
<section><div class="wrap">
  <p class="eyebrow">Parts</p>
  <h1 style="margin:0 0 10px">Hashikko parts</h1>
  <p class="lead">Parts are small tools that run in the panel at the edge of your screen. All of them are free.</p>
  <h2 style="margin-top:40px">Built in</h2>
  <div class="grid">${builtin.map((p) => card(p, root)).join('\n')}</div>
  <h2 style="margin-top:44px">Add from ＋</h2>
  <div class="grid">${added.map((p) => card(p, root)).join('\n')}
    <div class="part wish"><span class="emo" aria-hidden="true">💡</span><span><b>Don't see what you need?</b><small>In Hashikko, click ＋ → "Make it with AI" to build your own. A place to share parts with everyone is on the way.</small></span></div>
  </div>
</div></section>`;
  return page({
    title: 'Parts — Hashikko',
    description: 'All parts for Hashikko: Tidy, Notes, Music, Timer, Calculator, To-do, Word count and World clock.',
    root, active: 'parts', body,
  });
}

// ---------- 部品ごとのページ ----------
function partPage(p) {
  const root = '../';
  const others = parts.filter((x) => x.id !== p.id).slice(0, 3);
  const how = p.builtin
    ? `${esc(p.name)} comes with Hashikko. Click the tab at the right edge of your screen, then click the ${esc(p.name)} icon at the top.`
    : `In Hashikko, click ＋ at the top right and click Add next to ${esc(p.name)}. After that, open it from its icon at the top.`;
  const side = hasShot(p.id)
    ? `<img src="../img/part-${p.id}.png" alt="The ${esc(p.name)} part">`
    : `<div class="fake"><div><div class="emo" aria-hidden="true">${p.emoji}</div><p>Screenshot coming soon</p></div></div>`;
  const body = `
<div class="wrap">
  <div class="crumbs"><a href="../index.html">Hashikko</a> › <a href="index.html">Parts</a> › ${esc(p.name)}</div>
  <div class="pd">
    <div>
      <div class="emo" aria-hidden="true">${p.emoji}</div>
      <h1>${esc(p.title)}</h1>
      <p class="lead">${esc(p.intro)}</p>
      <span class="tag">${p.builtin ? 'Built in' : 'Add from ＋'}</span>
      <h2>What it does</h2>
      <ul>${p.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <h2>Great for</h2>
      <p>${esc(p.scene)}</p>
      <h2>How to use it</h2>
      <p class="how">${how}</p>
      <div class="ctas" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:24px">${DOWNLOAD(root)}</div>
    </div>
    <div class="side">${side}</div>
  </div>
</div>
<section class="alt"><div class="wrap">
  <h2 style="margin-top:0">More parts</h2>
  <div class="grid">${others.map((x) => card(x, root)).join('\n')}</div>
</div></section>`;
  return page({
    title: `${p.name} — ${p.tagline} | Hashikko`,
    description: `${p.tagline}. ${p.intro}`,
    root, active: 'parts', body,
  });
}

// ---------- プライバシー ----------
function privacy() {
  const root = '';
  const body = `
<section><div class="wrap" style="max-width:760px">
  <h1>Privacy</h1>
  <p class="note">Last updated: November 15, ${YEAR}</p>
  <p>Hashikko is a free, personal project. Questions about privacy: <a href="mailto:hashikkotaro@gmail.com">hashikkotaro@gmail.com</a>.</p>
  <h2>Hashikko (Windows and Mac app)</h2>
  <ul>
    <li><b>Notes, to-dos, settings and other data</b> are saved only on your PC (in %LOCALAPPDATA%\\HashikkoPlayer). They are never sent to the developer or anyone else.</li>
    <li><b>Pointer position</b> is used only to check whether it has reached the right edge of the screen, so the panel can open. It is not stored.</li>
    <li><b>Tidy</b> temporarily saves the state of your windows and taskbar on your PC, only so it can restore them.</li>
    <li><b>Parts you add</b> run in a sandbox that cannot connect to the internet.</li>
    <li><b>When you ask AI to make a tool</b>, you paste your description into an AI service you choose. Hashikko never sends it automatically. What you send is handled under that service's own terms.</li>
    <li>There is no analytics, advertising or tracking.</li>
  </ul>
  <h2>What the app downloads</h2>
  <ul>
    <li>The list of store parts, parts you add, and the list of removed parts, from the Hashikko Store on GitHub. A small file on this website, to tell you when a new version is out. These requests send nothing about you.</li>
  </ul>
  <h2>The Hashikko Store: sharing, sign-in, follows and reports</h2>
  <p>Using and adding parts never needs an account. Signing in is only needed to share a part or report one.</p>
  <ul>
    <li><b>Sign in with Google.</b> Google tells the Hashikko store service a number that identifies your Google account. The service keeps that number, so it knows the same person when you come back. It does not ask for or keep your email address. Your Google name is offered once as a suggestion for your channel name, held for at most 10 minutes during sign-in, and not kept.</li>
    <li><b>Your channel.</b> The channel name and @handle you choose are shown publicly in the store, with the parts you share. People in the store never see your Google name or email.</li>
    <li><b>Parts you share</b> (their full code, name and description) are published for review in the public Hashikko Store repository on GitHub, under your channel, and in the store once approved.</li>
    <li><b>A Hashikko ID.</b> The app makes a random key on your computer. Only a one-way scrambled form of it (a hash) is sent, so the store can count each computer once (follows and how many people use a part) and know that updates to a part come from the same creator. It cannot be turned back into the key and holds nothing about you.</li>
    <li><b>Reports.</b> The part, the reason and your details are filed in the public repository. Who sent the report is not shown there; it is kept by the store service and seen only by reviewers, to stop abuse.</li>
    <li><b>Rule-breaks.</b> Warnings, strikes and appeals are kept with your channel, so the store rules can be applied fairly. Reviewers see your channel's history.</li>
    <li><b>Where it is kept.</b> The store service runs on Cloudflare Workers, and its records are kept in Cloudflare's storage. Shared parts and reports are on GitHub. Each handles data under its own privacy policy.</li>
    <li><b>Deleting your data.</b> Sign out from your channel in the app at any time. To delete your channel and its records, email the address above from any account and include your @handle; we will confirm it's yours before deleting. Parts already in the store stay until you ask for them to be removed.</li>
  </ul>
  <h2>The Music part and the "Hashikko Player" Chrome extension</h2>
  <ul>
    <li>For Spotify and other music apps, the Music part reads the song title, artist and album art that Windows shows in its media controls, and sends play, pause and skip commands to that app. This happens only on your PC; Hashikko does not connect to your Spotify account.</li>
    <li>On www.youtube.com, the extension reads the title, channel name and playlist of what you're playing, only to show them in the panel.</li>
    <li>The extension and the app talk to each other only inside your PC (127.0.0.1).</li>
    <li>Thumbnails load directly from YouTube's image server (i.ytimg.com).</li>
    <li>It does not read personal information, browsing history, or any site other than YouTube.</li>
  </ul>
  <h2>This website</h2>
  <p>This website has no analytics, advertising or tracking.</p>
</div></section>`;
  return page({ title: 'Privacy — Hashikko', description: 'How Hashikko handles your data: notes and settings stay on your computer; sharing and sign-in are optional.', root, body });
}


// ---------- 困ったとき（試験版のあいだ、よくあることと直し方） ----------
const HELP = [
  { h: 'Getting started', items: [
    ['Windows says "Windows protected your PC"', 'Click <b>More info</b>, then <b>Run anyway</b>. This appears because the preview version is not signed yet. You only see it the first time.'],
    ['Nothing happens when I open the app from inside the zip', 'Right-click the zip and choose <b>Extract All</b> first, then open <b>HashikkoPlayer</b> in the extracted folder. Apps can’t run from inside a zip.'],
    ['The app doesn’t start on Windows 10', 'Install the free <a href="https://go.microsoft.com/fwlink/p/?LinkId=2124703">WebView2 Runtime</a> from Microsoft, then open Hashikko again.'],
    ['Mac says it can’t check Hashikko for malware', 'Click <b>Done</b>. Then open <b>System Settings → Privacy &amp; Security</b>, scroll to the bottom and click <b>Open Anyway</b> next to Hashikko. You only do this once. It appears because the test version is not notarized by Apple yet.'],
  ]},
  { h: 'The panel', items: [
    ['The tab on the right edge is gone', 'Hashikko has probably stopped running, for example after Windows restarted for an update. Open <b>HashikkoPlayer</b> again. To keep it running after a restart, open the panel, click the gear icon and turn on <b>Start with Windows</b>.'],
    ['The panel opens but it’s blank', 'Quit Hashikko and open it again. On Windows, right-click the Hashikko icon near the clock and choose <b>Quit</b>. On a Mac, use the menu bar icon.'],
    ['I can’t find the tab', 'Move your pointer to the middle of the right edge of the screen and wait a moment. On a Mac you can also press <b>Option + Shift + Y</b>.'],
  ]},
  { h: 'Parts', items: [
    ['Tidy left my windows hidden', 'Open the panel and click <b>Restore</b> in Tidy. If Hashikko closed while things were tidied, it puts them back the next time it starts.'],
    ['Music shows nothing', 'Start playing something first, then open the panel. To see a whole YouTube playlist, add the Chrome extension that comes in the zip (see README.txt).'],
    ['A part I added stopped working', 'Hashikko stops a part that stops responding, so the rest of the panel keeps working. Open the part again. If it keeps happening, remove it and tell the person who made it.'],
    ['The part AI made won’t load', 'In <b>Make your own</b>, Hashikko tells you what went wrong and gives you a message to send back to the AI. Paste it, then copy the new code.'],
  ]},
  { h: 'Still stuck?', items: [
    ['How do I tell you what happened?', 'Open the panel, click the gear icon, then <b>Copy feedback form</b>. Paste it into a message, write what you did and what you saw, and send it to the person who gave you Hashikko.'],
  ]},
];

function help() {
  const root = '';
  const body = `
<section><div class="wrap" style="max-width:760px">
  <h1>Help</h1>
  <p class="lead">Hashikko is still a preview. If something goes wrong, the fix is usually here.</p>
  ${HELP.map((g) => `<h2>${esc(g.h)}</h2>
  <div class="faq">${g.items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a}</p></details>`).join('')}</div>`).join('\n  ')}
</div></section>`;
  return page({ title: 'Help — Hashikko', description: 'Fixes for common problems while Hashikko is in preview.', root, active: 'help', body });
}


// ---------- ダウンロード ----------
function download() {
  const root = '';
  const kb = (f) => Math.round(fs.statSync(path.join(SRC, 'downloads', f)).size / 1024);
  // release.json で null の OS は「準備中」と出す
  const box = (os, r, steps) => !r ? `<div class="card dl">
    <h2>${os}</h2>
    <p class="note">Coming soon</p>
    <p>The ${os} version is being updated. Check back soon.</p>
  </div>` : `<div class="card dl">
    <h2>${os}</h2>
    <p class="note">Version ${esc(r.version)} · ${kb(r.file)} KB · preview</p>
    <a class="btn primary" href="downloads/${esc(r.file)}" download>Download for ${os}</a>
    <ol>${steps.map((x) => `<li>${x}</li>`).join('')}</ol>
  </div>`;
  const body = `
<section><div class="wrap" style="max-width:900px">
  <h1>Download Hashikko</h1>
  <p class="lead">Free. This is a preview version, shared with friends first. If something goes wrong, see <a href="help.html">Help</a>.</p>
  <div class="dlgrid">
  ${box('Windows', release.windows, [
    'Right-click the zip and choose <b>Extract All</b>.',
    'Open <b>HashikkoPlayer</b> in the extracted folder.',
    'If a blue “Windows protected your PC” screen appears, click <b>More info</b>, then <b>Run anyway</b>. The preview is not signed yet.',
    'Move your pointer to the middle of the right edge of your screen and click the tab.',
  ])}
  ${box('Mac', release.mac, [
    'Unzip, then drag <b>Hashikko</b> into your Applications folder.',
    'Open it. When macOS says it can’t check the app, click <b>Done</b>.',
    'Open <b>System Settings → Privacy &amp; Security</b>, scroll down and click <b>Open Anyway</b>. You only do this once.',
    'Move your pointer to the middle of the right edge, or press <b>Option + Shift + Y</b>.',
  ])}
  </div>
  <p class="note">The zip also has a README with more details, and an optional Chrome extension for YouTube playlists. When a new version comes out, Hashikko shows a note in its settings, and you download it here again. Your notes and parts stay as they are.</p>
</div></section>`;
  return page({ title: 'Download — Hashikko', description: 'Download Hashikko for Windows or Mac. Free preview.', root, active: 'download', body });
}

// ---------- 書き出し ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'parts'), { recursive: true });
fs.cpSync(path.join(SRC, 'img'), path.join(OUT, 'img'), { recursive: true });
if (fs.existsSync(path.join(SRC, 'video'))) fs.cpSync(path.join(SRC, 'video'), path.join(OUT, 'video'), { recursive: true });
fs.copyFileSync(path.join(SRC, 'style.css'), path.join(OUT, 'style.css'));
const write = (rel, html) => fs.writeFileSync(path.join(OUT, rel), html, 'utf8');
write('index.html', home());
write('parts/index.html', gallery());
for (const p of parts) write(`parts/${p.id}.html`, partPage(p));
write('privacy.html', privacy());
write('help.html', help());
write('download.html', download());
fs.cpSync(path.join(SRC, 'downloads'), path.join(OUT, 'downloads'), { recursive: true });
write('version.json', JSON.stringify({ version: release.version, date: release.date, notes: release.notes || '' }, null, 2) + '\n');
console.log(`Built: ${OUT} (${parts.length + 5} pages${hasVideo ? ', with demo video' : ', no demo video yet'})`);
