import json

def parse_ai_output(raw: str):
    try:
        return json.loads(raw)
    except:
        return {
            "error": "invalid_json",
            "raw": raw
        }