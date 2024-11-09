#!/usr/bin/python3
import argparse
import os
import itertools

import tempfile

import subprocess
import sys

from playwright.sync_api import sync_playwright, Playwright

def get_content(url):
	# playwright = sync_playwright().__enter__()
	with sync_playwright() as playwright:
		webkit = playwright.webkit
		browser = webkit.launch()
		context = browser.new_context()
		page = context.new_page()
		page.goto(url)
		return page.content()

def fetch_test_files():
	input_files = []
	for root, _, files in os.walk('integration-tests'):
		input_files += [os.path.join(root, filename) for filename in files if filename.endswith('.in')]
	input_files.sort()
	groups = {}
	for filename in input_files:
		version = None
		if '-diff-' in filename:
			test_name, version = filename.split('.in')[0].split('-diff-')
			output_filename = test_name + '-out'
		else:
			output_filename = filename.split('.in')[0] + '-out'
		output_filename = output_filename
		if output_filename not in groups:
			groups[output_filename] = []
		groups[output_filename].append([version, filename])
	return [(input, output) for output, input in groups.items()]

def get_test_name(output):
	return output.split("/", 1)[-1].split("-out")[0]

def main():
	parser = argparse.ArgumentParser()
	parser.add_argument('files', nargs='*')
	parser.add_argument('--add-new-outputs', '-n', action='store_true')
	parser.add_argument('--add-alternate-outputs', '-a', action='store_true')
	parser.add_argument('--output_name', '-o')
	parser.add_argument('--open-all', '-p', action='store_true')
	args = parser.parse_args()
	if args.add_new_outputs and args.add_alternate_outputs:
		print('Combining --add-new-outputs with --add-alternate-outputs is invalid')
		sys.exit(1)

	failed_tests = []
	tests = fetch_test_files()
	test_names = [get_test_name(output) for (input, output) in tests]
	for file in args.files:
		if file not in test_names:
			print(f'Unknown test {file}')
			sys.exit(1)

	test_outputs = []

	for inputs, output in tests:
		test_name = get_test_name(output)
		if args.files and test_name not in args.files: #O(n^2)
			continue;
		with tempfile.NamedTemporaryFile(suffix='.html', delete=False) as f:
			output_name = f.name
		subprocess.run(['./generate.sh'] + [filename for _, filename in inputs] + ['-o', output_name])
		all_inputs = " ".join([f'file://{os.getcwd()}/{x[1]}' for x in inputs])
		print(f'{test_name} {all_inputs} file://{output_name} ', end='')
		test_outputs.append(f'file://{output_name}')
		test_output = get_content(f'file://{output_name}')
		try:
			os.mkdir(output)
		except FileExistsError:
			pass
		possible_outputs = sorted(os.listdir(output))
		if not possible_outputs:
			output_name = args.output_name if args.output_name else 'out'
			with open(os.path.join(output, output_name + '.html'), 'w') as f:
				f.write(test_output)
			print(f'No output file found, generated file://{os.path.join(os.getcwd(), output, output_name + ".html")}')
		else:
			if args.add_new_outputs:
				existing_outputs = sorted(os.listdir(output))
				print(f'Deleting existing output files: {", ".join(existing_outputs)}')
				for x in existing_outputs:
					os.remove(os.path.join(output, x))
				output_name = args.output_name if args.output_name else 'out'
				with open(os.path.join(output, output_name + '.html'), 'w') as f:
					f.write(test_output)
				print(f'Succesfully saved new output as file://{os.getcwd()}/{output}/{output_name}.html')
			else:
				found = False
				for possible_output in possible_outputs:
					with open(os.path.join(output, possible_output), 'r') as f:
						if f.read() == test_output:
							found = True;
							print(f'Matching file://{os.getcwd()}/{output}/{possible_output}')
							break;
				if not found:
					if args.add_alternate_outputs:
						for i in itertools.count(1):
							tried_filename = (args.output_name if args.output_name else 'out') + (str(i) if i > 1 else '') + '.html'
							try:
								with open(os.path.join(output, tried_filename), 'x') as f:
									f.write(test_output)
								print(f'Succesfully saved new output as file://{os.getcwd()}/{output}/{tried_filename}')
								break;
							except FileExistsError:
								continue
					else:
						failed_tests.append(test_name)
						if len(possible_outputs) == 1:
							print(f'expected output file://{os.getcwd()}/{output}/{possible_outputs[0]}')
						else:
							outputs = " ".join([f"file://{os.getcwd()}/{output}/{x}" for x in possible_outputs])
							print(f'valid outputs: {outputs}')
						print(f'FAILED')

	if failed_tests:
		failed_tests_names = " ".join(failed_tests)
		print(f'FAILED: {len(failed_tests)} tests: {failed_tests_names}')
	
	if args.open_all and test_outputs:
		subprocess.run(['google-chrome'] + test_outputs)
		

if __name__ == "__main__":
	main()
