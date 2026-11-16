#!/bin/bash
# Build and sign the "רוסית בכיס" (Russian Pocket) APK, and refresh the
# browser copy under app/.
#
# Signing credentials MUST come from the environment. Never commit a
# keystore, a password, or a path to one.
#
# Required:
#   KEYSTORE        Path to the .keystore / .jks file
#   KEYSTORE_PASS   Keystore password
#
# Optional:
#   KEY_ALIAS       Key alias (default: the first PrivateKeyEntry in the store)
#   KEY_PASS        Key password (default: KEYSTORE_PASS)
#   JAVA_HOME       JDK 8+ compatible javac (default: $HOME/jdk17 if present)
#   ANDROID_SDK     Android SDK root (default: $ANDROID_HOME or $HOME/android-sdk)
#   BUILD_TOOLS     Build-tools version (default: 34.0.0)
#   ANDROID_JAR     android.jar (default: $ANDROID_SDK/platforms/android-28/android.jar)
#   OUT             Output APK path (default: <repo>/download/russian-pocket.apk)
#
# Example:
#   KEYSTORE=/path/to/release.keystore KEYSTORE_PASS=... ./build.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [[ -z "${KEYSTORE:-}" || -z "${KEYSTORE_PASS:-}" ]]; then
  echo "error: set KEYSTORE and KEYSTORE_PASS in the environment." >&2
  echo "       Do not hard-code a keystore path or password in this script." >&2
  exit 1
fi
if [[ ! -f "$KEYSTORE" ]]; then
  echo "error: keystore not found: $KEYSTORE" >&2
  exit 1
fi

if [[ -z "${JAVA_HOME:-}" && -d "$HOME/jdk17" ]]; then
  export JAVA_HOME="$HOME/jdk17"
fi
if [[ -n "${JAVA_HOME:-}" ]]; then
  export PATH="$JAVA_HOME/bin:$PATH"
fi

ANDROID_SDK="${ANDROID_SDK:-${ANDROID_HOME:-$HOME/android-sdk}}"
BUILD_TOOLS_VER="${BUILD_TOOLS:-34.0.0}"
BT="$ANDROID_SDK/build-tools/$BUILD_TOOLS_VER"
JAR="${ANDROID_JAR:-$ANDROID_SDK/platforms/android-28/android.jar}"
OUT="${OUT:-$ROOT/download/russian-pocket.apk}"
KEY_PASS="${KEY_PASS:-$KEYSTORE_PASS}"

if [[ ! -x "$BT/aapt2" || ! -f "$JAR" ]]; then
  echo "error: Android SDK not found. Set ANDROID_SDK (or ANDROID_HOME) and, if needed, BUILD_TOOLS and ANDROID_JAR." >&2
  exit 1
fi

# Concatenate the JS sources into the WebView assets and the browser copy.
mkdir -p "$ROOT/android/assets/www" "$ROOT/app"
cat "$ROOT/src/app1.js" "$ROOT/src/app2.js" "$ROOT/src/app3.js" "$ROOT/src/app4.js" "$ROOT/src/app5.js" \
  > "$ROOT/android/assets/www/app.js"
# Keep app/ in sync (HTML, CSS, data, icon) so GitHub Pages can serve the web version.
cp -a "$ROOT/android/assets/www/." "$ROOT/app/"

mkdir -p "$(dirname "$OUT")"
cd "$ROOT/android"
rm -rf build && mkdir -p build/{compiled,gen,classes,dex}
"$BT/aapt2" compile --dir res -o build/compiled/
"$BT/aapt2" link -I "$JAR" --manifest AndroidManifest.xml -o build/unsigned.apk -A assets \
  --java build/gen --min-sdk-version 24 --target-sdk-version 28 build/compiled/*.flat
javac -source 8 -target 8 -Xlint:-options -bootclasspath "$JAR" -classpath "$JAR" -d build/classes \
  $(find src build/gen -name '*.java')
"$BT/d8" --release --min-api 24 --lib "$JAR" --output build/dex $(find build/classes -name '*.class')
cp build/unsigned.apk build/withdex.apk
python3 -c "import zipfile; z=zipfile.ZipFile('build/withdex.apk','a',zipfile.ZIP_DEFLATED); z.write('build/dex/classes.dex','classes.dex'); z.close()"
"$BT/zipalign" -f -p 4 build/withdex.apk build/aligned.apk

if [[ -z "${KEY_ALIAS:-}" ]]; then
  KEY_ALIAS=$(keytool -list -keystore "$KEYSTORE" -storepass "$KEYSTORE_PASS" 2>/dev/null \
    | awk -F, '/PrivateKeyEntry/{print $1; exit}')
fi
if [[ -z "$KEY_ALIAS" ]]; then
  echo "error: could not determine KEY_ALIAS; set it explicitly." >&2
  exit 1
fi

"$BT/apksigner" sign --ks "$KEYSTORE" --ks-key-alias "$KEY_ALIAS" \
  --ks-pass "pass:$KEYSTORE_PASS" --key-pass "pass:$KEY_PASS" \
  --out "$OUT" build/aligned.apk
"$BT/apksigner" verify --verbose "$OUT" | head -6
"$BT/aapt2" dump badging "$OUT" | head -12
ls -la "$OUT"
