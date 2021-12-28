import sys
def main():
	script, *files = sys.argv
	if not files:
		print(f'Usage: {script} file [files]', file=sys.stderr)
		sys.exit(1)
	content = [];
	for filename in files:
		with open(filename, 'r') as f:
			c = f.read();
		c = c.replace('\\', '\\\\');
		c = c.replace('\r', '\\r');
		c = c.replace('\n', '\\n');
		c = c.replace('\'', '\\\'');
		content.append('\'' + c + '\'');
	output = '[' + ','.join(content) + ']'
	with open('index.html') as index:
		c = index.read();
		c = c.replace('hardcoded=undefined', 'hardcoded=' + output);
		print(c)
	
if __name__ == '__main__':
	main()
