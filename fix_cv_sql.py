import re

# Read the file
with open('migrations/seed_test_data_part5_cvs.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix ARRAY syntax - ensure all items are properly quoted with single quotes
# Match ARRAY[...] and fix any double quotes or missing quotes
def fix_array_syntax(match):
    array_content = match.group(1)
    # Split by comma and clean up each item
    items = []
    # Handle both single and double quoted items
    for item in re.findall(r'["\']([^"\']+)["\']', array_content):
        items.append(item)
    
    if items:
        return "ARRAY['" + "','".join(items) + "']"
    return match.group(0)

# Fix all ARRAY declarations
content = re.sub(r'ARRAY\[([^\]]+)\]', fix_array_syntax, content)

# Write back
with open('migrations/seed_test_data_part5_cvs.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed ARRAY syntax!")
