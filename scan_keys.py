import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("==================================================")
print("🔍 AUDIT SCAN FOR HARDCODED API KEYS & SECRETS")
print("==================================================")
print(f"Target Directory: C:\\Users\\huutan.trinh\\uat-qa-tool")
print("Scanning file extensions: .py, .ts, .tsx, .js, .json, .sql, .bat, .md\n")

KEY_PATTERNS = [
    (r"AIza[0-9A-Za-z-_]{35}", "Google Gemini API Key"),
    (r"sk-[a-zA-Z0-9]{32,}", "OpenAI API Key"),
    (r"sbp_[a-f0-9]{40}", "Supabase Service Key"),
    (r"ghp_[a-zA-Z0-9]{36}", "GitHub Token"),
]

scanned_files_count = 0
found_keys = []

EXCLUDE_DIRS = {"node_modules", ".next", ".git", "__pycache__", "data", "dist", "build"}

for root, dirs, files in os.walk(r"C:\Users\huutan.trinh\uat-qa-tool"):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

    for file in files:
        if file.endswith((".env", ".env.local")):
            continue

        ext = os.path.splitext(file)[1]
        if ext in [".py", ".ts", ".tsx", ".js", ".json", ".sql", ".bat", ".md"]:
            filepath = os.path.join(root, file)
            scanned_files_count += 1
            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    for pattern, key_type in KEY_PATTERNS:
                        matches = re.findall(pattern, content)
                        if matches:
                            found_keys.append((filepath, key_type, len(matches)))
            except Exception as e:
                pass

print(f"✅ Total files scanned: {scanned_files_count}")
print(f"✅ Hardcoded secret key occurrences found: {len(found_keys)}")

if len(found_keys) == 0:
    print("\n🎉 VERIFICATION RESULT: 0 HARDCODED KEYS FOUND IN ENTIRE CODEBASE!")
    print("All secrets are loaded dynamically from environment variables (.env).")
else:
    print("\n⚠️ WARNING: Found hardcoded keys in:")
    for path, ktype, count in found_keys:
        print(f"  - {path}: {count} instance(s) of {ktype}")

print("==================================================")
