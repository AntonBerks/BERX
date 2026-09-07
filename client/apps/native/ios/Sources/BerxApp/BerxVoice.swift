import AVFoundation
import Speech

/// The voice, on iOS.
///
/// The pacing is not decided here. `rate` and `pitch` arrive from the
/// shared core (BerxVoiceAssistant's prosody table) so a line written as
/// `tender` lands the same way on every platform — but the two numbers
/// mean different things to different engines, and that conversion is
/// this file's job:
///
///   AVSpeechUtterance.rate is NOT a multiplier. It runs 0…1 with the
///   normal speaking rate at `AVSpeechUtteranceDefaultSpeechRate`
///   (0.5), so the core's 0.9 multiplier becomes 0.45 here, not 0.9. A
///   file that passed 0.9 straight through would speak at nearly double
///   speed — which is the single most common way this API is misused.
///
///   pitchMultiplier IS a multiplier, 0.5…2.0, so it passes through.
///
/// Speech recognition on iOS requires two separate permissions
/// (microphone and speech recognition) and, on most devices, sends
/// audio to Apple for processing. `requiresNetwork` reports that
/// honestly rather than burying it: a person is entitled to know before
/// the microphone opens.
@objc public final class BerxVoice: NSObject, AVSpeechSynthesizerDelegate {

    private let synthesizer = AVSpeechSynthesizer()
    private var speechCompletion: (() -> Void)?
    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "ru-RU"))
    private let audioEngine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?

    @objc public var language: String = "ru-RU"
    /// Name of a preferred installed voice. The default system voice is
    /// rarely the best one available, and naming a better one is the
    /// cheapest improvement there is.
    @objc public var preferredVoiceIdentifier: String?

    @objc public override init() {
        super.init()
        synthesizer.delegate = self
    }

    @objc public var isAvailable: Bool { true }

    @objc public var requiresNetwork: Bool {
        // supportsOnDeviceRecognition is false on most locales and older
        // hardware; when it is false the audio leaves the device.
        !(recognizer?.supportsOnDeviceRecognition ?? false)
    }

    /// - Parameters:
    ///   - rate: the core's multiplier on a normal speaking rate.
    ///   - pitch: the core's multiplier on a normal pitch.
    ///   - completion: called when the line has FINISHED, never when it starts —
    ///     the script's silences are measured from the end of a line, and
    ///     completing early collapses every pause in it.
    @objc public func speak(_ text: String, rate: Float, pitch: Float, completion: @escaping () -> Void) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = preferredVoiceIdentifier.flatMap(AVSpeechSynthesisVoice.init(identifier:))
            ?? AVSpeechSynthesisVoice(language: language)
        // the conversion this file exists for — see the type note above
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * rate
        utterance.pitchMultiplier = pitch
        speechCompletion = completion
        synthesizer.speak(utterance)
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        let done = speechCompletion
        speechCompletion = nil
        done?()
    }

    public func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        // A cancelled line still has to release whoever is waiting on it,
        // or the script stops forever with a person standing in the room.
        let done = speechCompletion
        speechCompletion = nil
        done?()
    }

    /// Asks for both permissions, in the order iOS requires, and reports
    /// a real answer. Never assumes a yes.
    @objc public func requestPermission(_ completion: @escaping (Bool) -> Void) {
        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else {
                DispatchQueue.main.async { completion(false) }
                return
            }
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                DispatchQueue.main.async { completion(granted) }
            }
        }
    }

    /// - Parameter completion: transcript, confidence 0…1, and how long the
    ///   person took to start — which is the only thing in a transcript
    ///   that came from the sound itself.
    @objc public func listen(timeout: TimeInterval, completion: @escaping (String?, Float, TimeInterval) -> Void) {
        guard let recognizer = recognizer, recognizer.isAvailable else {
            completion(nil, 0, 0)
            return
        }
        let started = Date()
        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = false
        self.request = request

        let input = audioEngine.inputNode
        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: input.outputFormat(forBus: 0)) { buffer, _ in
            request.append(buffer)
        }
        do {
            try AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .measurement, options: .duckOthers)
            try AVAudioSession.sharedInstance().setActive(true, options: .notifyOthersOnDeactivation)
            audioEngine.prepare()
            try audioEngine.start()
        } catch {
            stop()
            completion(nil, 0, 0)
            return
        }

        var settled = false
        let finish: (String?, Float) -> Void = { [weak self] transcript, confidence in
            guard !settled else { return }
            settled = true
            self?.stop()
            completion(transcript, confidence, Date().timeIntervalSince(started))
        }

        task = recognizer.recognitionTask(with: request) { result, error in
            if let result = result, result.isFinal {
                let best = result.bestTranscription
                let confidence = best.segments.isEmpty
                    ? 0.5
                    : best.segments.map(\.confidence).reduce(0, +) / Float(best.segments.count)
                finish(best.formattedString, confidence)
            } else if error != nil {
                finish(nil, 0)
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + timeout) { finish(nil, 0) }
    }

    /// Stops both, now. A person who wants silence gets it immediately.
    @objc public func stop() {
        synthesizer.stopSpeaking(at: .immediate)
        if audioEngine.isRunning {
            audioEngine.stop()
            audioEngine.inputNode.removeTap(onBus: 0)
        }
        request?.endAudio()
        task?.cancel()
        request = nil
        task = nil
    }
}
