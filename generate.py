import sys
import subprocess
import os
import shutil

def escape(c):
	c = c.replace('\\', '\\\\');
	c = c.replace('\r', '\\r');
	c = c.replace('\n', '\\n');
	c = c.replace('\'', '\\\'');
	c = '\'' + c + '\''
	return c

def get_file(filename, version):
	if version is None:
		with open(filename, 'r') as f:
			return f.read()
	else:
		return subprocess.run(['git', 'show', f'{version}:{filename}'], capture_output=True, text=True).stdout

def copy_file(filename, destination, version):
	if version is None:
		shutil.copy(filename, destination)
	else:
		with open(destination, 'w') as output_file:
			subprocess.run(['git', 'show', 'code:' + filename], stdout=output_file)
			

def main():
	script, *files = sys.argv
	from_branch = None
	flag_c = False
	if files and files[0] == '-c':
		from_branch = 'code'
		files = files[1:]
		flag_c = True
	diff = False
	if files and files[0] == '-d':
		files = files[1:]
		diff = True
	content_branch = None
	if not files:
		files = ['description.txt']
		if not flag_c:
			content_branch = 'main'
	content = []
	for filename in files:
		c = get_file(filename, content_branch)
		content.append(escape(c))
		if diff:
			content.append(escape(get_file(filename, 'HEAD')))
	output = '[' + ','.join(content) + ']'
	
	index = get_file('index.html', from_branch)
	with open('output.html', 'w') as output_file:
		index = index.replace('resources', 'resources_main').replace('hardcoded=undefined', 'hardcoded=' + output);
		print(index, file=output_file)
	subprocess.run(['rm', '-rf', 'resources_main'])
	os.mkdir('resources_main')
	for dirname in get_file('resources/all_directories_list', from_branch).split('\n'):
		if not dirname:
			continue
		os.mkdir('resources_main/' + dirname)
	for filename in get_file('resources/all_files_list', from_branch).split('\n'):
		if not filename:
			continue
		copy_file('resources/' + filename, 'resources_main/' + filename, from_branch)

if __name__ == '__main__':
	main()
