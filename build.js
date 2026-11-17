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
// 見た人の数：Cloudflare Web Analytics（Cookie なし）。ダッシュボードの「Add a site」でもらう token を入れる。空なら何も入れない
const CF_ANALYTICS_TOKEN = '0cfe4a63550a439892b8ff64124e4914';
// Google Search Console の「HTML タグ」で確かめるときの値（content="..." の中身）。本人が Search Console で受け取って入れる
const GSC_VERIFY = '';
// style.css を変えたら、ブラウザーが古いものを使わないように、中身から作った印を住所に付ける
const CSS_VER = require('crypto').createHash('sha256').update(fs.readFileSync(path.join(__dirname, 'src', 'style.css'))).digest('hex').slice(0, 10);
// ダウンロードの数：ボタンはストアの窓口を通る（数えてから zip に送る）。数は本人だけが見られる（Cloudflare の Workers KV → DB → downloads）
const SERVICE = 'https://hashikko-store.hashikko.workers.dev/';
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
<meta property="og:site_name" content="Hashikko">
<meta property="og:image" content="https://taro9213.github.io/hashikko/${hasPoster ? 'video/poster.png' : 'img/logo-512.png'}">
<meta name="twitter:card" content="summary_large_image">
${GSC_VERIFY ? `<meta name="google-site-verification" content="${esc(GSC_VERIFY)}">\n` : ''}<link rel="icon" href="${root}img/logo.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}style.css?v=${CSS_VER}">
${CF_ANALYTICS_TOKEN ? `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${esc(CF_ANALYTICS_TOKEN)}"}'></script>\n` : ''}</head>
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

// 短い動画（くり返し、音なし）。src/video/clip-<名前>.mp4 があれば出す。なければ代わりの絵（fallback）
// 動画は hashikko-win/video の clips.html から作る（render.mjs と FFmpeg）
const hasClip = (n) => fs.existsSync(path.join(SRC, 'video', `clip-${n}.mp4`));
const clip = (n, root, label, fallback = '') => hasClip(n)
  ? `<video class="clipv" src="${root}video/clip-${n}.mp4" poster="${root}video/clip-${n}.jpg" autoplay muted loop playsinline preload="metadata" aria-label="${label}"></video>`
  : fallback;
const PART_CLIPS = { memo: 'In a video call, the panel slides out from the right edge and a note is typed', tidy: 'A messy screen during a video call is tidied up in one click, leaving only the call and the presentation', music: 'While writing, the music is paused from the edge panel without switching apps' };

// 最初の画面の右側：動画があれば動画、なければ「右端からパネルが出ている画面」の見本
const heroVisual = hasVideo
  // パソコンの画面では字が小さいので、押すと全画面で最初から見られる（もう一度押すか Esc で戻る）
  ? `<div class="vwrap"><video class="demo" id="heroVideo" src="video/demo.mp4"${hasPoster ? ' poster="video/poster.png"' : ''} autoplay muted loop playsinline aria-label="Hashikko in use: the panel slides out from the right edge while other apps stay open"></video>
  <button class="vfull" id="heroFull" type="button" aria-label="Watch the video full screen">⛶ Watch full screen</button></div>
  <script>
  (() => {
    const v = document.getElementById('heroVideo'), b = document.getElementById('heroFull');
    // 全画面にできないブラウザーでは、ページの上に大きく出す（外側を押すか Esc で閉じる）
    const box = () => {
      const o = document.createElement('div'); o.className = 'vbox';
      const big = v.cloneNode(); big.removeAttribute('id'); big.controls = true; big.muted = true; big.loop = true; big.autoplay = true;
      o.append(big); document.body.append(o); big.play();
      const close = () => { o.remove(); document.removeEventListener('keydown', esc); };
      const esc = (e) => { if (e.key === 'Escape') close(); };
      o.addEventListener('click', (e) => { if (e.target === o) close(); }); document.addEventListener('keydown', esc);
    };
    const full = () => {
      v.currentTime = 0; v.controls = true; v.play();
      if (v.requestFullscreen) {
        let done = false;
        const fallback = () => { if (done || document.fullscreenElement) return; done = true; v.controls = false; box(); };
        v.requestFullscreen().catch(fallback);
        setTimeout(fallback, 600);   // 断られたと知らせないブラウザーもある
      }
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();   // iPhone
      else { v.controls = false; box(); }
    };
    v.addEventListener('click', () => { if (!document.fullscreenElement) full(); });
    b.addEventListener('click', full);
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) v.controls = false; });
  })();
  </script>`
  : `<div class="desk" role="img" aria-label="A desktop with the Hashikko panel sliding out from the right edge">
    <div class="win"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="panel"><img src="img/part-timer.png" alt=""></div>
    <div class="bar"></div>
  </div>`;

// ---------- トップページ ----------
function home() {
  const root = '';
  // 検索エンジンに「無料のアプリ」だと伝える（構造化データ）
  const ld = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Hashikko', alternateName: 'はしっこ',
    applicationCategory: 'ProductivityApplication', operatingSystem: release.mac ? 'Windows 10, Windows 11, macOS' : 'Windows 10, Windows 11',
    url: 'https://taro9213.github.io/hashikko/', image: 'https://taro9213.github.io/hashikko/img/logo-512.png', softwareVersion: release.windows.version,
    description: 'Small tools at the edge of your screen: notes, a one-click screen cleanup before you share, music controls, a timer and more. Describe a tool and AI builds it.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } };
  const body = `
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<section class="hero"><div class="wrap">
  <div>
    <p class="eyebrow">A toolbox at the edge of your screen · Windows and Mac</p>
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
  ${clip('how', '', 'With many browser tabs open, the pointer goes to the right edge, the panel slides out, and a note is typed in Notes', '<div class="shot"><img src="img/part-tidy.png" alt="The Tidy part"><img src="img/part-todo.png" alt="The To-do part with three tasks"></div>')}
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
  ${clip('make', '', 'Wishing for a timer that says when to take a break, the person types the idea into Make your own, and a Pomodoro timer appears in the panel', '<div class="shot"><img src="img/make-1.png" alt="Step 1 of making a tool: describe what you want"><img src="img/store.png" alt="The Find parts screen"></div>')}
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
  const video = PART_CLIPS[p.id] && hasClip(p.id);
  const side = video ? clip(p.id, root, PART_CLIPS[p.id])
    : hasShot(p.id)
    ? `<img src="../img/part-${p.id}.png" alt="The ${esc(p.name)} part">`
    : `<div class="fake"><div><div class="emo" aria-hidden="true">${p.emoji}</div><p>Screenshot coming soon</p></div></div>`;
  // Music：YouTube をもっと便利にする拡張機能（Hashikko Player）のページへ
  const extra = p.id === 'music' ? `
      <div class="callout"><h2>Hashikko Player makes YouTube even better</h2>
      <p>Add the free Hashikko Player extension for Chrome, and the Music part shows your whole YouTube playlist with thumbnails. Jump to any song right from the edge.</p>
      <div style="display:flex;flex-wrap:wrap;gap:10px"><a class="btn primary" href="${CWS_URL}">Add to Chrome — free</a><a class="btn ghost" href="../player.html">About Hashikko Player →</a></div></div>` : '';
  const body = `
<div class="wrap">
  <div class="crumbs"><a href="../index.html">Hashikko</a> › <a href="index.html">Parts</a> › ${esc(p.name)}</div>
  <div class="pd${video ? ' v' : ''}">
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
      <p class="how">${how}</p>${extra}
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

// ---------- Hashikko Player（Chrome の拡張機能）のページ ----------
// Chrome ウェブストアに載るまでは、入れ方の手順は出さない（本人の判断）。載ったら CWS_URL に住所を入れる
const CWS_URL = 'https://chromewebstore.google.com/detail/hashikko-player/dloamahidgmnonkpnekebbhkpfkaghoa';
function player() {
  const root = '';
  const body = `
<div class="wrap">
  <div class="crumbs"><a href="index.html">Hashikko</a> › <a href="parts/index.html">Parts</a> › <a href="parts/music.html">Music</a> › Hashikko Player</div>
  <div class="pd">
    <div>
      <div class="emo" aria-hidden="true">▶️</div>
      <h1>Hashikko Player for Chrome</h1>
      <p class="lead">A free Chrome extension that makes YouTube even better with Hashikko. See your whole YouTube playlist in the Music part, with thumbnails, and jump to any song from the edge of your screen.</p>
      <h2>What it adds</h2>
      <ul>
        <li>The whole mix or playlist you're playing on YouTube, with thumbnails</li>
        <li>Click a song in the Music part to play it, without going back to your YouTube tab</li>
        <li>Works together with play, pause and skip, which the Music part already does</li>
      </ul>
      <h2>Do I need it?</h2>
      <p>No. Without it, the Music part already plays, pauses and skips YouTube, Spotify and most music apps. Hashikko Player only adds the playlist.</p>
      <h2>Get it</h2>
      ${CWS_URL ? `<p><a class="btn primary" href="${CWS_URL}">Add to Chrome — free</a></p>` : `<p class="how">Coming soon to the Chrome Web Store. It's being reviewed by Google now, and the button to add it will appear here when it's ready.</p>`}
      <h2>Your privacy</h2>
      <p>It only reads what's playing on www.youtube.com, and it talks only to Hashikko on your own computer. Nothing is sent to us or anyone else. See <a href="privacy.html">Privacy</a>.</p>
    </div>
    <div class="side"><div class="fake"><div><div class="emo" aria-hidden="true">🎵</div><p>Your YouTube playlist, right in the Music part</p></div></div></div>
  </div>
</div>`;
  return page({ title: 'Hashikko Player — see your YouTube playlist from the edge | Hashikko', description: 'A free Chrome extension for Hashikko: see your whole YouTube playlist in the Music part and jump to any song.', root, active: 'parts', body });
}

// ---------- プライバシー ----------
function privacy() {
  const root = '';
  const body = `
<section><div class="wrap" style="max-width:760px">
  <h1>Privacy</h1>
  <p class="note">Last updated: November 17, ${YEAR}</p>
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
  <h2>The Calendar part (Google Calendar)</h2>
  <ul>
    <li>Only if you click <b>Connect Google Calendar</b>, the app asks Google for <b>read-only</b> access to your calendar. It cannot add, change or delete events.</li>
    <li>The app talks to Google directly from your computer. Your events are not sent to the Hashikko store service, to the developer, or to anyone else, and are not stored; they are read again when the panel is open.</li>
    <li>The key that lets the app read your calendar is kept only on your computer, encrypted so that only your Windows account can unlock it.</li>
    <li><b>Disconnect</b> in the Calendar part removes the key from your computer and cancels the access at Google. You can also remove access any time at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.</li>
    <li>Hashikko's use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements.</li>
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
  <ul>
    <li>We count visits with Cloudflare Web Analytics. It does not use cookies and does not collect personal information.</li>
    <li>We count clicks on the Download buttons. To count each person once a day, your IP address is kept only as a scrambled code (a salted hash) for two days, then deleted.</li>
    <li>There is no advertising.</li>
  </ul>
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


const YT_STEPS = [
  'Download Hashikko and unzip it. Inside is a folder named <b>Chrome-extension-for-Music</b>. Move it somewhere it can stay (for example, your Documents folder). Chrome keeps using it, so don’t delete it later.',
  'In Chrome, type <b>chrome://extensions</b> in the address bar and press Enter.',
  'Turn on <b>Developer mode</b> (top right).',
  'Click <b>Load unpacked</b> and choose the <b>Chrome-extension-for-Music</b> folder.',
  'Reload your YouTube tab and play a mix or a playlist. Open Hashikko’s Music part: the whole playlist appears, and you can pick a song.',
];
const ytSection = (h = 'h2') => `<${h}>See your YouTube playlist (optional)</${h}>
<p>With the free <b>Hashikko Player</b> extension for Chrome, the Music part also shows the whole playlist you are playing on YouTube, with thumbnails, and lets you jump to any song. It isn’t in the Chrome Web Store yet, so it takes a few steps:</p>
<ol class="steps-plain">${YT_STEPS.map((x) => `<li>${x}</li>`).join('')}</ol>
<p class="note">The extension only reads what is playing on www.youtube.com, and talks only to Hashikko on your own computer. See <a href="${h === 'h2' ? '../' : ''}privacy.html">Privacy</a>.</p>`;

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
    <a class="btn primary" href="${SERVICE}v1/download?os=${os.toLowerCase()}">Download for ${os}</a>
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
  <p class="note">The zip also has a README with more details. When a new version comes out, Hashikko tells you, and on Windows you just click <b>Update now</b> (from version 0.7.9). If you have an older version, download it here once more. Your notes and parts stay as they are.</p>
</div></section>`;
  return page({ title: 'Download — Hashikko', description: 'Download Hashikko for Windows or Mac. Free preview.', root, active: 'download', body });
}

// ---------- 書き出し ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'parts'), { recursive: true });
fs.cpSync(path.join(SRC, 'img'), path.join(OUT, 'img'), { recursive: true });
if (fs.existsSync(path.join(SRC, 'video'))) fs.cpSync(path.join(SRC, 'video'), path.join(OUT, 'video'), { recursive: true });
fs.copyFileSync(path.join(SRC, 'style.css'), path.join(OUT, 'style.css'));
// 検索エンジン向け：ページごとの正式な住所（canonical・og:url）と、サイトマップ（sitemap.xml、Google Search Console に出す）
const BASE = 'https://taro9213.github.io/hashikko/';
const sitemap = [];
const write = (rel, html) => {
  if (rel.endsWith('.html')) {
    const url = BASE + (rel === 'index.html' ? '' : rel);
    html = html.replace('</head>', `<link rel="canonical" href="${url}">\n<meta property="og:url" content="${url}">\n</head>`);
    sitemap.push(url);
  }
  fs.writeFileSync(path.join(OUT, rel), html, 'utf8');
};
write('index.html', home());
write('parts/index.html', gallery());
for (const p of parts) write(`parts/${p.id}.html`, partPage(p));
write('privacy.html', privacy());
write('help.html', help());
write('player.html', player());
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`);
write('download.html', download());
fs.cpSync(path.join(SRC, 'downloads'), path.join(OUT, 'downloads'), { recursive: true });
// Google Search Console の持ち主の確認ファイル（消さない。消すと確認が外れる）
for (const f of fs.readdirSync(SRC)) if (/^google[0-9a-f]+.html$/.test(f)) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
// version は古いアプリ用（Windows の版）。windows / mac は、それぞれのアプリが自分の版を見る
// windowsZip / windowsSha256：Windows 版（0.7.9 から）の「Update now」が、この zip を取り、指紋が同じか確かめてから入れかえる
const winZip = path.join(SRC, 'downloads', release.windows.file);
const sha256Of = (file) => (fs.existsSync(file) ? require('crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex') : '');
const winSha = sha256Of(winZip);
// macZip / macSha256 / macNotes：Mac 版の「Update now」用（Mac の本体が対応してから使われる）。macNotes は Mac の人に出すお知らせ
const macSha = release.mac ? sha256Of(path.join(SRC, 'downloads', release.mac.file)) : '';
write('version.json', JSON.stringify({ version: release.windows.version, windows: release.windows.version,
  ...(winSha ? { windowsZip: 'downloads/' + release.windows.file, windowsSha256: winSha } : {}),
  ...(release.mac ? { mac: release.mac.version } : {}),
  ...(macSha ? { macZip: 'downloads/' + release.mac.file, macSha256: macSha } : {}),
  ...(release.mac && release.mac.notes ? { macNotes: release.mac.notes } : {}),
  date: release.date, notes: release.notes || '' }, null, 2) + '\n');
console.log(`Built: ${OUT} (${parts.length + 5} pages${hasVideo ? ', with demo video' : ', no demo video yet'})`);
