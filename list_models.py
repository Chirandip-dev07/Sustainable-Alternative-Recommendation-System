import os
import requests
from dotenv import load_dotenv

load_dotenv('frontend/.env')
api_key = os.environ.get('GOOGLE_GEMINI_API_KEY')
response = requests.get(f'https://generativelanguage.googleapis.com/v1beta/models?key={api_key}')
models = response.json().get('models', [])
for m in models:
    print(m['name'])
