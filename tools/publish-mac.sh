#!/bin/bash
# Mac 版を、ホームページ（https://taro9213.github.io/hashikko/）に載せる。Mac で動かす。
#   ./tools/publish-mac.sh <Mac版の zip> <版> "<Mac の人へのお知らせ（英語、1〜2文）>"
#   例：./tools/publish-mac.sh ~/Downloads/HashikkoPlayer/hashikko-mac/dist/Hashikko-mac-0.7.11.zip 0.7.11 "Update with one click from now on."
# やること：
#   1. GitHub から最新を取る（Windows で載せた変更を消さないため）
#   2. zip を src/downloads/Hashikko-Mac-<版>.zip に置き、前の Mac 版の zip を消す
#   3. src/release.json の "mac"（file・version・notes）だけを書きかえる（Windows の欄には触らない）
#   4. 確認を出して、よければ commit・push。GitHub がホームページを作り直す（数分）。version.json の指紋（macSha256）も GitHub が計算する
# 要るもの：git と、GitHub に push できること（share/MAC-WEBSITE.md の 1 章）。node は要らない。
set -euo pipefail
cd "$(dirname "$0")/.."

ZIP="${1:-}"; VER="${2:-}"; NOTES="${3:-}"
if [[ -z "$ZIP" || -z "$VER" ]]; then echo "使い方: ./tools/publish-mac.sh <zip> <版> \"<お知らせ>\""; exit 1; fi
if [[ ! -f "$ZIP" ]]; then echo "zip が見つかりません: $ZIP"; exit 1; fi
if [[ ! "$VER" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then echo "版は 0.7.11 のような形で: $VER"; exit 1; fi

# 個人情報が入っていないか（自分の Mac のユーザー名の入った場所）
if unzip -p "$ZIP" 2>/dev/null | LC_ALL=C grep -a -q "/Users/$(id -un)"; then
  echo "zip の中に /Users/$(id -un) が入っています。載せる前に直してください（MAC-FINISH.md の 1 章）"; exit 1
fi
# 署名と公証が済んでいるか（済んでいなければ止める。--unsigned で、承知のうえで進められる）
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
ditto -x -k "$ZIP" "$TMP"
APP="$(find "$TMP" -maxdepth 2 -name '*.app' -type d | head -1)"
if [[ -z "$APP" ]]; then echo "zip の中に .app がありません"; exit 1; fi
APPVER="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$APP/Contents/Info.plist")"
if [[ "$APPVER" != "$VER" ]]; then echo "zip の中のアプリは $APPVER です（$VER と違う）"; exit 1; fi
if ! spctl --assess --type execute "$APP" 2>/dev/null; then
  if [[ "${4:-}" != "--unsigned" ]]; then echo "このアプリは公証されていません（spctl が通らない）。署名と公証をしてから載せてください。承知で載せるなら、最後に --unsigned を付ける"; exit 1; fi
fi

git pull --ff-only
NAME="Hashikko-Mac-$VER.zip"
OLD="$(osascript -l JavaScript -e 'function run(a){var s=$.NSString.stringWithContentsOfFileEncodingError(a[0],$.NSUTF8StringEncoding,null).js;var r=JSON.parse(s);return r.mac?r.mac.file:"";}' "$PWD/src/release.json")"
cp "$ZIP" "src/downloads/$NAME"
if [[ -n "$OLD" && "$OLD" != "$NAME" && -f "src/downloads/$OLD" ]]; then git rm -q "src/downloads/$OLD"; fi
osascript -l JavaScript -e 'function run(a){
  var p=a[0]; var r=JSON.parse($.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,null).js);
  r.mac={file:a[1],version:a[2]}; if(a[3]) r.mac.notes=a[3];
  $(JSON.stringify(r,null,2)+"\n").writeToFileAtomicallyEncodingError(p,true,$.NSUTF8StringEncoding,null); }' \
  "$PWD/src/release.json" "$NAME" "$VER" "$NOTES"
git add "src/downloads/$NAME" src/release.json

echo; echo "---- これから GitHub に送るもの ----"
git status --short
echo; git diff --cached src/release.json
read -r -p "このまま公開しますか？ (y/N) " ok
if [[ "$ok" != "y" && "$ok" != "Y" ]]; then
  git reset -q; rm -f "src/downloads/$NAME"; git checkout -q -- src/release.json src/downloads
  echo "やめました（何も送っていません。元のままです）"; exit 1
fi
git commit -q -m "Mac $VER"
git push -q
echo "送りました。数分で https://taro9213.github.io/hashikko/download.html に出ます。"
