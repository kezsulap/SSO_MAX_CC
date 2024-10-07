import sys
import subprocess
import os
def main():
	script, *files = sys.argv
	if not files:
		print(f'Usage: {script} file [files]', file=sys.stderr)
		sys.exit(1)
	content = []

	for filename in files:
		with open(filename, 'r') as f:
			c = f.read();
		c = c.replace('\\', '\\\\');
		c = c.replace('\r', '\\r');
		c = c.replace('\n', '\\n');
		c = c.replace('\'', '\\\'');
		content.append('\'' + c + '\'');
	output = '[' + ','.join(content) + ']'
	
	index = subprocess.run(['git', 'show', 'code:index.html'], capture_output=True, text=True).stdout.strip()
	with open('output.html', 'w') as output_file:
		index = index.replace('resources', 'resources_main').replace('hardcoded=undefined', 'hardcoded=' + output);
		print(index, file=output_file)
	subprocess.run(['rm', '-rf', 'resources_main'])
	os.mkdir('resources_main')
	for filename in subprocess.run(['git', 'show', 'code:resources/all_files_list'], capture_output=True, text=True).stdout.split('\n'):
		if not filename:
			continue
		with open('resources_main/' + filename, 'w') as output_file:
			subprocess.run(['git', 'show', 'code:resources/' + filename], stdout=output_file)

if __name__ == '__main__':
	main()
