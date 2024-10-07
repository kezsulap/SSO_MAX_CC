import os
found = os.popen("grep -Eno '[()]?[0-9][()]?[0-9][()]?[0-9][()]?[0-9][()]?' description.txt | sed 's/(//g' | sed 's/)//g'").read()
for entry in found.split('\n'):
	if not entry:
		break
	line, shape = entry.split(':')
	if sum(map(int, shape)) != 13:
		print(f'{line}:{shape}')
