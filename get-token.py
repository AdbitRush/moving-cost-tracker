import re
with open('/root/openclaw/.env') as f:
    content = f.read()
m = re.search(r'GITHUB_TOKEN=(\S+)', content)
if m:
    print(m.group(1))
else:
    exit(1)
