import sys
top = (
'<!DOCTYPE html>\n'
'<!-- saved from url=(0042)https://mimuw.edu.pl/~km371194/System.html -->\n'
'<html lang="pl"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\n'
'	\n'
'	<title>System MAX by Lech Ohrysko</title>\n'
'	<meta name="description" content="">\n'
'	<link rel="stylesheet" href="https://kezsulap.github.io/SSO_MAX_CC/bridge-bidding-styl-new.css">\n'
'	<script src="https://kezsulap.github.io/SSO_MAX_CC/jquery.min.js"></script>\n'
'	<script src="https://kezsulap.github.io/SSO_MAX_CC/jquery-bridge-bidding-new.js"></script>\n'
'	<script src="https://kezsulap.github.io/SSO_MAX_CC/jquery-balloon.js"></script>\n'
'</head>\n'
'<body>\n'
'<div id="content">\n'
'<!-- początek strony -->\n'
'\n'
'\n'
'<div class="bidding level00" level="0">System MAX by Lech Ohrysko</div>\n'
'<div id="topmenu">\n'
'<ul class="topmenu">\n'
'<li><a href="#pa" class="topmenu">pass</a></li>\n'
'<li><a href="#1c" class="topmenu">1♣</a></li>\n'
'<li><a href="#1d" class="topmenu">1♦</a></li>\n'
'<li><a href="#1h" class="topmenu">1♥</a></li>\n'
'<li><a href="#1s" class="topmenu">1♠</a></li>\n'
'<li><a href="#1n" class="topmenu">1N</a></li>\n'
'<li><a href="#2c" class="topmenu">2♣</a></li>\n'
'<li><a href="#2d" class="topmenu">2♦</a></li>\n'
'<li><a href="#2h" class="topmenu">2♥</a></li>\n'
'<li><a href="#2s" class="topmenu">2♠</a></li>\n'
'<li><a href="#2n" class="topmenu">2N</a></li>\n'
'<li><a href="#3c" class="topmenu">3♣</a></li>\n'
'<li><a href="#3d" class="topmenu">3♦</a></li>\n'
'<li><a href="#3h" class="topmenu">3♥</a></li>\n'
'<li><a href="#3s" class="topmenu">3♠</a></li>\n'
'<li><a href="#3n" class="topmenu">3N</a></li>\n'
'<li><a href="#ls" class="topmenu" title="Licytacja szlemowa">LS</a></li>\n'
'<li><a href="#lr" class="topmenu" title="Licytacja relayowa po interwencji">LR</a></li>\n'
'<li><a href="#" class="topmenu rozwin" title="Rozwiń wszystko">R</a></li>\n'
'<li><a href="javascript:history.back()" class="topmenu" title="Powrót do poprzedniej&lt;br&gt;&lt;/a&gt;strony">←</a></li>\n'
'<div style="clear: both;"></div>\n'
'</div>\n'
'<div id="bidding">\n'
)

bottom = (
'</div><!-- koniec #bidding -->\n'
'<!-- koniec strony -->\n'
'</div><!-- /content -->\n'
'\n'
'\n'
'<div style="min-width: 20px; padding: 5px; border-radius: 6px; border: 1px solid rgb(119, 119, 119); box-shadow: rgb(85, 85, 85) 4px 4px 4px; color: rgb(102, 102, 102); background-color: rgb(239, 239, 239); z-index: 32767; text-align: left; visibility: visible; position: absolute; top: 171px; left: 65.9219px; display: none;">Open 1♦<div style="position: absolute; height: 0px; width: 0px; border-width: 7px 0px 7px 12px; border-style: solid; border-color: transparent transparent transparent rgb(119, 119, 119); border-image: initial; left: 79.0781px; top: 10.5px;"></div><div style="position: absolute; height: 0px; width: 0px; border-width: 6px 0px 6px 10px; border-style: solid; border-color: transparent transparent transparent rgb(239, 239, 239); border-image: initial; left: 79.0781px; top: 11.5px;"></div></div><div style="min-width: 20px; padding: 5px; border-radius: 6px; border: 1px solid rgb(119, 119, 119); box-shadow: rgb(85, 85, 85) 4px 4px 4px; color: rgb(102, 102, 102); background-color: rgb(239, 239, 239); z-index: 32767; text-align: left; visibility: visible; position: absolute; top: 204px; left: 376.75px; display: none;">Open 1♥<div style="position: absolute; height: 0px; width: 0px; border-width: 7px 0px 7px 12px; border-style: solid; border-color: transparent transparent transparent rgb(119, 119, 119); border-image: initial; left: 80.75px; top: 10.5px;"></div><div style="position: absolute; height: 0px; width: 0px; border-width: 6px 0px 6px 10px; border-style: solid; border-color: transparent transparent transparent rgb(239, 239, 239); border-image: initial; left: 80.75px; top: 11.5px;"></div></div><div style="min-width: 20px; padding: 5px; border-radius: 6px; border: 1px solid rgb(119, 119, 119); box-shadow: rgb(85, 85, 85) 4px 4px 4px; color: rgb(102, 102, 102); background-color: rgb(239, 239, 239); z-index: 32767; text-align: left; visibility: visible; position: absolute; top: 138px; left: 63px; display: none;">Open 1♣<div style="position: absolute; height: 0px; width: 0px; border-width: 7px 0px 7px 12px; border-style: solid; border-color: transparent transparent transparent rgb(119, 119, 119); border-image: initial; left: 82px; top: 10.5px;"></div><div style="position: absolute; height: 0px; width: 0px; border-width: 6px 0px 6px 10px; border-style: solid; border-color: transparent transparent transparent rgb(239, 239, 239); border-image: initial; left: 82px; top: 11.5px;"></div></div><div style="min-width: 20px; padding: 5px; border-radius: 6px; border: 1px solid rgb(119, 119, 119); box-shadow: rgb(85, 85, 85) 4px 4px 4px; color: rgb(102, 102, 102); background-color: rgb(239, 239, 239); z-index: 32767; text-align: left; visibility: visible; position: absolute; top: 533px; left: 64.25px; display: none;">Open 3♥<div style="position: absolute; height: 0px; width: 0px; border-width: 7px 0px 7px 12px; border-style: solid; border-color: transparent transparent transparent rgb(119, 119, 119); border-image: initial; left: 80.75px; top: 10.5px;"></div><div style="position: absolute; height: 0px; width: 0px; border-width: 6px 0px 6px 10px; border-style: solid; border-color: transparent transparent transparent rgb(239, 239, 239); border-image: initial; left: 80.75px; top: 11.5px;"></div></div></body></html>\n'
)
class Call:
	def __init__(self, content):
		invalid = Exception(f'Invalid call {content}')
		self.opp = False
		if content[0] == '(':
			if content[-1] != ')':
				raise invalid
			self.opp = True
			content = content[1:-1]
		if content[0] == '!':
			self.str = content[1:]
			self.val = None
		else:
			if 'pass'.startswith(content.lower()) and content:
				self.str = self.val = 'pass'
				self.divid = 'pa'
			elif content.lower() in ('db', 'dbl', 'ktr', 'x'):
				self.str = self.val = 'dbl'
				self.divid = 'db'
			elif content.lower() in ('rdb', 'rdbl', 'rktr', 'xx', 're'):
				self.str = self.val = 'rdbl'
				self.divid = 're'
			else:
				try:
					rank = int(content[0])
				except ValueError:
					raise invalid
				if rank <= 0 or rank > 7:
					raise invalid
				suit_str = content[1:].lower()
				if suit_str in ('c', '♣'):
					suit_str = '♣'
					suit_ord = 0
				elif suit_str in ('d', '♦'):
					suit_str = '♦'
					suit_ord = 1
				elif suit_str in ('h', '♥'):
					suit_str = '♥'
					suit_ord = 2
				elif suit_str in ('s', '♠'):
					suit_str = '♠'
					suit_ord = 3
				elif suit_str in ('n', 'nt', 'ba'):
					suit_str = 'NT'
					suit_ord = 4
				else:
					raise invalid
				self.str = str(rank) + suit_str
				self.val = 5 * rank + suit_ord
				self.divid = str(rank) + 'cdhsn'[suit_ord] 
	def __repr__(self):
		return '(' + self.str + ')' if self.opp else self.str
	def __eq__(self, other):
		return self.__class__ == other.__class__ and self.__dict__ == other.__dict__
	def __hash__(self):
		return (self.opp, self.val, self.str, self.divid).__hash__()

class Auction:
	def __init__(self, bids, **kwargs):
		rest = ", " + str(kwargs) if kwargs else ""
		content = []
		for raw_bid in bids:
			bid = Call(raw_bid)
			if bid.opp:
				if len(content) % 2 == 0:
					raise Exception(f'Sequence {bids} missing our bid{rest}')
				content.append(bid)
			else:
				if len(content) % 2:
					content.append(Call('(pass)'))
				content.append(bid)
		self.content = tuple(content)
		contract = -1
		passes = 0
		doubled = False
		redoubled = False
		whose = 0
		for i, bid in enumerate(content):
			we = i % 2
			if isinstance(bid.val, int):
				passes = 0
				if bid.val <= contract:
					raise Exception(f'Insufficient bid {content}{rest}')
				doubled = redoubled = False
				contract = bid.val
				whose = we
			elif bid.val == 'pass':
				passes += 1
			elif bid.val == 'dbl':
				passes = 0
				if doubled or whose == we or contract == -1:
					raise Exception(f'Invalid double {content}{rest}')
				doubled = True
			elif bid.val == 'rdbl':
				passes = 0
				if not doubled or redoubled or we != whose:
					raise Exception(f'Invalid redouble {content}{rest}')
				redoubled = True
			elif bid.val is None:
				break #TODO: some checks
			else:
				raiseException(f'Invalid bid {bid} {content}')
			if passes == (4 if contract == -1 else 3) and i + 1 != len(content):
				raise Exception(f'Calls after bidding ended {content}{rest}')

	def __repr__(self):
		return self.content.__repr__()
	
	def __eq__(self, other):
		return self.__class__ == other.__class__ and self.content == other.content

	def __hash__(self):
		return self.content.__hash__()
	
	def title(self):
		out = []
		for (i, bid) in enumerate(self.content):
			if i % 4 == 0 and i:
				out.append('<br>')
			if bid.val != 'pass' or not bid.opp or i + 1 == len(self.content):
				if i % 4:
					out.append('-')
				out.append(str(bid))
		ret=''.join(out)
		if len(self.content) == 1:
			ret = 'Open ' + ret
		return ret
	
class Div:
	def __init__(self, sequence, description):
		self.relay = False
		auction = Auction(sequence)
		self.title = auction.title()
		self.description = description
		self.level = len(sequence) - 1
		self.divid = f'id="{auction.content[0].divid}"' if self.level == 0 else ""
		self.last_bid = auction.content[-1]
	def __str__(self):
		display = " style=\"display: none;\"" if self.level >= 1 else ""
		return f'<div class="bidding level{self.level:02d}{" relay" if self.relay else ""}" level="{self.level}" title="{self.title}"{display}{self.divid}>{self.last_bid}: {self.description}</div>'
	
	
def main():
	current_sequence = []
	line_id = 0
	seen_sequences = {}
	divs = []
	functions = {} #tuple (name, vars, body, line)
	current_function = None
	call_stack = []
	def process_line(line, line_id, vars = {}, offset = 0):
		nonlocal current_sequence
		nonlocal seen_sequences
		nonlocal divs
		nonlocal current_function
		nonlocal functions
		nonlocal call_stack
		if current_function is not None:
			if line.strip() == 'end':
				name = current_function[0]
				if name in functions:
					raise Exception(f'Function {name} redefined on line {current_function[3]}, previously defined on line {functions[name][3]}')
				functions[current_function[0]] = current_function
				current_function = None
				return
			else:
				if line.strip():
					if line[0] != '\t':
						raise Exception(f'Missing indentation in function definition on line {line_id}')
					current_function[2].append(line[1:])
			return
		if line.startswith('function '):
			invalid_declaration = Exception(f'Invalid function declaration syntax on line {line_id}')
			f, rest = line.split(' ', 1)
			name, *rest = rest.split('(');
			if len(rest) != 1:
				raise invalid_declaration
			rest = '(' + rest[0]
			rest = rest.strip()
			if rest[0] != '(' or rest[-1] != ')':
				raise invalid_declaration
			args = rest[1:-1].split(',')
			args = [v.strip() for v in args]
			if args == ['']:
				args = []
			for i, x in enumerate(args):
				if x in args[:i]:
					raise Exception(f'Variable named {x} passed twice to {name} on line {line_id}')
			name = name.strip()
			current_function = (name, args, [], line_id)
			return
		if not line or line.isspace() or line[0] == '#':
			return
		indent = 0
		while indent < len(line) and line[indent] == '\t':
			indent += 1
		if indent > len(current_sequence):
			raise Exception(f'Line: {line_id} Error: too large indentation')
		line = line[indent:]
		indent += offset
		if line[0] == ':':
			invalid_call = Exception(f'Line: {line_id} invalid function call syntax')
			name, *rest = line[1:].split('(')
			if len(rest) != 1:
				raise invalid_call
			args, *rest = rest[0].split(')')
			if len(rest) != 1 or rest[0].strip():
				raise invalid_call
			parameters = args.split(', ')
			name = name.strip()
			if name not in functions:
				raise Exception(f'Unknown function {name} at {line_id}')
			[name, parameters, body, function_line] = functions[name]
			if name in call_stack:
				raise Exception(f'Recursive function call at {line_id}')
			args = args.split(',') if args.strip() else []
			if len(args) != len(parameters):
				raise Exception(f'Wrong number of parameters for {name} at {line_id}, expected {len(parameters)}, got {len(args)}')
			new_vars = vars.copy()
			for var, repl in zip(parameters, args):
				new_vars[var] = repl
			call_stack.append(name)
			for i, content in enumerate(body):
				for key, value in new_vars.items():
					content = content.replace('$(' + key + ')', value)
				process_line(content, (line_id if isinstance(line_id, list) else [line_id]) + [i + function_line + 1], new_vars, indent)
			call_stack.pop()
			return
		current_sequence = current_sequence[:indent]
		if current_sequence:
			seen_sequences[Auction(current_sequence)][1].relay = True
		bid, *meaning = line.split(' ')
		current_sequence.append(bid.strip())
		current_auction = Auction(current_sequence, line=line_id)
		if current_auction in seen_sequences:
			raise Exception(f'Line: {line_id} Error: sequence {current_auction} defined twice (previously on line {seen_sequences[current_auction][0]})')
		div = Div(current_sequence, ' '.join(meaning))
		seen_sequences[current_auction] = [line_id, div]
		divs.append(div)
	try:
		while True:
			line = input()
			line_id += 1;
			process_line(line, line_id)
	except EOFError:
		pass
	if current_function is not None:
		raise Exception(f'Function started at line {current_function[3]} not ended')
	print(top)
	for d in divs:
		print(d)
	print(bottom)

if __name__ == '__main__':
	main()
