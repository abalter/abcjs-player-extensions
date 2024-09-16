// Initialize ABCJS rendering
var abcString = `
X:1
T:Sample Tune
M:4/4
K:C
C D E F | G A B c |
`;

var visualObj;

// Function to render and prepare playback
function renderAndPrepare(abcNotation) {
    // Render the notation
    visualObj = ABCJS.render("abc", abcNotation, { add_classes: true })[0];

    // Initialize the Synth Controller
    var synthControl = new ABCJS.synth.SynthController();
    synthControl.load("#audio", null, { displayLoop: true, displayRestart: true, displayPlay: true });

    // Initialize the Synthesizer
    var midiBuffer = new ABCJS.synth.CreateSynth();

    // Prepare audio playback
    midiBuffer.init({
        visualObj: visualObj,
        options: {
            // Add options here if needed
        }
    }).then(function () {
        synthControl.setTune(visualObj, true).then(function () {
            // Ready to play
        });
    }).catch(function (error) {
        console.warn("Audio problem:", error);
    });
}

// Initial rendering and preparation
renderAndPrepare(abcString);

// Get elements
var tempoSlider = document.getElementById('tempo');
var tempoNumber = document.getElementById('tempo-number');
var pitchSlider = document.getElementById('pitch');
var pitchNumber = document.getElementById('pitch-number');
var keySelect = document.getElementById('key');
var octaveSlider = document.getElementById('octave');
var octaveNumber = document.getElementById('octave-number');
var instrumentSelect = document.getElementById('instrument');
var swingToggle = document.getElementById('swing-toggle');
var swingSlider = document.getElementById('swing');
var swingNumber = document.getElementById('swing-number');
var chordsCheckbox = document.getElementById('chords');
var metronomeCheckbox = document.getElementById('metronome');
var playButton = document.getElementById('play-button');

// Synchronize sliders and number inputs
function syncSliderAndNumber(slider, number) {
    slider.addEventListener('input', function() {
        number.value = slider.value;
    });
    number.addEventListener('input', function() {
        // Ensure the number input stays within the slider's range
        var value = Math.max(slider.min, Math.min(slider.max, number.value));
        number.value = value;
        slider.value = value;
    });
}

syncSliderAndNumber(tempoSlider, tempoNumber);
syncSliderAndNumber(pitchSlider, pitchNumber);
syncSliderAndNumber(octaveSlider, octaveNumber);
syncSliderAndNumber(swingSlider, swingNumber);

// Arrow button controls
function addSliderArrows(slider, decreaseBtn, increaseBtn, minBtn, maxBtn, step) {
    decreaseBtn.addEventListener('click', function() {
        slider.stepDown(step);
        slider.dispatchEvent(new Event('input'));
    });
    increaseBtn.addEventListener('click', function() {
        slider.stepUp(step);
        slider.dispatchEvent(new Event('input'));
    });
    minBtn.addEventListener('click', function() {
        slider.value = slider.min;
        slider.dispatchEvent(new Event('input'));
    });
    maxBtn.addEventListener('click', function() {
        slider.value = slider.max;
        slider.dispatchEvent(new Event('input'));
    });
}

// Tempo Arrows
addSliderArrows(
    tempoSlider,
    document.getElementById('tempo-decrease'),
    document.getElementById('tempo-increase'),
    document.getElementById('tempo-min'),
    document.getElementById('tempo-max'),
    1
);

// Pitch Arrows
addSliderArrows(
    pitchSlider,
    document.getElementById('pitch-decrease'),
    document.getElementById('pitch-increase'),
    document.getElementById('pitch-min'),
    document.getElementById('pitch-max'),
    1
);

// Octave Arrows
addSliderArrows(
    octaveSlider,
    document.getElementById('octave-decrease'),
    document.getElementById('octave-increase'),
    document.getElementById('octave-min'),
    document.getElementById('octave-max'),
    1
);

// Swing Arrows
addSliderArrows(
    swingSlider,
    document.getElementById('swing-decrease'),
    document.getElementById('swing-increase'),
    document.getElementById('swing-min'),
    document.getElementById('swing-max'),
    1
);

// Play button event
playButton.addEventListener('click', function() {
    // Collect settings
    var tempo = parseInt(tempoNumber.value);
    var pitch = parseInt(pitchNumber.value);
    var key = keySelect.value;
    var octaveShift = parseInt(octaveNumber.value);
    var instrument = instrumentSelect.value;
    var swingEnabled = swingToggle.checked;
    var swingAmount = parseInt(swingNumber.value);
    var playChords = chordsCheckbox.checked;
    var metronome = metronomeCheckbox.checked;

    // Modify the ABC notation based on key override
    var modifiedAbcString = abcString;

    if (key) {
        modifiedAbcString = modifiedAbcString.replace(/K:[^\n]*/, 'K:' + key);
    }

    // Apply settings to ABCJS synth
    renderAndPrepare(modifiedAbcString);

    // Apply additional options during playback
    var midiBuffer = new ABCJS.synth.CreateSynth();

    midiBuffer.init({
        visualObj: visualObj,
        options: {
            tempo: tempo,
            midiTranspose: octaveShift * 12,
            // swingRatio accepts values between 0 and 2 (0 = no swing, 1 = standard swing)
            swingRatio: swingEnabled ? swingAmount / 50 : 0,
            chordsOff: !playChords,
            // Instrument and metronome options may need additional handling
        }
    }).then(function () {
        var synthControl = new ABCJS.synth.SynthController();
        synthControl.load("#audio", null, { displayLoop: true, displayRestart: true, displayPlay: true });

        synthControl.setTune(visualObj, false, {
            chordsOff: !playChords,
            // Additional settings can be applied here
        }).then(function() {
            synthControl.play();
        });
    }).catch(function (error) {
        console.warn("Audio problem:", error);
    });
});

// Ensure that the sliders and number inputs are synchronized initially
tempoSlider.dispatchEvent(new Event('input'));
pitchSlider.dispatchEvent(new Event('input'));
octaveSlider.dispatchEvent(new Event('input'));
swingSlider.dispatchEvent(new Event('input'));
