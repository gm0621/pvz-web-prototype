"""Render the original prepare, duel and victory music. Requires NumPy and either afconvert or ffmpeg."""

from pathlib import Path
import shutil
import subprocess
import tempfile
import wave

import numpy as np


RATE = 44100
SCORES = {
    "prepare": (100, 62, [0, -5, -3, 0, 0, -5, -2, 0], [
        [0, None, 2, 4, 7, None, 4, None], [2, 4, 7, None, 9, None, 7, 4],
        [2, None, 4, None, 7, 9, 7, None], [4, None, 2, None, 0, None, None, None],
        [7, None, 9, 12, 9, None, 7, None], [4, None, 7, None, 4, 2, 0, None],
        [2, None, 4, 7, 9, 7, 4, None], [2, 4, 2, None, 0, None, None, None],
    ]),
    "duel": (146, 57, [0, -5, -2, 0, 0, -3, -5, 0], [
        [0, 7, None, 0, 12, 7, 10, None], [7, None, 5, 3, 5, 7, 3, 0],
        [10, 7, 5, None, 10, 12, 10, 7], [7, 5, 3, 0, 3, 5, 7, None],
        [12, None, 15, 12, 10, 7, 10, 12], [15, 12, 10, 7, 5, 7, 10, None],
        [7, 10, 12, None, 10, 7, 5, 3], [0, None, 7, None, 12, 7, 3, 0],
    ]),
    "victory": (118, 65, [0, 0, -3, -5, 0, -3, -5, 0], [
        [0, 0, 4, 7, 12, None, 9, None], [7, None, 9, 12, 16, None, 14, None],
        [12, None, 9, 7, 9, 7, 4, None], [7, 9, 7, 4, 2, None, 4, 7],
        [12, None, 16, 19, 16, None, 14, None], [12, 9, 12, None, 9, 7, 4, None],
        [2, 4, 7, 9, 7, 4, 2, None], [0, None, 4, None, 12, None, None, None],
    ]),
}


def voice(instrument, note, seconds, rng):
    t = np.arange(int(RATE * seconds)) / RATE
    hz = 440 * 2 ** ((note - 69) / 12)
    phase = 2 * np.pi * hz * t
    tail = np.clip((seconds - t) / .055, 0, 1)
    if instrument == "drum":
        bend = 2 * np.pi * (59 * t + 3.3 * (1 - np.exp(-t * 26)))
        return (np.sin(bend) + .22 * np.sin(bend * 1.57)) * np.exp(-14 * t) * np.minimum(1, t * 375) * tail
    if instrument == "rim":
        grain = rng.normal(0, 1, len(t))
        return (.5 * (grain - np.roll(grain, 2)) + .25 * np.sin(phase * 5)) * np.exp(-28 * t) * np.minimum(1, t * 600) * tail
    if instrument == "pluck":
        bell = (np.sin(phase) + .42 * np.sin(phase * 2.003) * np.exp(-7*t)
                + .20 * np.sin(phase * 3.014) * np.exp(-10*t)
                + .095 * np.sin(phase * 5.04) * np.exp(-22*t))
        return bell * np.minimum(1, t * 290) * np.exp(-5 * t) * tail
    if instrument == "flute":
        vibrato = .17 * np.sin(2*np.pi * 5.2 * t) * np.minimum(1, t * 5)
        breath = np.sin(phase + vibrato) + .23 * np.sin(2*(phase + vibrato)) + .06 * np.sin(3*(phase + vibrato))
        return breath * np.minimum(1, t * 24) * tail * (.76+.24*np.sin(np.pi*t/seconds))
    # Bowed accompaniment with gentle beating between two pitches.
    bowed = sum(np.sin(phase*i)/(i**1.55) for i in range(1, 5))*.51 + np.sin(phase*1.0035)*.49
    return bowed * np.minimum(1, t*7) * np.clip((seconds-t)/.17, 0, 1)


def render(mode, score, destination):
    bpm, tonic, roots, melody = score
    beat = 60 / bpm
    length = round(RATE * beat * 32)
    mix = np.zeros((length, 2))
    rng = np.random.default_rng(76)

    def play(instrument, note, at, duration, volume, pan=0):
        sound = voice(instrument, note, duration, rng) * volume
        index = (round(RATE * at * beat) + np.arange(len(sound))) % length
        mix[index, 0] += sound * np.sqrt(.5 - .35 * pan)
        mix[index, 1] += sound * np.sqrt(.5 + .35 * pan)

    for bar, (offset, phrase) in enumerate(zip(roots, melody)):
        base = bar * 4
        chord = tonic + offset
        for i, note in enumerate(phrase):
            at = base + i / 2
            if note is not None:
                sustain = .89 if i < 7 and phrase[i+1] is None else .44
                play("pluck", tonic + note, at, beat * 1.15, .22, -.31)
                if mode != "duel" or i % 2 == 0 or bar >= 4:
                    play("flute", tonic + note, at, beat * sustain, .17 if mode == "duel" else .22, .18)
            play("pluck", chord + [0, 7, 12, 7, 0, 7, 5, 7][i]-12, at, beat*.8, .08, .51)
        for degree, gain in [(0,.17),(7,.073),(12,.055)]:
            play("bow", chord+degree-12, base, beat*4.17, gain, -.12)
        if mode == "duel":
            for i in [0, .75, 1.5, 2, 2.75, 3.5] + ([3.75] if bar % 2 else []):
                play("drum", 40, base+i, .37, .33 if i in [0, 2] else .19, -.05)
            for i in [1, 2.5, 3, 3.75]:
                play("rim", 56, base+i, .14, .16, .43)
        else:
            for i in [0, 2.5] if mode == "prepare" else [0, 1.5, 2, 3.5]:
                play("drum", 40, base+i, .36, .22 if i == 0 else .11)
            play("rim", 57, base+3.5, .16, .11, -.36)
    # Circular echoes let the ambience carry across the loop boundary.
    wet = mix.copy()
    for seconds, gain in [(.069, .10), (.122, .09), (.21, .055), (.34, .032)]:
        wet += np.roll(mix[:, ::-1], int(seconds * RATE), axis=0) * gain
    wet = np.tanh(wet * (1.45 / np.max(np.abs(wet))))
    with tempfile.TemporaryDirectory() as temporary:
        wav = Path(temporary) / "score.wav"
        with wave.open(str(wav), "wb") as out:
            out.setparams((2, 2, RATE, length, "NONE", "not compressed"))
            out.writeframes((wet * 27000).astype("<i2").tobytes())
        encoded = wav.with_suffix(".m4a")
        if shutil.which("afconvert"):
            command = ["afconvert", "-f", "m4af", "-d", "aac", "-b", "128000", str(wav), str(encoded)]
        else:
            command = ["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-c:a", "aac",
                       "-b:a", "128k", "-movflags", "+faststart", str(encoded)]
        subprocess.run(command, check=True)
        shutil.copyfile(encoded, destination)


if __name__ == "__main__":
    folder = Path(__file__).resolve().parents[1] / "hero/assets/audio/scenes"
    for name, composition in SCORES.items():
        render(name, composition, folder / f"{name}.m4a")
