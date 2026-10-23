#!/usr/bin/env python3
"""
transcribe.py - Local speech-to-text script using faster-whisper for CapCut Auto Captions.
Extracts word-level timestamps and prints structured JSON to stdout.
Includes specialized Swahili (Kiswahili Sanifu) grammar prompt & conditioning.

Usage:
    python transcribe.py "path/to/video.mp4" "en"
    python transcribe.py --video "path/to/video.mp4" --language "sw" --model "small"
"""

import sys
import json
import argparse
import os
import re

SWAHILI_INITIAL_PROMPT = (
    "Huu ni mjadala na mazungumzo katika lugha ya Kiswahili Sanifu. "
    "Maneno yote yameandikwa kwa tahajia sahihi na sarufi sanifu ya Kiswahili: "
    "habari za asubuhi, habari za jioni, asante sana, kwaheri, karibu sana, "
    "kwa sababu, kwa nini, kila mtu, pamoja, vizuri, serikali, maendeleo, nchi, "
    "alipokuwa, nilipofika, tutakwenda, anafanya kazi, Afrika Mashariki, Tanzania, Kenya."
)

def normalize_swahili_text(text: str) -> str:
    """Fix common Whisper BPE tokenization splits and typos in Swahili speech."""
    if not text:
        return ""
    
    # Common agglutinative verb splits
    text = re.sub(r'\balipo\s+kuwa\b', 'alipokuwa', text, flags=re.IGNORECASE)
    text = re.sub(r'\bwalipo\s+kuwa\b', 'walipokuwa', text, flags=re.IGNORECASE)
    text = re.sub(r'\bnilipo\s+kuwa\b', 'nilipokuwa', text, flags=re.IGNORECASE)
    text = re.sub(r'\byaliyo\s+kuwa\b', 'yaliyokuwa', text, flags=re.IGNORECASE)
    text = re.sub(r'\bwalio\s+kuwa\b', 'waliokuwa', text, flags=re.IGNORECASE)
    text = re.sub(r'\btutakapo\s+kuwa\b', 'tutakapokuwa', text, flags=re.IGNORECASE)
    
    # Preposition and conjunction phrases
    text = re.sub(r'\bkwa\s+sa\s*babu\b', 'kwa sababu', text, flags=re.IGNORECASE)
    text = re.sub(r'\bkwa\s+sabab\b', 'kwa sababu', text, flags=re.IGNORECASE)
    text = re.sub(r'\bkwasababu\b', 'kwa sababu', text, flags=re.IGNORECASE)
    text = re.sub(r'\bkwa\s+jili\s+ya\b', 'kwa ajili ya', text, flags=re.IGNORECASE)
    text = re.sub(r'\bkwa\s+ajiliya\b', 'kwa ajili ya', text, flags=re.IGNORECASE)
    text = re.sub(r'\bkila\s+m\s*tu\b', 'kila mtu', text, flags=re.IGNORECASE)
    text = re.sub(r'\bm\s+tu\b', 'mtu', text, flags=re.IGNORECASE)
    text = re.sub(r'\bw\s+tu\b', 'watu', text, flags=re.IGNORECASE)
    text = re.sub(r'\bki\s+sha\b', 'kisha', text, flags=re.IGNORECASE)
    text = re.sub(r'\bhadi\s+sasa\b', 'hadi sasa', text, flags=re.IGNORECASE)

    # Clean multi-spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def transcribe_video(video_path, language="auto", model_size="small", compute_type="int8", device="cpu"):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        err_msg = "faster-whisper is not installed. Please run: pip install faster-whisper"
        sys.stderr.write(err_msg + "\n")
        print(json.dumps({
            "success": False,
            "error": err_msg,
            "missing_dependency": "faster-whisper"
        }))
        sys.exit(1)

    if not os.path.exists(video_path):
        err_msg = f"Video file not found at path: {video_path}"
        sys.stderr.write(err_msg + "\n")
        print(json.dumps({
            "success": False,
            "error": err_msg
        }))
        sys.exit(1)

    try:
        sys.stderr.write("STAGE:loading_model\n")
        sys.stderr.flush()
        sys.stderr.write(f"Loading faster-whisper model '{model_size}' on {device} ({compute_type})...\n")
        sys.stderr.flush()
        model = WhisperModel(model_size, device=device, compute_type=compute_type)

        lang_arg = None if language in ["auto", "Auto-detect", "", None] else language
        is_swahili = (lang_arg == "sw")

        sys.stderr.write("STAGE:transcribing\n")
        sys.stderr.flush()
        sys.stderr.write(f"Transcribing '{video_path}' with language='{lang_arg or 'auto-detect'}' (Swahili-optimizations: {is_swahili})...\n")
        sys.stderr.flush()

        transcribe_kwargs = {
            "word_timestamps": True,
            "beam_size": 5,
            "vad_filter": True,
            "vad_parameters": dict(min_silence_duration_ms=450),
            "temperature": 0.0,
        }

        if lang_arg:
            transcribe_kwargs["language"] = lang_arg

        if is_swahili:
            # Crucial optimizations for Swahili morphology & anti-hallucination
            transcribe_kwargs["initial_prompt"] = SWAHILI_INITIAL_PROMPT
            transcribe_kwargs["condition_on_previous_text"] = False
            transcribe_kwargs["compression_ratio_threshold"] = 2.2
            transcribe_kwargs["no_speech_threshold"] = 0.6

        segments_raw, info = model.transcribe(video_path, **transcribe_kwargs)

        detected_language = info.language
        duration = info.duration or 1.0

        # If language was auto-detected as Swahili, flag it
        if detected_language == "sw":
            is_swahili = True

        segments_list = []
        words_flat = []

        for segment in segments_raw:
            seg_text = segment.text.strip()
            if is_swahili:
                seg_text = normalize_swahili_text(seg_text)

            seg_words = []
            if segment.words:
                for w in segment.words:
                    w_text = w.word.strip()
                    if is_swahili:
                        w_text = normalize_swahili_text(w_text)

                    word_obj = {
                        "word": w_text,
                        "start": round(w.start, 3),
                        "end": round(w.end, 3),
                        "probability": round(w.probability, 3)
                    }
                    seg_words.append(word_obj)
                    words_flat.append(word_obj)

            segments_list.append({
                "id": str(segment.id),
                "start": round(segment.start, 3),
                "end": round(segment.end, 3),
                "text": seg_text,
                "words": seg_words
            })

            # Emit progress percentage after each segment
            if duration and duration > 0:
                pct = min(99, max(1, int((segment.end / duration) * 100)))
                sys.stderr.write(f"PROGRESS:{pct}\n")
                sys.stderr.flush()

        sys.stderr.write("PROGRESS:100\n")
        sys.stderr.flush()

        output = {
            "success": True,
            "detected_language": detected_language,
            "language_probability": round(info.language_probability, 3),
            "duration": round(duration, 3),
            "segments": segments_list,
            "all_words": words_flat
        }

        sys.stderr.write(f"Transcription complete: {len(segments_list)} segments, {len(words_flat)} words.\n")
        print(json.dumps(output, ensure_ascii=False))

    except Exception as e:
        err_msg = f"Transcription error: {str(e)}"
        sys.stderr.write(err_msg + "\n")
        print(json.dumps({
            "success": False,
            "error": err_msg
        }))
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcribe video using faster-whisper")
    parser.add_argument("pos_video", nargs="?", default=None, help="Path to video file (positional)")
    parser.add_argument("pos_language", nargs="?", default=None, help="Language code (positional)")
    parser.add_argument("pos_model", nargs="?", default=None, help="Model size (positional)")

    parser.add_argument("--video", default=None, help="Path to video file")
    parser.add_argument("--language", default=None, help="Language code (e.g., en, sw, es, fr, auto)")
    parser.add_argument("--model", default="small", help="Whisper model size (tiny, base, small, medium, large-v3)")
    parser.add_argument("--device", default="cpu", help="Device to run on (cpu, cuda)")
    parser.add_argument("--compute_type", default="int8", help="Compute type (int8, float16, float32)")

    args = parser.parse_args()

    target_video = args.video or args.pos_video
    target_language = args.language or args.pos_language or "auto"
    target_model = args.pos_model or args.model or "small"

    if not target_video:
        err_msg = "Error: Video path not specified. Usage: python transcribe.py <path> [language] [model]"
        sys.stderr.write(err_msg + "\n")
        print(json.dumps({"success": False, "error": err_msg}))
        sys.exit(1)

    transcribe_video(target_video, target_language, target_model, args.compute_type, args.device)
