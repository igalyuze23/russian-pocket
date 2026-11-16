package com.igal.russian;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.ValueCallback;

import java.util.Locale;
import java.util.Set;

public class MainActivity extends Activity implements TextToSpeech.OnInitListener {
    private WebView web;
    private TextToSpeech tts;
    /** "init", "ok", "missing" (no Russian data), "nolang" (engine without Russian), "error" */
    private volatile String ttsState = "init";
    private volatile String engineName = "";

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#4F46E5"));
        web = new WebView(this);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "AndroidTTS");
        setContentView(web);
        tts = new TextToSpeech(this, this);
        if (b != null) web.restoreState(b);
        else web.loadUrl("file:///android_asset/www/index.html");
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override public void onInit(int status) {
        if (status != TextToSpeech.SUCCESS) { ttsState = "error"; return; }
        try { engineName = tts.getDefaultEngine(); } catch (Exception ignored) {}
        Locale ru = new Locale("ru", "RU");
        int r = tts.setLanguage(ru);
        if (r == TextToSpeech.LANG_MISSING_DATA) ttsState = "missing";
        else if (r == TextToSpeech.LANG_NOT_SUPPORTED) ttsState = "nolang";
        else {
            ttsState = "ok";
            // Prefer an offline (embedded) Russian voice when one is installed.
            try {
                Set<Voice> voices = tts.getVoices();
                Voice best = null;
                if (voices != null) for (Voice v : voices) {
                    if (v.getLocale() == null || !"ru".equals(v.getLocale().getLanguage())) continue;
                    if (v.getFeatures() != null && v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                    if (best == null || (!v.isNetworkConnectionRequired() && best.isNetworkConnectionRequired())
                            || (v.getQuality() > best.getQuality() && v.isNetworkConnectionRequired() == best.isNetworkConnectionRequired())) best = v;
                }
                if (best != null) tts.setVoice(best);
            } catch (Exception ignored) {}
        }
        notifyJs();
    }

    private void notifyJs() {
        runOnUiThread(new Runnable() { public void run() {
            web.evaluateJavascript("window.onTtsState && window.onTtsState('" + ttsState + "')", null);
        }});
    }

    private class Bridge {
        @JavascriptInterface public String state() { return ttsState; }
        @JavascriptInterface public String engine() { return engineName == null ? "" : engineName; }
        @JavascriptInterface public void speak(String text, float rate) {
            if (tts == null || !"ok".equals(ttsState)) return;
            tts.setSpeechRate(rate <= 0 ? 0.9f : rate);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "u" + System.nanoTime());
        }
        @JavascriptInterface public void stop() { if (tts != null) tts.stop(); }
        @JavascriptInterface public void installVoice() {
            runOnUiThread(new Runnable() { public void run() {
                try {
                    Intent i = new Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
                    if (engineName != null && !engineName.isEmpty()) i.setPackage(engineName);
                    startActivity(i);
                } catch (ActivityNotFoundException e) { openSettingsInternal(); }
            }});
        }
        @JavascriptInterface public void openSettings() {
            runOnUiThread(new Runnable() { public void run() { openSettingsInternal(); }});
        }
        @JavascriptInterface public void recheck() {
            runOnUiThread(new Runnable() { public void run() {
                if (tts != null) tts.shutdown();
                ttsState = "init";
                tts = new TextToSpeech(MainActivity.this, MainActivity.this);
            }});
        }
        @JavascriptInterface public void setStatusColor(final String hex) {
            runOnUiThread(new Runnable() { public void run() {
                try { getWindow().setStatusBarColor(Color.parseColor(hex)); } catch (Exception ignored) {}
            }});
        }
    }

    private void openSettingsInternal() {
        try { startActivity(new Intent("com.android.settings.TTS_SETTINGS")); }
        catch (Exception e) {
            try { startActivity(new Intent(android.provider.Settings.ACTION_SETTINGS)); } catch (Exception ignored) {}
        }
    }

    @Override protected void onResume() {
        super.onResume();
        // The user may come back from installing the Russian voice.
        if (tts != null && !"ok".equals(ttsState) && !"init".equals(ttsState)) {
            int r = tts.setLanguage(new Locale("ru", "RU"));
            if (r >= TextToSpeech.LANG_AVAILABLE) { ttsState = "ok"; notifyJs(); }
        }
    }

    @Override public void onBackPressed() {
        web.evaluateJavascript("window.appBack ? window.appBack() : false", new ValueCallback<String>() {
            public void onReceiveValue(String v) {
                if (!"true".equals(v)) MainActivity.super.onBackPressed();
            }
        });
    }

    @Override protected void onDestroy() {
        if (tts != null) { tts.stop(); tts.shutdown(); }
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
