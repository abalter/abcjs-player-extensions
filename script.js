// Initialize ABCJS rendering
var abcString = `
X:1
T:Jericho (chord symbols)
T:Joshua fought the battle of Jericho
C:Anon.
M:C
L:1/8
K:Dm
"Dm"D^CDE FF G2|"Dm"A A2 A-A4|"A7"G G2 G-G4|"Dm"A A2 A-A4|
"Dm"D^CDE FF G2|"Dm"A A2 A-A2 FG|"A7"A2 G2 F2 E2|"Dm"D6"^Fine"||dd|
"Dm"dA AA A3 A|"Dm"A A3- "A7"A2 AA|"Dm"AA AA A2 A2|"A7"A6 ^c2|
"Dm"d2 A2 "A7"A A3|"Dm"A2 A2- "A7"A2 AA|"Dm"AA G2 "A7"E2 D2|"Dm"D8|]
`;

var visualObj;
var midiBuffer;
var synthControl;
var audioContext; // Audio context variable

// Functions to handle key transposition
function getOriginalKey(abcString) {
    var match = abcString.match(/K:([^\s\n]+)/);
    if (match) {
        return match[1];
    } else {
        return null;
    }
}

function calculateTranspositionInterval(originalKey, targetKey) {
    var semitoneMap = {
        'C': 0,
        'C#': 1,
        'Db': 1,
        'D': 2,
        'D#': 3,
        'Eb': 3,
        'E': 4,
        'F': 5,
        'F#': 6,
        'Gb': 6,
        'G': 7,
        'G#': 8,
        'Ab': 8,
        'A': 9,
        'A#': 10,
        'Bb': 10,
        'B': 11
    };

    var originalSemitone = semitoneMap[originalKey];
    var targetSemitone = semitoneMap[targetKey];

    if (originalSemitone === undefined || targetSemitone === undefined) {
        return 0; // No transposition
    }

    var interval = targetSemitone - originalSemitone;
    return interval;
}

// Get elements
var tempoSlider = document.getElementById('tempo');
var tempoNumber = document.getElementById('tempo-number');
var keySelect = document.getElementById('key');
var octaveSlider = document.getElementById('octave');
var octaveNumber = document.getElementById('octave-number');
var instrumentSelect = document.getElementById('instrument');
var swingToggle = document.getElementById('swing-toggle');
var swingSlider = document.getElementById('swing');
var swingNumber = document.getElementById('swing-number');
var chordsCheckbox = document.getElementById('chords');
var playButton = document.getElementById('play-button');
var stopButton = document.getElementById('stop-button'); // Ensure this exists in your HTML

// Synchronize sliders and number inputs
function syncSliderAndNumber(slider, number) {
    slider.addEventListener('input', function () {
        number.value = slider.value;
    });
    number.addEventListener('input', function () {
        var value = Math.max(slider.min, Math.min(slider.max, number.value));
        number.value = value;
        slider.value = value;
    });
}

syncSliderAndNumber(tempoSlider, tempoNumber);
syncSliderAndNumber(octaveSlider, octaveNumber);
syncSliderAndNumber(swingSlider, swingNumber);

// Function to render and prepare playback
function renderAndPrepare(abcNotation, playbackOptions) {
    // Stop any existing playback
    if (synthControl) {
        synthControl.stop();
    }
    if (audioContext) {
        audioContext.close();
    }

    // Render the notation
    visualObj = ABCJS.renderAbc("abc", abcNotation, {
        add_classes: true,
        staffwidth: 800,
        responsive: 'resize',
        transpose: playbackOptions.transpose || 0
    })[0];

    // Initialize the Audio Context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Initialize the Synthesizer
    midiBuffer = new ABCJS.synth.CreateSynth();

    midiBuffer.init({
        audioContext: audioContext,
        visualObj: visualObj,
        options: {
            chordsOff: playbackOptions.synthControlOptions.chordsOff,
            program: playbackOptions.synthControlOptions.program,
            qpm: playbackOptions.synthOptions.qpm,
            midiTranspose: playbackOptions.synthOptions.midiTranspose,
            swingRatio: playbackOptions.synthOptions.swingRatio,
        },
    }).then(function () {
        return midiBuffer.prime();
    }).then(function () {
        // Initialize the Synth Controller
        synthControl = new ABCJS.synth.SynthController();
        synthControl.load("#audio", null, {
            displayLoop: true,
            displayRestart: true,
            displayPlay: true,
            displayProgress: true,
            displayWarp: true,
        });

        // Initialize the Cursor Control
        var cursorControl = new ABCJS.CursorControl({
            svg: document.querySelector("svg"), // Link to the SVG element created by renderAbc
            bpm: playbackOptions.synthOptions.qpm || 120
        });

        // Link the Cursor Control to the Synth Controller
        synthControl.setCursorControl(cursorControl);

        // Start playback
        return synthControl.setTune(visualObj, true, {
            audioContext: audioContext,
            millisecondsPerMeasure: visualObj.millisecondsPerMeasure(),
            midiBuffer: midiBuffer,
        }).then(function () {
            synthControl.play();
        });
    }).catch(function (error) {
        console.warn("Audio problem:", error);
    });
}


// Play button event
playButton.addEventListener('click', function () {
    // Collect settings
    var tempo = parseInt(tempoNumber.value);
    var key = keySelect.value;
    var octaveShift = parseInt(octaveNumber.value);
    var instrument = instrumentSelect.value;
    var swingEnabled = swingToggle.checked;
    var swingAmount = parseInt(swingNumber.value);
    var playChords = chordsCheckbox.checked;

    // Get the original key from the ABC notation
    var originalKey = getOriginalKey(abcString);

    // Calculate the transposition interval
    var transposeInterval = 0;
    if (key && originalKey) {
        transposeInterval = calculateTranspositionInterval(originalKey, key);
    }

    // Apply octave shift to transposition interval
    transposeInterval += octaveShift * 12;

    // Map instrument names to MIDI program numbers
    var instrumentMap = {
        'acoustic_grand_piano': 0,
        'violin': 40,
        'flute': 73,
        // Add more instruments as needed
    };
    var programNumber = instrumentMap[instrument] || 0;

    // Prepare playback options
    var playbackOptions = {
        synthOptions: {
            qpm: tempo,
            midiTranspose: transposeInterval,
            swingRatio: swingEnabled ? swingAmount / 100 : 0,
        },
        synthControlOptions: {
            chordsOff: !playChords,
            program: programNumber,
        },
        transpose: transposeInterval,
    };

    // Apply settings to ABCJS synth
    renderAndPrepare(abcString, playbackOptions);
});

// Stop button event
stopButton.addEventListener('click', function () {
    if (synthControl) {
        synthControl.stop();
    }
    if (audioContext) {
        audioContext.close();
    }
});
