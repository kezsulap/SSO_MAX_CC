#!/usr/bin/python3
import argparse
import os
import itertools

import tempfile

import subprocess
import sys

from playwright.sync_api import sync_playwright, Playwright
import bs4

RED = "\u001b[31m";
GREEN = "\u001b[32m";
YELLOW = "\u001b[33m";
RESET = "\u001b[0m";

def get_content(url):
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
	return output.split("/", 1)[-1].removesuffix("-out")

def matches(test_matcher, test_name):
	test_name = test_name.removesuffix('.in')
	parts = test_name.split('/')
	for i in range(len(parts)):
		got = "/".join(parts[:(i + 1)])
		if got == test_matcher:
			return True
	return False

def diff_HTML(output, expected_output):
	expected_output_soup = bs4.BeautifulSoup(expected_output, 'html.parser')
	output_soup = bs4.BeautifulSoup(output, 'html.parser')
	errors = []
	def extract_attrs_in_canonical_form(element):
		attrs = dict(element.attrs)
		if 'class' in attrs:
			attrs['class'] = sorted(attrs['class'])
		return attrs

	def filter_children_elements(element):
		def process(subelement):
			if isinstance(subelement, bs4.element.Comment):
				return None
			if isinstance(subelement, str):
				subelement = subelement.strip()
				if subelement:
					return subelement
				return None
			if isinstance(subelement, bs4.element.Tag):
				return subelement
			print(RED + f'Unknown element type: {type(subelement)}' + RESET, file=sys.stderr)
			assert False

		return [px for px in (process(x) for x in element.contents) if px is not None]

	def format(element):
		LEN_THRESHOLD = 100
		ret = repr(element)
		if len(ret) > LEN_THRESHOLD:
			ret = ret[:LEN_THRESHOLD] + '...'
		return ret.replace('\n', r'\n')

	def format_list(element_list):
		return f'{len(element_list)} elements: ' + ", ".join((format(x) for x in element_list))

	def rec_cmp(output_element, expected_output_element):
		output_element_canonical_form_attrs = extract_attrs_in_canonical_form(output_element)
		expected_output_element_canonical_form_attrs = extract_attrs_in_canonical_form(expected_output_element)
		if output_element.name != expected_output_element.name:
			errors.append(f'Mismatched tag type, expected: {expected_output_element.name}, found {output_element.name} at {format(output_element)}')

		if output_element_canonical_form_attrs != expected_output_element_canonical_form_attrs:
			errors.append(f'Mismatched attributes, expected: {expected_output_element_canonical_form_attrs}, found: {output_element_canonical_form_attrs}')

		output_element_filtered_children = filter_children_elements(output_element)
		expected_output_element_filtered_children = filter_children_elements(expected_output_element)
		if len(output_element_filtered_children) != len(expected_output_element_filtered_children):
			errors.append(f'Mismatched element length: expected: {format_list(expected_output_element_filtered_children)}, found: {format_list(output_element_filtered_children)}')
		else:
			for output_subelement, expected_output_subelement in zip(output_element_filtered_children, expected_output_element_filtered_children):
				if type(output_subelement) != type(expected_output_subelement):
					errors.append(f'Mismatched types of subcontent, expected: {format(expected_output_subelement)}, found: {output_subelement}')
				if isinstance(output_subelement, str):
					if output_subelement != expected_output_subelement:
						errors.append(f'Mismatched content, expected: {expected_output_subelement}, found {output_subelement}')
				else:
					rec_cmp(output_subelement, expected_output_subelement)

	rec_cmp(output_soup.select('body')[0], expected_output_soup.select('body')[0])
	return errors

def main():
	parser = argparse.ArgumentParser()
	parser.add_argument('files', nargs='*')
	parser.add_argument('--dont-create-if-no-output', '-d', action='store_true')
	parser.add_argument('--add-new-outputs', '-n', action='store_true')
	parser.add_argument('--add-alternate-outputs', '-a', action='store_true')
	parser.add_argument('--output_name', '-o')
	parser.add_argument('--open-all', '-p', action='store_true')
	parser.add_argument('--generate-missing-only', '-g', action='store_true')
	args = parser.parse_args()
	if args.add_new_outputs and args.add_alternate_outputs:
		print('Combining --add-new-outputs with --add-alternate-outputs is invalid')
		sys.exit(1)

	if args.dont_create_if_no_output and args.generate_missing_only:
		print('Combining --dont-create-if-no-output with --generate-missing-only is invalid')
		sys.exit(1)

	failed_tests = []
	tests = fetch_test_files()
	test_names = [get_test_name(output) for (input, output) in tests]
	for file in args.files:
		if not any([matches(file, get_test_name(x[1])) for x in tests]):
			print(f'Unknown test {file}')
			sys.exit(1)

	test_outputs = []

	for inputs, output in tests:
		test_name = get_test_name(output)
		try:
			os.mkdir(output)
		except FileExistsError:
			pass
		possible_outputs = sorted([x for x in os.listdir(output) if x.endswith('.html')])
		if possible_outputs and args.generate_missing_only:
			continue
		if args.files and not any([matches(matcher, test_name) for matcher in args.files]):
			continue;
		with tempfile.NamedTemporaryFile(suffix='.html', delete=False) as f:
			output_name = f.name
		subprocess.run(['./generate.sh'] + [filename for _, filename in inputs] + ['-o', output_name])
		input_links = [f'file://{os.getcwd()}/{x[1]}' for x in inputs]
		if len(input_links) == 1:
			all_inputs = f'\tINPUT: {input_links[0]}'
		else:
			all_inputs = '\tINPUTS: ' + '\n\t\t'.join(input_links)
		test_log = f'RUNNING TEST: {test_name}\n{all_inputs}\n\tOUTPUT: file://{output_name}\n'
		test_outputs.append(f'file://{output_name}')
		test_output = get_content(f'file://{output_name}?theme=disable')
		if not possible_outputs:
			if args.dont_create_if_no_output:
				test_log += f'\tNo output file found, ERROR'
				color_code = RED
				failed_tests.append(test_name)
			else:
				output_name = args.output_name if args.output_name else 'out'
				with open(os.path.join(output, output_name + '.html'), 'w') as f:
					f.write(test_output)
				test_log += f'\tNo output file found, generated file://{os.path.join(os.getcwd(), output, output_name + ".html")}\n'
				color_code = YELLOW
		else:
			if args.add_new_outputs:
				existing_outputs = sorted(os.listdir(output))
				test_log += f'Deleting existing output files: {", ".join(existing_outputs)}\n'
				for x in existing_outputs:
					os.remove(os.path.join(output, x))
				output_name = args.output_name if args.output_name else 'out'
				with open(os.path.join(output, output_name + '.html'), 'w') as f:
					f.write(test_output)
				test_log += f'Succesfully saved new output as file://{os.getcwd()}/{output}/{output_name}.html\n'
				color_code = YELLOW
			else:
				all_mismatches = []
				found = False
				for possible_output in possible_outputs:
					print(os.path.join(output, possible_output))
					with open(os.path.join(output, possible_output), 'r') as f:
						found_content = f.read()
					errors = diff_HTML(test_output, found_content)
					if errors:
						all_mismatches.append(errors)
					else:
						found = True;
						test_log += f'\tMATCHING: file://{os.getcwd()}/{output}/{possible_output}\n'
						color_code = GREEN
						break;
				if not found:
					if args.add_alternate_outputs:
						for i in itertools.count(1):
							tried_filename = (args.output_name if args.output_name else 'out') + (str(i) if i > 1 else '') + '.html'
							try:
								with open(os.path.join(output, tried_filename), 'x') as f:
									f.write(test_output)
								test_log += f'Succesfully saved new output as file://{os.getcwd()}/{output}/{tried_filename}\n'
								color_code = YELLOW
								break;
							except FileExistsError:
								continue
					else:
						failed_tests.append(test_name)
						if len(possible_outputs) == 1:
							test_log += f'EXPECTED OUTPUT: file://{os.getcwd()}/{output}/{possible_outputs[0]}\n\t' + '\n\t'.join(all_mismatches[0]) + '\n'
						else:
							outputs = "\n".join([f"\tfile://{os.getcwd()}/{output}/{x}\n\t\t" + '\n\t\t'.join(errors) for x, errors in zip(possible_outputs, all_mismatches)])
							test_log += f'VALID OUTPUTS:\n{outputs}\n'
						test_log += 'FAILED\n'
						color_code = RED
		print(color_code + test_log + RESET)

	if failed_tests:
		failed_tests_names = " ".join(failed_tests)
		print(RED + f'FAILED: {len(failed_tests)} tests: {failed_tests_names}' + RESET)
	
	if args.open_all and test_outputs:
		subprocess.run(['google-chrome'] + test_outputs)
		

if __name__ == "__main__":
	main()
