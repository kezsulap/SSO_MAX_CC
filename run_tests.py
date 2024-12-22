#!/usr/bin/python3
import argparse
import os
import itertools
import re

import tempfile

import subprocess
import sys

from playwright.sync_api import sync_playwright, Playwright
import bs4

RED = "\u001b[31m";
ORANGE='\033[38:2:255:165:0m';
GREEN = "\u001b[32m";
YELLOW = "\u001b[33m";
RESET_COLOURS = "\u001b[0m";

def get_content(url, engine_name):
	with sync_playwright() as playwright: #TODO: make async
		engine = getattr(playwright, engine_name)
		browser = engine.launch()
		context = browser.new_context()
		page = context.new_page()
		page.goto(url)
		return page.content()

def get_content_from_path(path, engine_name):
	return get_content(make_file_link(os.path.abspath(path)), engine_name);

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

def strip_body(html_content):
	return bs4.BeautifulSoup(html_content, 'html.parser').select('body')[0].prettify() #TODO: Make matching change in expected_output_to_functional_link
	# return str(bs4.BeautifulSoup(html_content, 'html.parser').select('body')[0])

class FloatCmp:
	def __init__(self, x):
		self.x = x
	def __eq__(self, oth):
		return abs(self.x - oth.x) < 1e-4
	def __str__(self):
		return str(self.x)
	def __repr__(self):
		return f'FloatCmp({repr(self.x)}%)'

def fix_style_value(style_value):
	pattern = r'repeat\((\d*), ([\d.]*)%\)'
	match = re.match(pattern, style_value)
	if match:
		return 'repeat', int(match.group(1)), FloatCmp(float(match.group(2)))
	return style_value

def fix_style(style_str):
	d = {k.strip(): fix_style_value(v.strip()) for k, v in [x.split(':') for x in style_str.split(';') if x.strip()]}
	return d

def diff_HTML(output, expected_output, HTML_len_limit, children_list_len_limit):
	expected_output_soup = bs4.BeautifulSoup(expected_output, 'html.parser')
	output_soup = bs4.BeautifulSoup(output, 'html.parser')
	errors = []
	def extract_attrs_in_canonical_form(element):
		attrs = dict(element.attrs)
		if 'class' in attrs:
			attrs['class'] = sorted(attrs['class'])
		if 'style' in attrs:
			attrs['style'] = fix_style(attrs['style'])

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
			print(RED + f'Unknown element type: {type(subelement)}' + RESET_COLOURS, file=sys.stderr)
			assert False

		return [px for px in (process(x) for x in element.contents) if px is not None]

	def format(element):
		ret = repr(element)
		if len(ret) > HTML_len_limit:
			ret = ret[:HTML_len_limit] + '...'
		return ret.replace('\n', r'\n')

	def format_list(element_list):
		list_len = len(element_list)
		return f'{list_len} element{"" if list_len == 1 else "s"}: ' + ", ".join((format(x) for x in element_list[:children_list_len_limit])) + (", ..." if list_len > children_list_len_limit else "")

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

def clean_soup(soup_obj):
	for tag in soup_obj.find_all(True):
		if tag.string:
			tag.string = tag.string.strip()
		
		for child in tag.contents:
			if isinstance(child, bs4.element.Comment):
				child.replace_with('')
			elif isinstance(child, str):
				child.replace_with(child.strip())

def get_expected_output_file_suffix(path):
	split_path = path.split('/')
	if not split_path[-2].endswith('-out') or not split_path[0] == 'integration-tests':
		raise ValueError(f'Invalid output path: {path}');
	split_path[-2] = split_path[-2].removesuffix('-out')
	return '-expected-' + "-".join(split_path[1:]) + '.html'

def get_test_output_file_suffix(test_name):
	return '-test-' + test_name.replace('/', '-') + '.html'

def expected_output_to_functional_link(path):
	with open(path, 'r') as f:
		body_content = f.read()
	
	b = bs4.BeautifulSoup(body_content, 'html.parser')
	clean_soup(b)

	with tempfile.NamedTemporaryFile(mode='w', suffix=get_expected_output_file_suffix(path), delete=False) as f:
		f.write("<html>")
		f.write(header_content)
		f.write(str(b))
		f.write("</html>")
		output_name = f.name
	return f'{path} processed as {make_file_link(output_name)}', make_file_link(output_name)

def make_expected_outputs_only(inputs, output_dir, possible_outputs):
	test_name = get_test_name(output_dir)
	links = []
	output_strings = []
	if not possible_outputs:
		return False, [f'NO OUTPUTS FOR {test_name} FOUND'], [], RED
	one = len(possible_outputs) == 1
	if not one:
		output_strings.append(f'OUTPUTS for TEST {test_name}:')
	for output in possible_outputs:
		output_str, link = expected_output_to_functional_link(os.path.join(output_dir, output))
		links.append(link)
		if one:
			output_str = f'OUTPUT FOR TEST {test_name}: ' + output_str
		else:
			output_str = '\t' + output_str;
		output_strings.append(output_str)

	return False, output_strings, links, GREEN

def commit_output(test_output_path, store_path, engine_name, throw_if_exists=False):
	test_output_content = get_content_from_path(test_output_path, engine_name)
	with open(store_path, 'x' if throw_if_exists else 'w') as f:
		f.write(strip_body(test_output_content))

def record_output(inputs, output_dir, output_name, engine_name, *, throw_if_exists=False):
	test_name = get_test_name(output_dir)
	test_output_path = run_test_to_new_file(inputs, test_name)
	new_output_file = os.path.join(output_dir, (output_name or 'out') + '.html')
	commit_output(test_output_path, new_output_file, engine_name, throw_if_exists)
	return expected_output_to_functional_link(new_output_file)

def generate_new_outputs(inputs, output_dir, possible_outputs, args):
	output_strings = []
	if possible_outputs:
		output_strings.append(f'Deleting existing output file{"" if len(possible_outputs) == 1 else "s"}: {", ".join(possible_outputs)} in {output_dir}')
	else:
		print(f'Nothing to delete in {output_dir}')
	for x in possible_outputs:
		os.remove(os.path.join(output_dir, x))
	output_str, output_link = record_output(inputs, output_dir, args.output_name, args.engine)
	output_strings.append(f'Recorded new output into: {output_str}')
	return False, output_strings, [output_link], YELLOW

def generate_missing_only(inputs, output_dir, possible_outputs, args):
	if possible_outputs:
		return False, ['Output already exists, skipping'], [], YELLOW
	output_strings = []
	output_str, output_link = record_output(inputs, output_dir, args.output_name, args.engine)
	output_strings.append(f'Recorded new output into: {output_str}')
	return False, output_strings, [output_link], GREEN

def run_tests(inputs, output_dir, possible_outputs, args):
	output_strings = []
	if not possible_outputs:
		if args.dont_create_if_no_output:
			return False, ['No outputs found'], [], RED
		else:
			output_str, output_link = record_output(inputs, output_dir, args.output_name, args.engine)
			output_strings.append(f'No outputs found, rendered {output_str}')
			return False, output_strings, [output_link], YELLOW
	test_name = get_test_name(output_dir)
	test_output_path = make_file_link(run_test_to_new_file(inputs, test_name))
	test_output_content = get_content(test_output_path, args.engine)
	output_strings.append(f'Output: {test_output_path}')
	logs = []
	links = [test_output_path]
	found_match = False
	color = RED
	passed_test = False
	for possible_output in possible_outputs:
		with open(os.path.join(output_dir, possible_output)) as f:
			possible_output_content = f.read()
		diff = diff_HTML(test_output_content, possible_output_content, args.HTML_len_limit, args.children_list_len_limit)
		if diff:
			logs.append([False, diff, possible_output])
		else:
			logs.append([True, None, possible_output])
			found_match = True
			color = GREEN
			passed_test = True
			if not args.verbose:
				break
	if found_match and not args.verbose:
		logs = [logs[-1]]
	for passed, diff, output_file in logs:
		output_str, output_link = expected_output_to_functional_link(os.path.join(output_dir, output_file))
		if passed:
			output_strings.append(f'Matching expected output {output_str}')
		else:
			MISMATCH_LIMIT = args.mismatch_limit
			output_strings.append(f'Mismatched expected output {output_str}\n\t\t' + '\n\t\t'.join((error_line for error_line in diff[:MISMATCH_LIMIT])) + (f'\n\t\t... {len(diff)} total mismatches' if len(diff) > MISMATCH_LIMIT else ''))
			
	if not found_match and args.add_alternate_outputs:
		passed = True
		color = YELLOW
		for num in itertools.count(1):
			filename = (args.output_name or 'out') + ('' if num == 1 else str(num))
			try:
				output_str, output_link = record_output(inputs, output_dir, filename, args.engine_name, throw_if_exists=True)
			except FileExistsError:
				pass
			else:
				output_strings.append(f'No matching output found, stored output as {output_str}')
				break
		
	return (not passed_test), output_strings, links, color

def display_inputs(inputs):
	if len(inputs) == 1:
		return f'INPUT: {inputs[0][1]}'
	return 'INPUTS: {' + ", ".join((f'{version_name}: {file_path}' for version_name, file_path in inputs)) + '}'

def process_test(inputs, output_dir, args):
	test_name = get_test_name(output_dir)
	try:
		os.mkdir(output_dir)
	except FileExistsError:
		pass
	output_files = sorted([x for x in os.listdir(output_dir)])
	possible_outputs = [x for x in output_files if x.endswith('.html')]
	other_files = [x for x in output_files if not x.endswith('.html')]
	output_strings = [f'Processing test {test_name}', display_inputs(inputs)]
	if other_files:
		output_strings.append(ORANGE + f'Warning, extra files in {output_dir}: ' + ", ".join(other_files) + RESET_COLOURS)
	if args.expected_outputs_only:
		is_error, outputs, links_to_open, color_code = make_expected_outputs_only(inputs, output_dir, possible_outputs)
	elif args.generate_missing_only:
		is_error, outputs, links_to_open, color_code = generate_missing_only(inputs, output_dir, possible_outputs, args)
	elif args.add_new_outputs:
		is_error, outputs, links_to_open, color_code = generate_new_outputs(inputs, output_dir, possible_outputs, args)
	else:
		is_error, outputs, links_to_open, color_code = run_tests(inputs, output_dir, possible_outputs, args)
	output_strings.extend(outputs)
	return is_error, (color_code or "") + '\n\t'.join(output_strings) + (RESET_COLOURS if color_code else ""), links_to_open

def get_header_content():
	with open('index.html', 'r') as f:
		content = f.read()
	b = bs4.BeautifulSoup(content, 'html.parser')
	content = str(b.select('head')[0])
	content = content.replace('./resources', 'file:///' + os.path.join(os.getcwd(), 'resources'))
	return content

header_content = get_header_content()

def make_file_link(path):
	return f'file://{os.path.abspath(path)}?theme=disable'

def run_test_to_new_file(inputs, test_name):
	with tempfile.NamedTemporaryFile(suffix=get_test_output_file_suffix(test_name), delete=False) as f:
		output_name = f.name
	subprocess.run(['./generate.sh'] + [filename for version_name, filename in inputs] + ['-o', output_name]) #TODO: capture some errors
	return os.path.abspath(output_name)

def main():
	parser = argparse.ArgumentParser()
	parser.add_argument('files', nargs='*')
	parser.add_argument('--dont-create-if-no-output', '-d', action='store_true')
	parser.add_argument('--add-new-outputs', '-n', action='store_true')
	parser.add_argument('--add-alternate-outputs', '-a', action='store_true')
	parser.add_argument('--output_name', '-o')
	parser.add_argument('--open-all', '-p', action='store_true')
	parser.add_argument('--generate-missing-only', '-g', action='store_true')
	parser.add_argument('--expected-outputs-only', '-e', action='store_true')
	parser.add_argument('--engine', '-E', type=str, default='webkit', help='Possible values: webkit, firefox, chromium, default: webkit')
	parser.add_argument('--verbose', '-v', action='store_true')
	parser.add_argument('--invert', '-i', action='store_true')
	parser.add_argument("-M", "--mismatch-limit", type=int)
	parser.add_argument("-H", "--HTML-len-limit", type=int)
	parser.add_argument("-C", "--children-list-len-limit", type=int)

	args = parser.parse_args()
	
	mismatched_flags = []
	def check_flags(flag_a, flag_b):
		if getattr(args, flag_a) and getattr(args, flag_b):
			mismatched_flags.append((flag_a, flag_b))

	check_flags('add_new_outputs', 'add_alternate_outputs')
	check_flags('add_new_outputs', 'dont_create_if_no_output')
	check_flags('generate_missing_only', 'dont_create_if_no_output')
	check_flags('generate_missing_only', 'add_new_outputs')
	check_flags('generate_missing_only', 'add_alternate_outputs')
	check_flags('expected_outputs_only', 'dont_create_if_no_output')
	check_flags('expected_outputs_only', 'add_alternate_outputs')
	check_flags('expected_outputs_only', 'output_name')
	check_flags('expected_outputs_only', 'add_new_outputs')
	check_flags('expected_outputs_only', 'open_all')
	check_flags('expected_outputs_only', 'generate_missing_only')
	check_flags('add_new_outputs', 'verbose')
	check_flags('generate_missing_only', 'verbose')
	check_flags('expected_outputs_only', 'verbose')
	check_flags('add_new_outputs', 'mismatch_limit')
	check_flags('generate_missing_only', 'mismatch_limit')
	check_flags('expected_outputs_only', 'mismatch_limit')
	check_flags('add_new_outputs', 'HTML_len_limit')
	check_flags('generate_missing_only', 'HTML_len_limit')
	check_flags('expected_outputs_only', 'HTML_len_limit')
	check_flags('add_new_outputs', 'children_list_len_limit')
	check_flags('generate_missing_only', 'children_list_len_limit')
	check_flags('expected_outputs_only', 'children_list_len_limit')
	
	mismatched_with_files = []
	if not args.files and args.invert:
		mismatched_with_files.append('invert')

	if args.mismatch_limit is None:
		args.mismatch_limit = 10
	if args.HTML_len_limit is None:
		args.HTML_len_limit = 100
	if args.children_list_len_limit is None:
		args.children_list_len_limit = 10

	if mismatched_flags or mismatched_with_files:
		for flag1, flag2 in mismatched_flags:
			print(f'Combining --{flag1.replace("_", "-")} with --{flag2.replace("_", "-")} is invalid')
		for flag in mismatched_with_files:
			print(f'Flag --{flag.replace("_", "-")} requires at least one file specified')
		sys.exit(1)

	failed_tests = []
	tests = fetch_test_files()
	test_names = [get_test_name(output) for (input, output) in tests]
	for file in args.files:
		if not any([matches(file, get_test_name(x[1])) for x in tests]):
			print(f'Unknown test {file}')
			sys.exit(1)

	links_to_open = []

	for inputs, output_dir in tests:
		test_name = get_test_name(output_dir)
		if not args.files or (any([matches(matcher, test_name) for matcher in args.files]) != args.invert):
			is_error, message, this_links_to_open = process_test(inputs, output_dir, args)
			print(message)
			if is_error:
				failed_tests.append(test_name)
			if this_links_to_open:
				links_to_open.extend(this_links_to_open)

	if failed_tests:
		failed_tests_names = " ".join(failed_tests)
		print(RED + f'FAILED: {len(failed_tests)} tests: {failed_tests_names}' + RESET_COLOURS)
	
	if args.open_all and links_to_open:
		subprocess.run(['google-chrome'] + links_to_open) #TODO: are links available in all versions?
		

if __name__ == "__main__":
	main()
