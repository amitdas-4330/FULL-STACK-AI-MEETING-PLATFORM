from flask import Flask, request, jsonify
from flask_cors import CORS

from openai import OpenAI

from dotenv import load_dotenv

from fpdf import FPDF

import tempfile
import os
import json
from pathlib import Path

load_dotenv()

app = Flask(__name__)

CORS(app)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


@app.route("/health", methods=["GET"])
def health_check():

    return jsonify({
        "status": "AI server running"
    })


def detect_language(transcript):

    if not transcript:
        return {
            "language": "unknown",
            "confidence": None
        }

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            response_format={
                "type": "json_object"
            },
            messages=[
                {
                    "role": "system",
                    "content": """
                    Detect the primary language of the text.
                    Return JSON with:
                    language: readable language name
                    confidence: number from 0 to 1
                    """
                },
                {
                    "role": "user",
                    "content": transcript
                }
            ]
        )

        raw_content = response.choices[0].message.content

        return json.loads(raw_content)

    except Exception:
        return {
            "language": "unknown",
            "confidence": None
        }


def normalize_transcript(transcript):

    if isinstance(transcript, list):

        lines = []

        for item in transcript:
            speaker = item.get("speaker", "Unknown")
            text = item.get("transcript", "")
            language = item.get("language", "unknown")

            if text:
                lines.append(
                    f"{speaker} ({language}): {text}"
                )

        return "\n".join(lines)

    return transcript or ""


def get_audio_suffix(audio_file):

    suffix = Path(audio_file.filename or "").suffix

    if suffix:
        return suffix

    if audio_file.mimetype == "audio/mp4":
        return ".mp4"

    if audio_file.mimetype in [
        "audio/mpeg",
        "audio/mp3"
    ]:
        return ".mp3"

    if audio_file.mimetype == "audio/wav":
        return ".wav"

    return ".webm"

# ======================================================
# TRANSCRIPTION
# ======================================================

@app.route("/transcribe", methods=["POST"])
def transcribe_audio():

    if "audio" not in request.files:
        return jsonify({
            "error": "No audio file"
        }), 400

    audio_file = request.files["audio"]
    speaker = request.form.get("speaker", "Unknown")
    user_id = request.form.get("userId", "")

    temp_audio_path = None

    try:

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=get_audio_suffix(audio_file)
        ) as temp_audio:

            temp_audio_path = temp_audio.name
            audio_file.save(temp_audio_path)

        with open(temp_audio_path, "rb") as file:

            transcript = client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=file
            )

        return jsonify({
            "speaker": speaker,
            "userId": user_id,
            "transcript": transcript.text
        })

    except Exception as error:

        error_message = str(error)

        if (
            "Audio file might be corrupted or unsupported"
            in error_message
        ):
            return jsonify({
                "speaker": speaker,
                "userId": user_id,
                "transcript": "",
                "language": "unknown",
                "confidence": None
            })

        return jsonify({
            "error": error_message
        }), 502

    finally:

        if temp_audio_path and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)


# ======================================================
# LIVE AUDIO CHUNK TRANSCRIPTION
# ======================================================

@app.route("/audio-chunk", methods=["POST"])
def transcribe_audio_chunk():

    if "audio" not in request.files:
        return jsonify({
            "error": "No audio file"
        }), 400

    speaker = request.form.get("speaker", "Unknown")
    user_id = request.form.get("userId", "")

    audio_file = request.files["audio"]

    temp_audio_path = None

    try:

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=get_audio_suffix(audio_file)
        ) as temp_audio:

            temp_audio_path = temp_audio.name
            audio_file.save(temp_audio_path)

        if os.path.getsize(temp_audio_path) < 1000:
            return jsonify({
                "speaker": speaker,
                "userId": user_id,
                "transcript": "",
                "language": "unknown",
                "confidence": None
            })

        with open(temp_audio_path, "rb") as file:

            transcript = client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=file
            )

        transcript_text = transcript.text.strip()

        if not transcript_text:
            return jsonify({
                "speaker": speaker,
                "userId": user_id,
                "transcript": "",
                "language": "unknown",
                "confidence": None
            })

        language_result = detect_language(transcript_text)

        return jsonify({
            "speaker": speaker,
            "userId": user_id,
            "transcript": transcript_text,
            "language":
                language_result.get("language", "unknown"),
            "confidence":
                language_result.get("confidence")
        })

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 502

    finally:

        if temp_audio_path and os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

# ======================================================
# SUMMARY
# ======================================================

@app.route("/summary", methods=["POST"])
def generate_summary():

    data = request.json

    transcript = normalize_transcript(
        data.get("transcript")
    )

    attendance = data.get("attendance", [])

    attendance_threshold = data.get(
        "attendanceThresholdMinutes",
        10
    )

    attendance_lines = []

    for user in attendance:
        status = (
            "Present"
            if user.get("present")
            else "Absent"
        )

        attendance_lines.append(
            f"{user.get('name', 'Unknown')}: "
            f"{status}, "
            f"{user.get('elapsedMinutes', 0)} minutes"
        )

    attendance_text = "\n".join(attendance_lines)

    try:

        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            max_tokens=160,
            messages=[
                {
                    "role": "system",
                    "content": """
                    Create a short meeting summary.
                    Keep it under 5 lines and under 80 words.
                    Focus only on the most important discussion,
                    decisions and action items. Do not add long
                    explanations or headings.
                    """
                },
                {
                    "role": "user",
                    "content": f"""
                    Attendance threshold: {attendance_threshold} minutes
                    Attendance: {attendance_text}

                    Transcript:
                    {transcript}
                    """
                }
            ]
        )

        summary = response.choices[0].message.content

        return jsonify({
            "summary": summary
        })

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 502

# ======================================================
# PDF GENERATION
# ======================================================

@app.route("/generate-pdf", methods=["POST"])
def generate_pdf():

    data = request.json

    summary = data.get("summary")

    pdf = FPDF()

    pdf.add_page()

    pdf.set_font("Arial", size=12)

    pdf.multi_cell(
        0,
        10,
        summary
    )

    pdf_path = "meeting_summary.pdf"

    pdf.output(pdf_path)

    return jsonify({
        "pdf": pdf_path
    })

# ======================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=8000,
        debug=True
    )
