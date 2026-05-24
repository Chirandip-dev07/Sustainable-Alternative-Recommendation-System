import os

page_path = r"C:\Users\sarka\.gemini\antigravity\scratch\econova-greenlens\frontend\src\app\page.tsx"
output_path = r"C:\Users\sarka\.gemini\antigravity\scratch\econova-greenlens\scroll_search_results.txt"

lines_out = []
if os.path.exists(page_path):
    with open(page_path, 'r', encoding='utf-8') as f:
        for idx, line in enumerate(f):
            # check for various scroll, chevron, arrow, or anchor terms
            line_lower = line.lower()
            if any(term in line_lower for term in ['scroll', 'arrow', 'chevron', 'href="#', 'scrollintoview']):
                lines_out.append(f"Line {idx+1}: {line.strip()}")
else:
    lines_out.append("page.tsx not found")

with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines_out))
print("Done searching page.tsx!")
