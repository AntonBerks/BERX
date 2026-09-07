package com.berx.native;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;

/**
 * The voice, on Android.
 *
 * The pacing comes from the shared core (BerxVoiceAssistant's prosody
 * table) so a line written as `tender` lands the same way everywhere.
 * What is Android-specific is how the two numbers are applied and how a
 * finished line is reported:
 *
 *   setSpeechRate and setPitch ARE multipliers here (1.0 is normal), so
 *   the core's values pass through unchanged — unlike iOS, where rate is
 *   an absolute 0…1 and needs converting.
 *
 *   TextToSpeech has no completion callback on speak(): finishing is
 *   reported through an UtteranceProgressListener keyed by an utterance
 *   id. Without that id the callback never fires, and every pause in the
 *   script silently becomes zero.
 *
 * Java, not Kotlin: this Gradle project applies only
 * com.android.application, so a .kt file would not compile — and a file
 * that cannot compile is not an implementation.
 */
public final class BerxVoice {

    public interface SpokenListener { void onSpoken(); }

    public interface HeardListener {
        /** transcript may be null when nothing was heard. */
        void onHeard(String transcript, float confidence, long hesitationMs);
    }

    private final TextToSpeech tts;
    private final SpeechRecognizer recognizer;
    private final Context context;
    private SpokenListener pendingSpoken;
    private boolean ready;

    public BerxVoice(Context context) {
        this.context = context;
        this.tts = new TextToSpeech(context, status -> {
            ready = status == TextToSpeech.SUCCESS;
            if (ready) {
                tts.setLanguage(new Locale("ru", "RU"));
            }
        });
        this.tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String utteranceId) { }

            @Override public void onDone(String utteranceId) { fireSpoken(); }

            /** A failed line still has to release whoever is waiting on it,
             *  or the script stops forever with a person standing there. */
            @Override public void onError(String utteranceId) { fireSpoken(); }
        });
        this.recognizer = SpeechRecognizer.isRecognitionAvailable(context)
                ? SpeechRecognizer.createSpeechRecognizer(context)
                : null;
    }

    public boolean isAvailable() { return ready; }

    public boolean canListen() { return recognizer != null; }

    /**
     * True where recognition is known to leave the device. Android's
     * default recogniser is a network service unless a device ships an
     * offline model; a person is entitled to know before the microphone
     * opens.
     */
    public boolean requiresNetwork() { return recognizer != null; }

    /**
     * @param rate  the core's multiplier on a normal speaking rate
     * @param pitch the core's multiplier on a normal pitch
     * @param listener called when the line has FINISHED, never when it starts
     */
    public void speak(String text, float rate, float pitch, SpokenListener listener) {
        if (!ready) {
            listener.onSpoken();
            return;
        }
        pendingSpoken = listener;
        tts.setSpeechRate(rate);
        tts.setPitch(pitch);
        /* the id is not optional: without it onDone never fires and every
           pause in the script silently becomes zero */
        HashMap<String, String> params = new HashMap<>();
        params.put(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "berx");
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, params);
    }

    private void fireSpoken() {
        SpokenListener listener = pendingSpoken;
        pendingSpoken = null;
        if (listener != null) listener.onSpoken();
    }

    public void listen(final HeardListener listener) {
        if (recognizer == null) {
            listener.onHeard(null, 0f, 0L);
            return;
        }
        final long started = System.currentTimeMillis();
        recognizer.setRecognitionListener(new RecognitionListener() {
            private boolean settled;

            private void finish(String transcript, float confidence) {
                if (settled) return;
                settled = true;
                listener.onHeard(transcript, confidence, System.currentTimeMillis() - started);
            }

            @Override public void onResults(Bundle results) {
                ArrayList<String> heard = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                float[] scores = results.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES);
                if (heard == null || heard.isEmpty()) {
                    finish(null, 0f);
                    return;
                }
                /* a missing confidence is not a confident one */
                float confidence = scores != null && scores.length > 0 ? scores[0] : 0.5f;
                finish(heard.get(0), confidence);
            }

            @Override public void onError(int error) { finish(null, 0f); }
            @Override public void onEndOfSpeech() { }
            @Override public void onReadyForSpeech(Bundle params) { }
            @Override public void onBeginningOfSpeech() { }
            @Override public void onRmsChanged(float rmsdB) { }
            @Override public void onBufferReceived(byte[] buffer) { }
            @Override public void onPartialResults(Bundle partialResults) { }
            @Override public void onEvent(int eventType, Bundle params) { }
        });
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "ru-RU");
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        recognizer.startListening(intent);
    }

    /** Stops both, now. A person who wants silence gets it immediately. */
    public void stop() {
        tts.stop();
        if (recognizer != null) recognizer.cancel();
    }

    public void release() {
        tts.shutdown();
        if (recognizer != null) recognizer.destroy();
    }
}
