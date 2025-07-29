import os
import re
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from google.cloud import vision
from werkzeug.utils import secure_filename

# ==== CONFIGURATION ====
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Set up Google Vision credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'premium-trainer-443622-c8-f46b4ced06f6.json'
vision_client = vision.ImageAnnotatorClient()

# ==== ROUTES ====
@app.route('/')
def index():
    return jsonify({"message": "Flask backend is running"})

@app.route('/extract', methods=['POST'])
def extract_codes():
    if 'images' not in request.files:
        return jsonify({'error': 'No images uploaded'}), 400

    files = request.files.getlist('images')
    if not files:
        return jsonify({'error': 'No selected files'}), 400

    all_found_codes = []

    for file in files:
        if file.filename == '':
            continue

        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        # Read image content
        with open(file_path, 'rb') as f:
            content = f.read()

        image = vision.Image(content=content)
        response = vision_client.text_detection(image=image)
        annotations = response.text_annotations

        if response.error.message:
            return jsonify({'error': f'Vision API error: {response.error.message}'}), 500

        if not annotations:
            continue

        full_text = annotations[0].description

        # Filter text lines
        filtered_lines = []
        for line in full_text.split('\n'):
            if not all(ord(char) < 128 for char in line):  # ASCII check
                continue
            if sum(c.isdigit() for c in line) >= 12:
                filtered_lines.append(line)

        filtered_text = '\n'.join(filtered_lines)

        # Define recharge code patterns
        patterns = [
            r'\b\d{4} \d{3} \d{4} \d{4}\b',
            r'\b\d{4} \d{4} \d{4} \d{2}\b',
            r'\b\d{16}\b',
            r'\bT\d{15}\b',
            r'\b\d{14}\b'
        ]

        for pattern in patterns:
            matches = re.findall(pattern, filtered_text)
            cleaned_matches = [match.replace(' ', '') for match in matches]
            all_found_codes += cleaned_matches

    return jsonify({'codes': list(set(all_found_codes))})

if __name__ == '__main__':
    app.run(debug=True)