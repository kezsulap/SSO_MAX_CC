import sys
import subprocess
import os
import shutil
import argparse

def escape(c):
	c = c.replace('\\', '\\\\');
	c = c.replace('\r', '\\r');
	c = c.replace('\n', '\\n');
	c = c.replace('\'', '\\\'');
	c = '\'' + c + '\''
	return c

def get_file(filename, version):
	if ':' in filename:
		version, filename = filename.split(':', 1)
		if not filename:
			filename = 'description.txt'
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
	parser = argparse.ArgumentParser()
	parser.add_argument('files', nargs='*')
	parser.add_argument('--code-branch', '-c', action='store_true')
	parser.add_argument('--diff-auto', '-d', action='store_true')
	parser.add_argument('--output-file', '-o')
	parser.add_argument('--quiz-output', '-q')
	
	args = parser.parse_args();
	files = args.files
	from_branch = None

	diff = args.diff_auto
	if diff and args.code_branch:
		print('Error: --diff-auto combined with --code-branch', file=sys.stderr)
		sys.exit(1)
	if args.code_branch:
		from_branch = 'code'
	output_file = args.output_file
	content_branch = None
	if not files:
		files = ['description.txt']
		if not args.code_branch:
			content_branch = 'main'
	content = []
	for filename in files:
		if diff:
			content.append(escape(get_file(filename, 'HEAD')))
		content.append(escape(get_file(filename, content_branch)))
	quiz_output = args.quiz_output
	output = '[' + ','.join(content) + ']'
	
	if quiz_output is not None and len(files) > 1:
		print('Quiz not supported with multiple input files', file=sys.stderr)
		sys.exit(1)

	if output_file is None and quiz_output is None:
		to_process = [['index.html', 'output.html']]
		if len(content) == 1:
			to_process.append(['quiz.html', quiz_output if quiz_output is not None else 'quiz-output.html'])
		else:
			try:
				os.remove('quiz-output.html')
			except FileNotFoundError:
				pass
	else:
		to_process = []
		if output_file is not None:
			to_process.append(['index.html', output_file])
		if quiz_output is not None:
			to_process.append(['quiz.html', quiz_output])

	for input_name, output_name in to_process:
		content = get_file(input_name, from_branch)
		with open(output_name, 'w') as output_file:
			content = content.replace('./resources', 'file:///' + os.path.join(os.getcwd(), 'resources_main')).replace('hardcoded=undefined', 'hardcoded=' + output);
			print(content, file=output_file)
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
