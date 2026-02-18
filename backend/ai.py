import os
import json
from openai import OpenAI

def parse_task(text: str):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY missing. Put it in backend/.env then restart uvicorn.")

    client = OpenAI(api_key=api_key)

    prompt = f"""
Extract:
- title (short)
- notes (optional)
- priority: 1=high, 2=medium, 3=low

Return ONLY JSON (no markdown, no backticks) with keys:
title, notes, priority

Text: {text}
"""

    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Return ONLY raw JSON. No markdown."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
    )

    content = resp.choices[0].message.content.strip()

    # Safety: sometimes models still wrap in ```json ... ```
    if content.startswith("```"):
        content = content.split("```", 2)[1]
        content = content.replace("json", "", 1).strip()

    return json.loads(content)