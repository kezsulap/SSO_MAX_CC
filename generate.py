import sys
import subprocess
import os
def escape(c):
	c = c.replace('\\', '\\\\');
	c = c.replace('\r', '\\r');
	c = c.replace('\n', '\\n');
	c = c.replace('\'', '\\\'');
	c = '\'' + c + '\''
	return c

def main():
	script, *files = sys.argv
	diff = False
	if files and files[0] == '-d':
		files = files[1:]
		diff = True
	if not files:
		files = ['description.txt']
	content = []
	for filename in files:
		if type(filename) == str:
			with open(filename, 'r') as f:
				c = f.read();
		content.append(escape(c))
		if diff:
			content.append(escape(subprocess.run(['git', 'show', 'HEAD:' + filename], capture_output=True, text=True).stdout))
	output = '[' + ','.join(content) + ']'
	
	index = subprocess.run(['git', 'show', 'code:index.html'], capture_output=True, text=True).stdout.strip()
	with open('output.html', 'w') as output_file:
		index = index.replace('resources', 'resources_main').replace('hardcoded=undefined', 'hardcoded=' + output);
		print(index, file=output_file)
	subprocess.run(['rm', '-rf', 'resources_main'])
	os.mkdir('resources_main')
	for dirname in subprocess.run(['git', 'show', 'code:resources/all_directories_list'], capture_output=True, text=True).stdout.split('\n'):
		if not dirname:
			continue
		os.mkdir('resources_main/' + dirname)
	for filename in subprocess.run(['git', 'show', 'code:resources/all_files_list'], capture_output=True, text=True).stdout.split('\n'):
		if not filename:
			continue
		with open('resources_main/' + filename, 'w') as output_file:
			subprocess.run(['git', 'show', 'code:resources/' + filename], stdout=output_file)

if __name__ == '__main__':
	main()
