function load(url) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, false); //TODO: make asynchronous 

	xhr.onload = function () {
			if (xhr.readyState === xhr.DONE) {
					if (xhr.status === 200) {
							console.log(xhr.response);
							console.log(xhr.responseText);
					}
			}
	};

	xhr.send(null);
	return xhr.responseText;
}
const initial_sequence = [0, 0, 0];
function append_call(state, call) {
	if (state === undefined) {
		return [false, 'call after end of auction'];
	}
	let [contract, doubled, passes] = state;
	if (call === -2) { //redouble
		if (doubled === 1 && passes % 2 === 0) {
			return [true, [contract, 2, 0]]
		}
		return [false, 'invalid redouble']
	}
	else if (call === -1) { //double
		if (doubled === 0 && passes % 2 === 0 && contract >= 1) {
			return [true, [contract, 1, 0]];
		}
		return [false, 'invalid double']
	}
	else if (call === 0) { //pass
		if (passes === (contract == 0 ? 3 : 2)) return [true, undefined];
		return [true, [contract, doubled, passes + 1]];
	}
	else { 
		if (call <= contract) {
			return [false, 'insufficient bid']
		}
		return [true, [call, 0, 0]]
	}
}
function call_to_str(x) {
	if (typeof(x) == 'string') {
		return '{' + x + '}';
	}
	if (typeof(x) == 'number') {
		if (x === -2) return 'rdbl';
		if (x === -1) return 'dbl';
		if (x === 0) return 'pass';
		if (x <= 35) {
			return Math.floor((x + 4) / 5) + ['♣', '♦', '♥', '♠', 'NT'][(x + 4) % 5];
		}
	}
	throw 'invalid call ' + x;
}
class Node {
	constructor(call, possible_states, meaning, current_auction) {
		if (call === undefined) {
			this.current_auction = [];
			this.possible_states = [initial_sequence]
			this.meaning = '';
			this.children = [];
			this.otherClasses = new Set();
			return;
		}
		let new_auction = current_auction.slice()
		new_auction.push(call)
		let new_states = [];
		let low = typeof(call) == 'number' ? call : -2;
		let high = typeof(call) == 'number' ? call : 35;
		let errors = new Set();
		for (let state of possible_states) {
			for (var tried = low; tried <= high; ++tried) {
				let [is, next] = append_call(state, tried);
				if (is) {
					let was = false;
					for (let c in new_states) {
						if (c == next)
							was = true;
					}
					if (!was)
						new_states.push(next);
				}
				else errors.add(next);
			}
		}
		if (new_states.size == 0) {
			if (errors.size == 1) {
				let [error] = errors;
				throw error + ': ' + call_to_str(call);
			}
			else {
				throw 'invalid call: ' + call_to_str(call);
			}
		}
		this.current_auction = new_auction;
		this.possible_states = new_states;
		this.meaning = meaning;
		this.children = [];
		this.otherClasses = new Set();
	}
	append_call_to_node(call, meaning, throw_if_exists) {
		let current_node = this.getChild(call);
		if (current_node !== undefined) {
			if (throw_if_exists || (meaning && current_node.meaning)) {
				throw 'Redefined sequence ' + current_node.current_auction;
			}
			else {
				return current_node;
			}
		}
		let ret = new Node(call, this.possible_states, meaning, this.current_auction);
		this.children.push([call, ret]);
		return ret;
	}
	getChild(call) {
		for (let [subcall, subnode] of this.children) {
			if (call === subcall) return subnode;
		}
		return undefined;
	}
}
function parse_call(x) {
	x = x.toLowerCase();
	if ('pass'.startsWith(x)) {
		return 0;
	}
	if (['db', 'dbl', 'ktr', 'x'].includes(x)) {
		return -1;
	}
	if (['rdb', 'rdbl', 'rktr', 'xx', 're'].includes(x)) {
		return -2;
	}
	if (x[0] == '{' && x.slice(-1) == '}') {
		return x.slice(1, -1);
	}
	if (x[0] >= '1' && x[0] <= '7') {
		let rank = parseInt(x[0]);
		let suit = undefined;
		let suit_str = x.slice(1);
		if (['c', '♣'].includes(suit_str)) suit = 0;
		if (['d', '♦'].includes(suit_str)) suit = 1;
		if (['h', '♥'].includes(suit_str)) suit = 2;
		if (['s', '♠'].includes(suit_str)) suit = 3;
		if (['n', 'nt', 'ba'].includes(suit_str)) suit = 4;
		if (suit !== undefined) return rank * 5 + suit - 4;
	}
	return undefined;
}
function parse_function(content, invalid_str, is_definition) {
	content = content.trim();
	let openings = [...content.matchAll('\\(', 'g')]
	let closings = [...content.matchAll('\\)', 'g')]
	if (openings.length != 1 || closings.length != 1) throw invalid_str;
	let opening_id = openings[0].index;
	let closing_id = closings[0].index;
	if (opening_id > closing_id) throw invalid_str;
	let name = content.slice(0, opening_id).trim();
	let R = /^[a-zA-Z0-9_]*$/;
	if (!name.match(R)) throw invalid_str;
	let args = content.slice(opening_id + 1, closing_id).trim();
	let rest = content.slice(closing_id + 1).trim();
	if (rest) throw invalid_str;
	args = args ? args.split(',') : [];
	for (let i = 0; i < args.length; ++i)
		args[i] = args[i].trim();
	if (is_definition) for (let a of args) if (!a.match(R)) throw invalid_str;
	return [name, args];
}
function parse_line(content, line_id) {
	content = content.trim();
	let call = undefined, meaning = undefined, ours = true;
	if (content[0] == '(') {
		ours = false;
		let i = content.indexOf(')');
		if (i == -1) throw 'Missing \')\' on line ' + line_id;
		let call_content = content.slice(1, i);
		if (call_content[0] == '{' && call_content[call_content.length - 1] == '}')
			call = call_content.slice(1, -1);
		else
			call = parse_call(call_content);
		meaning = content.slice(i + 1);
	}
	else {
		if (content[0] == '{') {
			i = content.indexOf('}');
			if (i == -1) throw 'Missing \'}\' on line ' + line_id;
			call = content.slice(1, i);
			meaning = content.slice(i + 1);
		}
		else {
			space = content.indexOf(' ');
			if (space == -1)
				space = content.length;
			call = parse_call(content.slice(0, space));
			meaning = content.slice(space);
		}
		if (call === undefined) {
			throw 'Invalid call ' + content + ' on line ' + line_id;
		}
	}
	return [call, ours, meaning.trim()];
}
function parse_file(file) {
	let lines = file.split('\n');
	let current_function = undefined
	let functions = {}
	let nodes_stack = [new Node()]
	function process_line(content, line_id, offset = 0) {
		content = content.split('#')[0]
		if (!content.trim()) return;
		if (current_function) {
			if (content.trim() === 'end') {
				let name = current_function['name'];
				if (name in functions) {
					throw 'Redefinition of function ' + name + ' on line '+  line_id;
				}
				functions[name] = current_function;
				current_function = undefined;
				return;
			}
			if (content[0] != '\t') throw 'Missing indentation in function definition on line ' + line_id;
			current_function['body'].push([line_id, content.slice(1)])
			return;
		}
		if (content.startsWith('function')) {
			let invalid_str = 'Invalid function declaration syntax on line ' + line_id;
			let [name, args] = parse_function(content.slice('function'.length), invalid_str, true);
			current_function = {name : name, body : [], args : args};
			return;
		}
		let indent = 0;
		while (indent < content.length && content[indent] === '\t') {
			indent++;
		}
		content = content.trim();
		indent += offset;
		if (content[0] == ':') {
			let invalid_str = 'Invalid function call syntax on line ' + line_id;
			let [name, args] = parse_function(content.slice(1), invalid_str, false);
			if (name in functions) {
				let body = functions[name]['body'];
				let fun_args = functions[name]['args'];
				if (args.length != fun_args.length) {
					throw 'Wrong number of parameters in function call on line ' + line_id + ' Expected ' + fun_args.length + ', found ' + args.length;
				}
				for (let [num, code] of body) {
					for (let i = 0; i < args.length; ++i) {
						code = code.replaceAll('$(' + fun_args[i] + ')', args[i]);
					}
					process_line(code, line_id + ', ' + num, indent);
				}
			}
			else {
				throw 'Unknown function: ' + name + ' on line ' + line_id; 
			}
			return;
		}
		if (indent > nodes_stack.length) {
			throw 'Unexpected indentation on line ' + line_id;
		}
		nodes_stack = nodes_stack.slice(0, indent + 1);
		[call, ours, meaning] = parse_line(content, line_id);
		let current_node = nodes_stack[indent];
		if (ours && current_node.current_auction.length % 2)
			current_node = current_node.append_call_to_node(0, '', false);
		current_node = current_node.append_call_to_node(call, meaning, call !== 0);
		nodes_stack.push(current_node);
	}
	for (let line_id = 0; line_id < lines.length; ++line_id) {
		process_line(lines[line_id], line_id + 1);
	}
	return nodes_stack[0];
}
function bidding_to_title(bidding) { //TODO
	return '';
}
function wrap_if(call, our) {
	if (our) return call;
	return '(' + call + ')';
}
function format_str(s) {
	s = s.replaceAll('♣', '<cl></cl>');
	s = s.replaceAll('!c', '<cl></cl>');
	s = s.replaceAll('♦', '<di></di>');
	s = s.replaceAll('!d', '<di></di>');
	s = s.replaceAll('♥', '<he></he>');
	s = s.replaceAll('!h', '<he></he>');
	s = s.replaceAll('♠', '<sp></sp>');
	s = s.replaceAll('!s', '<sp></sp>');
	return s;
}
function display(node) {
	let content = document.querySelector('#bidding')
	let topmenu = document.querySelector('#topmenulist')
	function dfs(node, depth) {
		let skip = node.current_auction.length == 0 ||
			(node.current_auction[node.current_auction.length - 1] === 0 && node.current_auction.length % 2 == 0 && node.meaning.trim() === '');
		if (!skip) {
			let a = document.createElement('div');
			a.classList.add('bidding');
			a.setAttribute('level', depth);
			a.classList.add('level' + String(depth).padStart(2, '0'));
			a.innerHTML = format_str(wrap_if(call_to_str(node.current_auction[node.current_auction.length - 1]), node.current_auction.length % 2) + ': ' + node.meaning);
			if (depth) {
				a.setAttribute('style', "display: none;");
			}
			if (node.children.length) {
				a.classList.add('relay');
			}
			for (let otherClass of node.otherClasses) {
				a.classList.add(otherClass);
			}
			// if (depth == 0) {
			//TODO: toplist menu
			// }
			a.setAttribute('title', bidding_to_title(node.current_auction));
			content.appendChild(a);
		}
		for (let [call, subnode] of node.children) {
			// console.log(call, typeof(call), call_to_str(call), subnode);
			dfs(subnode, depth + !skip);
		}
	}
	dfs(node, 0);
}
function compare(starting_nodes) {
	ret = new Node();
	function dfs(input_nodes, output_node) {
		let meanings = [];
		for (let [name, node] of input_nodes) {
			meanings.push(node === undefined ? '' : format_str(node.meaning.trim()));
		}
		let equal = true;
		for (let meaning of meanings) if (meaning != meanings[0]) equal = false;
		let meaning = '';
		let any_diff = false;
		if (equal) {
			meaning = meanings[0];
		}
		else {
			any_diff = true;
			let first = true;
			for (let i = 0; i < input_nodes.length; ++i) {
				if (input_nodes[i][1] !== undefined) {
					if (!first) {
						meaning += '<br>';
					}
					first = false;
					meaning += input_nodes[i][0] + ': ' + meanings[i];
				}
			}
			output_node.otherClasses.add('diff');
		}
		output_node.meaning = meaning;
		let valid_calls = new Set();
		for (let [_, node] of input_nodes) {
			if (node !== undefined) {
				for (let [call, subnode] of node.children) valid_calls.add(call);
			}
		}
		for (let valid_call of valid_calls) {
			let next_run = [];
			for (let sub of input_nodes) next_run.push(sub.slice());
			for (let i = 0; i < next_run.length; ++i) {
				if (next_run[i][1] !== undefined)
					next_run[i][1] = next_run[i][1].getChild(valid_call);
			}
			let new_output = output_node.append_call_to_node(valid_call, '', false);
			let sub_diff = dfs(next_run, new_output);
			if (sub_diff) any_diff = true;
		}
		if (any_diff) output_node.otherClasses.add('subtreediff');
		return any_diff;
	}
	dfs(starting_nodes, ret);
	return ret;
}
window.onload = function() {
	let domain = window.location.hostname, params = new URLSearchParams(window.location.search), path = window.location.pathname, protocol = window.location.protocol;
	if (protocol === 'file:') {
		var repo = 'SSO_MAX_CC';
		var owner = 'kezsulap';
	}
	else {
		var repo = path.split('/')[1];
		var owner = domain.split('.')[0];
	}
	let keys = [...params.keys()];
	let params_list = [];
	for (let k of keys) {
		params_list.push([k, params.get(k)]);
	}
	if (params_list.length) {
		let nodes = [];
		for (let [name, url] of params_list) {
			let [a, b] = url.split(':');
			version = a ? a : 'main';
			file = b ? b : 'description.txt';
			nodes.push([name, parse_file(load('https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + version + '/' + file))]);
		}
		display(compare(nodes));
	}
	else {
		display(parse_file(load('https://raw.githubusercontent.com/' + owner + '/' + repo + '/main/description.txt')));
	}
	// old_content = load('https://raw.githubusercontent.com/kezsulap/SSO_MAX_CC/main/description.txt')
	// new_content = load('https://raw.githubusercontent.com/kezsulap/SSO_MAX_CC/fix-4c-responses/description.txt')
	// old_node = parse_file(old_content)
	// new_node = parse_file(new_content)
	// cmp_node = compare([['OLD', old_node], ['NEW', new_node]])
	// test1 = load('https://raw.githubusercontent.com/kezsulap/SSO_MAX_CC/test-descriptions/test1.txt');
	// test2 = load('https://raw.githubusercontent.com/kezsulap/SSO_MAX_CC/test-descriptions/test2.txt');
	// node1 = parse_file(test1)
	// node2 = parse_file(test2)
	// cmp_node = compare([['OLD', node1], ['NEW', node2]])
	// display(cmp_node)
}
