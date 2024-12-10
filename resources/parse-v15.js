const PASS = 0, DOUBLE = -1, REDOUBLE = -2;
const CALL = 0, CUSTOM_CALL = 1, COMMENT = 2;
const OURS = 0, THEIRS = 1;
const HIGHEST_CONTRACT = 35;
const NORMAL_MODE = 0, IF_MODE = 1, FORCE_MODE = 2, IF_MODE_WITH_REDEFINED = 3;
class ParsingError extends Error {
  constructor(message, title = undefined) {
    super(message);
    this.name = "ParsingError";
		this.title = title;
  }
};
class FileNotFound extends Error {
	constructor(url) {
		super("File " + url + " not found");
		this.name = "FileNotFound";
	}
};
class Call {
	constructor(type, value, whose) {
		this.type = type;
		this.value = value;
		this.whose = whose;
	}
	equal(oth) {
		return oth.type === this.type && oth.value === this.value && oth.whose === this.whose;
	}
	to_key() {
		if (this.type === COMMENT) return '@' + this.value
		return wrap_if(this.type == CALL ? call_to_str(this.value) : '{' + this.value + '}', this.whose == OURS)
	}
};
class states_set {
	constructor(full=false, initial=true) {
		this.over = full;
		this.in_progress = new Array(HIGHEST_CONTRACT + 1);
		for (let i = 0; i <= HIGHEST_CONTRACT; ++i) {
			this.in_progress[i] = new Array(3);
			for (let j = 0; j < 3; ++j) this.in_progress[i][j] = new Array(i == PASS ? 4 : 3).fill(full);
		}
		this.in_progress[0][0][0] = initial
	}
	append(call) {
		let low = typeof(call) == 'string' ? REDOUBLE : call;
		let high = typeof(call) == 'string' ? HIGHEST_CONTRACT : call;
		let errors = new Set();
		let ret = new states_set(false, false);
		let any = false;
		if (this.over) errors.add('call after end of auction');
		for (let contract = 0; contract <= HIGHEST_CONTRACT; ++contract) {
			for (let doubled = 0; doubled <= 2; ++doubled) {
				for (let passes = 0; passes <= (contract == 0 ? 3 : 2); ++passes) {
					if (this.in_progress[contract][doubled][passes]) {
						let curr_state = [contract, doubled, passes];
						for (let call = low; call <= high; ++call) {
							let would_be = append_call(curr_state, call);
							if (would_be[0]) {
								any = true;
								if (would_be[1] === undefined) ret.over = true;
								else {
									let [contract2, doubled2, passes2] = would_be[1];
									ret.in_progress[contract2][doubled2][passes2] = true;
								}
							}
							else {
								errors.add(would_be[1]);
							}
						}
					}
				}
			}
		}
		if (!any) {
			if (errors.size == 1) {
				let [error] = errors;
				throw new ParsingError(error + ': ' + call_to_str(call));
			}
			else {
				throw new ParsingError('invalid call: ' + call_to_str(call));
			}
		}
		return ret;
	}
};
const initial_sequence = [0, 0, 0];
function append_call(state, call) {
	if (state === undefined)
		return [false, 'call after end of auction'];
	let [contract, doubled, passes] = state;
	if (call === REDOUBLE) {
		if (doubled === 1 && passes % 2 === 0)
			return [true, [contract, 2, 0]]
		return [false, 'invalid redouble']
	}
	else if (call === DOUBLE) {
		if (doubled === 0 && passes % 2 === 0 && contract >= 1)
			return [true, [contract, 1, 0]];
		return [false, 'invalid double']
	}
	else if (call === PASS) {
		if (passes === (contract == 0 ? 3 : 2))
			return [true, undefined];
		return [true, [contract, doubled, passes + 1]];
	}
	else { 
		if (call <= contract)
			return [false, 'insufficient bid']
		return [true, [call, 0, 0]]
	}
}
class UNDEFINED_BIDDING {};
undefined_bidding = new UNDEFINED_BIDDING();
class Bidding {
	constructor(possible_states=new states_set(), bidding_sequence=[]) {
		this.possible_states = possible_states;
		this.bidding_sequence = bidding_sequence;
	}
	append(call) { //Throws ParsingError
		if (call.type == COMMENT) {
			return new Bidding(undefined_bidding, undefined_bidding); 
		}
		if (call.type == CALL || call.type == CUSTOM_CALL) {
			let possible_states = undefined;
			let bidding_sequence = undefined;
			if (this.possible_states === undefined_bidding) { //We had a comment before this call
				possible_states = new states_set(true, true).append(call.value)
				if (call.whose == THEIRS) {
					bidding_sequence = [undefined, call.value];
				}
				else {
					bidding_sequence = [call.value];
				}
			}
			else {
				let appends = [call.value];
				if ((call.whose == OURS && this.bidding_sequence.length % 2 == 1) || (call.whose == THEIRS && this.bidding_sequence.length % 2 == 0))
					appends = [PASS, call.value];
				bidding_sequence = this.bidding_sequence.concat(appends);
				possible_states = this.possible_states;
				if (call.whose == THEIRS && this.bidding_sequence.length == 0) {
					bidding_sequence = [undefined, call.value];
					appends = [call.value];
				}
				for (let c of appends) {
					possible_states = possible_states.append(c);
				}
			}
			return new Bidding(possible_states, bidding_sequence);
		}
		throw Error('Invalid call type ' + call.type);
	}
	to_table() { //TODO: refactor so the string returned from this function is automatically formated, rather than use format_str(to_table()) everywhere
		let competitive = false;
		for (let i = 1; i < this.bidding_sequence.length; i += 2) if (this.bidding_sequence[i] !== 0) competitive = true;
		let ret = '';
		if (this.bidding_sequence.length == 1) return 'Open ' + call_to_str(this.bidding_sequence[0]);
		if (this.bidding_sequence.length == 2 && this.bidding_sequence[0] === undefined) return 'Opp\'s open ' + call_to_str(this.bidding_sequence[1]);
		else {
			ret += '<table><tr>';
			for (let i = 0; i < this.bidding_sequence.length; ++i) {
				if (i && i % 4 == 0) ret += '</tr><tr>';
				let ours = i % 2 == 0;
				if (ours || competitive) {
					ret += '<td class="' + (ours ? "ours" : "theirs") + '">' + call_to_str(this.bidding_sequence[i], false) + "</td>";
				}
			}
			ret += '</tr></table>'
		}
		return ret;
	}
}
function parse_call(call) {
	let x = call.toLowerCase();
	if ('pass'.startsWith(x)) {
		return PASS;
	}
	if (['db', 'dbl', 'ktr', 'x'].includes(x)) {
		return DOUBLE;
	}
	if (['rdb', 'rdbl', 'rktr', 'xx', 're'].includes(x)) {
		return REDOUBLE;
	}
	if (x[0] == '{' && x.slice(-1) == '}') {
		return x.slice(1, -1);
	}
	if (x[0] >= '1' && x[0] <= '7') {
		let rank = parseInt(x[0]);
		let suit = undefined;
		let suit_str = x.slice(1);
		if (['!c', 'c', '♣'].includes(suit_str)) suit = 0;
		if (['!d', 'd', '♦'].includes(suit_str)) suit = 1;
		if (['!h', 'h', '♥'].includes(suit_str)) suit = 2;
		if (['!s', 's', '♠'].includes(suit_str)) suit = 3;
		if (['n', 'nt', 'ba'].includes(suit_str)) suit = 4;
		if (suit !== undefined) return rank * 5 + suit - 4;
	}
	throw new ParsingError('Invalid call: ' + call)
}
function call_to_str(x) {
	if (x === undefined) return '';
	if (typeof(x) == 'string') return x;
	if (typeof(x) == 'number') {
		if (x === -2) return 'rdbl';
		if (x === -1) return 'dbl';
		if (x === 0) return 'pass';
		if (x <= 35) {
			return Math.floor((x + 4) / 5) + ['♣', '♦', '♥', '♠', 'NT'][(x + 4) % 5];
		}
	}
	throw new ParsingError('invalid call ' + x);
}
class Node {
	constructor(call, meaning, current_auction) {
		this.call = call;
		this.meaning = meaning;
		this.current_auction = (current_auction === undefined ? new Bidding() : current_auction);
		this.children = [];
		this.other_classes = new Set();
		this.our_calls = new Set();
		this.their_calls = new Set();
		this.update_innerHTML()
		this.init_classes();
		return;
	}
	init_classes() {
		if (this.call === undefined) return;
		if (this.call.type == COMMENT) this.other_classes.add('comment')
		else if (this.call.whose == OURS) this.other_classes.add('our_call')
		else this.other_classes.add('their_call')
	}
	update_innerHTML() {
		let is_comment = this.call === undefined ? false : this.call.type == COMMENT;
		this.innerHTML = this.call === undefined ? undefined : format_str(
			is_comment ? this.call.value : '<div class="call">' + wrap_if(call_to_str(this.call.value), this.call.whose == OURS) + ':</div> <div class="meaning">' + this.meaning + '</div>'
		);
	}
	already_exists(call) {
		if (call.whose == OURS && call.type != COMMENT) return this.our_calls.has(call.value);
		if (call.whose == THEIRS && call.type != COMMENT) return this.their_calls.has(call.value);
		return false;
	}
	append_child(call, meaning, adding_mode) {
		if (adding_mode == IF_MODE || adding_mode == IF_MODE_WITH_REDEFINED) {
			try {
				var new_auction = this.current_auction.append(call)
			}
			catch (e) {
				if (e instanceof ParsingError) 
					return undefined;
				else
					throw e;
			}
		}
		else
			var new_auction = this.current_auction.append(call)
		if (this.already_exists(call)) { 
			if (adding_mode == NORMAL_MODE) {
				throw new ParsingError('Redefined sequence ' + new_auction.to_table());
			}
			else if (adding_mode == IF_MODE) return undefined;
		}
		if (call.type != COMMENT) {
			if (call.whose == OURS) this.our_calls.add(call.value);
			else this.their_calls.add(call.value);
		}
		this.children.push(new Node(call, meaning, new_auction));
		return this.children[this.children.length - 1];
	}
	get_child(call) {
		for (let child of this.children) if (call.equal(child.call)) return child;
		return undefined;
	}
};
function parse_function(content, exception, is_definition) {
	content = content.trim();
	let openings = [...content.matchAll('\\(', 'g')]
	let closings = [...content.matchAll('\\)', 'g')]
	if (openings.length != 1 || closings.length != 1) throw exception;
	let opening_id = openings[0].index;
	let closing_id = closings[0].index;
	if (opening_id > closing_id) throw exception;
	let name = content.slice(0, opening_id).trim();
	let R = /^[a-zA-Z0-9_]*$/;
	if (!name.match(R)) throw exception;
	let args = content.slice(opening_id + 1, closing_id).trim();
	let rest = content.slice(closing_id + 1).trim();
	if (rest) throw exception;
	args = args ? args.split(',') : [];
	for (let i = 0; i < args.length; ++i)
		args[i] = args[i].trim();
	if (is_definition) for (let a of args) if (!a.match(R)) throw exception;
	return [name, args];
}
function parse_call_line(content) {
	content = content.trim();
	if (content[0] == '@') {
		return [new Call(COMMENT, content.slice(1), undefined), undefined, NORMAL_MODE]
	}
	let mode = NORMAL_MODE;
	if (content.slice(0, 2) == '!?') {
		mode = IF_MODE_WITH_REDEFINED;
		content = content.slice(2);
	}
	else if (content[0] == '!') {
		mode = FORCE_MODE;
		content = content.slice(1);
	}
	else if (content[0] == '?') {
		mode = IF_MODE;
		content = content.slice(1);
	}
	let call = undefined, meaning = undefined, whose = OURS;
	if (content[0] == '(') {
		whose = THEIRS;
		let i = content.indexOf(')');
		if (i == -1) throw new ParsingError("Missing ')'");
		call = content.slice(1, i).trim();
		meaning = content.slice(i + 1);
	}
	else if (content[0] == '{') {
		matching = content.indexOf('}') //{ to make vim get pairings correctly...
		if (matching == -1) throw new ParsingError('Missing }')
		call = content.slice(0, matching + 1)
		meaning = content.slice(matching + 1)
	}
	else {
		space = content.indexOf(' ');
		if (space == -1)
			space = content.length;
		call = content.slice(0, space);
		meaning = content.slice(space);
	}
	call = call.trim();
	if (call[0] == '{' && call[call.length - 1] == '}') {
		call = new Call(CUSTOM_CALL, call.slice(1, -1), whose);
	}
	else {
		call = new Call(CALL, parse_call(call), whose);
	}
	return [call, meaning.trim(), mode];
}
const num_regex = /^-?\d+$/;
const bid_regex = /^[1-7](c|d|h|s|n|nt|!c|!d|!h|!s|ba|♣|♦|♥|♠)$/
function eval_sum(str, args, vals) {
	let operators = [...str.matchAll(/\+|-/g)];
	let operands = str.split(/\+|-/g);
	let N = args.length;
	if (operands.length == 1) {
		let op = operands[0].trim();
		for (let i = 0; i < N; ++i) if (op == args[i]) return vals[i];
		throw new ParsingError('Unknown variable ' + op);
	}
	let val = 0;
	let call = false;
	for (let i = 0; i < operands.length; ++i) {
		let sign = (i == 0 || operators[i - 1] == '+' ? 1 : -1)
		let op = operands[i].trim()
		if (op == '') {
			if (i == 0) continue;
			else throw new ParsingError('Missing operand in ' + str);
		}
		let was_replaced = false;
		for (let j = 0; j < N; ++j) {
			if (op == args[j]) {
				op = vals[j];
				was_replaced = true;
				break;
			}
		}
		if (op.match(num_regex)) {
			val += sign * op;
		}
		else if (i == 0 && op.toLowerCase().match(bid_regex)) {
			call = true;
			val = parse_call(op);
		}
		else {
			if (was_replaced)
				throw new ParsingError('Invalid number in arithmetic operation ' + op);
			else
				throw new ParsingError('Unknown variable ' + op);
		}
	}
	if (call) {
		if (val <= 0) throw new ParsingError('Evaluating ' + str + ' results in bid of less than 1');
		if (val > HIGHEST_CONTRACT) throw new ParsingError('Evaluating ' + str + ' results in bid of more than 7');
		return call_to_str(val);
	}
	return '' + val;
}
class ParsingContext {
	constructor() {
		this.nodes_stack = [new Node()];
		this.functions = {};
		this.current_function = undefined;
		this.indentation_skip_threshold = undefined;
		this.title = undefined;
	}
	end_function(indent, line_id) {
		if (this.current_function === undefined) throw new ParsingError('end outside of function on line ' + line_id);
		if (indent) throw new ParsingError('Unexpected indentation in end of function line ' + line_id);
		let name = this.current_function['name'];
		if (name in this.functions) {
			throw new ParsingError('Redefinition of function ' + name + ' on line '+  line_id, this.title);
		}
		this.functions[name] = this.current_function;
		this.current_function = undefined;
		return;
	}
	add_title(indent, line_id, content) {
		if (indent) throw new ParsingError('Unexpected indentation before title on line ' + line_id);
		this.title = content.trim();
	}
	append_function_content(indent, line_id, content) {
		if (indent == 0) throw new ParsingError('Missing indentation in function definition on line ' + line_id, this.title);
		this.current_function['body'].push([line_id, '\t'.repeat(indent - 1) + content])
	}
	begin_function(indent, line_id, content) {
		let invalid_str = 'Invalid function declaration syntax on line ' + line_id;
		let [name, args] = parse_function(content, new ParsingError(invalid_str), true);
		this.current_function = {name : name, body : [], args : args};
	}
	call_function(indent, line_id, content, process_line_callable, rec_depth) {
		let invalid_str = 'Invalid function call syntax on line ' + line_id;
		let [name, args] = parse_function(content, new ParsingError(invalid_str), false);
		if (name in this.functions) {
			let body = this.functions[name]['body'];
			let fun_args = this.functions[name]['args'];
			if (args.length != fun_args.length) {
				throw new ParsingError('Wrong number of parameters in function call on line ' + line_id + ' Expected ' + fun_args.length + ', found ' + args.length, this.title);
			}
			function process_function_body_line(num, code) {
				let var_regex_with_group = /\$\(([^()]*)\)/g;
				let var_regex_without_group = /\$\([^()]*\)/g;
				let vars = [...code.matchAll(var_regex_with_group)];
				let rest = code.split(var_regex_without_group);
				let new_content = rest[0];
				let allow_errors = new_content.slice(-1) == '?' || new_content.slice(-2) == '!?'
				for (let i = 0; i < vars.length; ++i) {
					try {
						new_content += eval_sum(vars[i][1], fun_args, args);
					}
					catch (e) {
						if (allow_errors && e instanceof ParsingError) return;
						throw e;
					}
					new_content += rest[i + 1];
				}
				process_line_callable(new_content, line_id + ', ' + num, indent, rec_depth + 1);
			}
			for (let [num, code] of body) {
				process_function_body_line(num, code)
			}
		}
		else {
			throw new ParsingError('Unknown function: ' + name + ' on line ' + line_id, this.title); 
		}
	}
	add_subnode(indent, line_id, call, meaning, mode) {
		if (indent >= this.nodes_stack.length) {
			throw new ParsingError('Unexpected indentation on line ' + line_id, this.title);
		}
		this.nodes_stack = this.nodes_stack.slice(0, indent + 1);
		let current_node = this.nodes_stack[indent];
		try {
			current_node = current_node.append_child(call, meaning, mode);
			if (current_node === undefined) {
				this.indentation_skip_threshold = indent;
				return;
			}
		} catch(e) {
			if (e instanceof ParsingError) throw new ParsingError(e.message + ' on line ' + line_id, this.title);
			throw e;
		}
		this.nodes_stack.push(current_node);
	}
	finalize() {
		if (this.current_function !== undefined) throw new ParsingError('Unterminated function ' + this.current_function['name']);
		let ret = this.nodes_stack[0];
		ret.title = this.title;
		return ret;
	}
}
function trim_whitespace_and_comments(raw_content, line_id) {
	let cropped_content = raw_content.split('#')[0]
	let indent = 0;
	while (indent < cropped_content.length && cropped_content[indent] == '\t') indent++;
	if (cropped_content.length > indent) {
		let first_character = cropped_content[indent];
		if (first_character.trim() == '') throw new ParsingError('Line beginning with whitespaces other than tabs on line ' + line_id);
	}
	return [indent, cropped_content.trim()];
}
function parse_file(file) {
	let lines = file.split('\n');
	let parsing_context = new ParsingContext();
	const RECURSION_DEPTH_LIMIT = 1000;
	function process_line(raw_content, line_id, offset = 0, rec_depth = 0) {
		if (rec_depth > RECURSION_DEPTH_LIMIT) {
			throw new ParsingError('Too many function calls at line ' + line_id.split(',').slice(0, 20).join(','));
		}
		let [indent, content] = trim_whitespace_and_comments(raw_content, line_id);
		if (!content) return;
		indent += offset;
		if (parsing_context.indentation_skip_threshold !== undefined && indent > parsing_context.indentation_skip_threshold)
			return;
		else
			parsing_context.indentation_skip_threshold = undefined;
		if (content[0] == '&') {
			parsing_context.add_title(indent, line_id, content.substring(1));
			return;
		}
		if (content === 'end') {
			parsing_context.end_function(indent, line_id);
			return;
		}
		if (parsing_context.current_function) {
			parsing_context.append_function_content(indent, line_id, content);
			return;
		}
		if (content.startsWith('function')) {
			parsing_context.begin_function(indent, line_id, content.slice('function'.length));
			return;
		}
		if (content[0] == ':') {
			parsing_context.call_function(indent, line_id, content.slice(1), process_line, rec_depth)
			return;
		}
		try {
			var [call, meaning, mode] = parse_call_line(content);
		} catch(e) {
			if (e instanceof ParsingError) throw new ParsingError(e.message + ' on line ' + line_id, parsing_context.title);
			throw e;
		}
		parsing_context.add_subnode(indent, line_id, call, meaning, mode);
	}
	for (let line_id = 0; line_id < lines.length; ++line_id) {
		process_line(lines[line_id], line_id + 1);
	}
	return parsing_context.finalize();
}
function load(url) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, false); //TODO: make asynchronous 

	xhr.onload = function () {
			if (xhr.readyState === xhr.DONE) {
					if (xhr.status === 200) {
					}
			}
	};

	xhr.send(null);
	if (xhr.status == 404) throw new FileNotFound(url);
	return xhr.responseText;
}
function set_HTML_title(title) {
	document.title = title ?? 'Convention card ♠♥♦♣';
}
function set_system_title(title, diff_title) {
	if (title === undefined) title = '';
	let title_element = document.querySelector('#page_title');
	title_element.innerHTML = title;
	if (diff_title !== undefined) title_element.classList.add('diff')
	else title_element.classList.remove('diff')
	title_element.classList.add('title');
	title_element.style.display = title ? '' : 'none';
}
function wrap_if(call, our) {
	if (our) return call;
	return '(' + call + ')';
}
const club_string = '<span class="club suit"><span class="suit-label">♣\uFE0E</span><span class="club-image"></span></span>';
const diamond_string = '<span class="diamond suit"><span class="suit-label">♦\uFE0E</span><span class="diamond-image"></span></span>';
const heart_string = '<span class="heart suit"><span class="suit-label">♥\uFE0E</span><span class="heart-image"></span></span>';
const spade_string = '<span class="spade suit"><span class="suit-label">♠\uFE0E</span><span class="spade-image"></span></span>';
function parse_hand(s) {
	let suits = s.trim().split(/\s+/g);
	if (suits.length != 4) throw new ParsingError('Hand containing ' + suits.length + ' suit' + (suits.length == 1 ? '' : 's'));
	let parsed_suits = new Array(4);
	for (let i = 0; i < 4; ++i)
		parsed_suits[i] = [...suits[i].matchAll(/10|./g)].map((x) => x[0])
	let cards = 0;
	for (let i = 0; i < 4; ++i) cards += suits[i] == '-' ? 0 : parsed_suits[i].length;
	if (cards != 13) throw new ParsingError('Hand containing ' + cards + ' card' + (cards == 1 ? '' : 's'));
	all_cards = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
	function find_rank(x) {
		if (x == 'x') return -1;
		for (let i = 0; i < 13; ++i) if (all_cards[i] == x) return 14 - i;
		throw new ParsingError('Unrecognised card: ' + x);
	}
	let HCP = 0;
	let parsed_hand = '';
	for (let suit = 0; suit < 4; ++suit) {
		let suit_str = [spade_string, heart_string, diamond_string, club_string][suit];
		let last = 15;
		let last_spot = 15;
		let xes = 0;
		if (parsed_suits[suit] != '-') {
			for (let card of parsed_suits[suit]) {
				let rank = find_rank(card);
				if (rank == -1) xes++;
				else last_spot = rank;
				if (rank == last && last != -1) throw new ParsingError('Duplicated card ' + suit_str + card);
				if (rank > last) throw new ParsingError('Cards not in decreasing order in ' + suit_str)
				last = rank;
				if (rank >= 11) HCP += (rank - 10);
			}
			let left_xes = Math.min(9, last_spot - 2);
			if (left_xes < xes) throw new ParsingError('More xes than existing spot cards in ' + suits[suit]);
		}
		parsed_hand += '<span class="' + 'shdc'[suit] + '">' + suit_str + suits[suit].replaceAll('10', 'T') + '</span>'
	}
	return '<span class="hand" title="' + HCP + ' HCP">' + parsed_hand + '</span>';
}
function is_suit_length(str){
    return /^\d+$/.test(str) || str == 'x';
}
function calc_min_max_in_shape(s) {
	let curr_depth = 0, min_depth = 0, max_depth = 0;
	for (let x of s) {
		if (x == '(') curr_depth++;
		if (x == ')') curr_depth--;
		min_depth = Math.min(min_depth, curr_depth);
		max_depth = Math.max(max_depth, curr_depth);
	}
	if (curr_depth) throw new ParsingError('Mismatched parentheses in shape: ' + s);
	return [min_depth, max_depth];
}
function extract_groups_from_shape(s) {
	let [min_depth, max_depth] = calc_min_max_in_shape(s);
	let groups = [];
	let curr_depth = 0;
	let group_before = [], curr_group = [];
	let initial_group = (min_depth == -1);
	for (let x of s) {
		if (x == '(') curr_depth++;
		if (x == ')') {
			curr_depth--;
			if (initial_group) {
				group_before = curr_group;
				initial_group = false;
			}
			else {
				groups.push(curr_group);
			}
			curr_group = [];
		}
		if (is_suit_length(x) && curr_depth == max_depth) {
			curr_group.push(x);
		}
	}
	if (min_depth == -1) {
		groups.push(group_before.concat(curr_group));
	}
	return groups;
}
function all_equal(s) {
	for (let x of s) if (x != s[0]) return false;
	return true;
}
function is_sorted(s) {
	for (let i = 0; i + 1 < s.length; ++i) {
		if ((s[i] == 'x' && s[i + 1] != 'x') || (s[i] != 'x' && s[i + 1] != 'x' && s[i] < s[i + 1])) {
			return false;
		}
	}
	return true;
}
function colour_shape(s) {
	let r = '';
	let i = 0;
	let classes = ['s', 'h', 'd', 'c'];
	let curr_depth = 0;
	for (let x of s)
		if (x != ')' && x != '(' && !is_suit_length(x))
			throw new ParsingError('Invalid character in shape: ' + x);
	let [min_depth, max_depth] = calc_min_max_in_shape(s);
	let sum = 0, xes = 0;
	if (max_depth - min_depth >= 2) throw new ParsingError('Nested parentheses in shape: ' + s);
	if (s[0] == ')') throw new ParsingError('Shape beginning with ")": ' + s);
	if (s[s.length - 1] == '(') throw new ParsingError('Shape ending with "(": ' + s);
	curr_depth = 0;
	let groups = extract_groups_from_shape(s);
	for (let group of groups) {
		if (group.length == 0) throw new ParsingError('Empty group in shape: ' + s);
		if (group.length == 1) throw new ParsingError('Group with 1 suit: ' + s);
		if (all_equal(group)) throw new ParsingError('Group containing only suits of the same length ' + group[0] + ': ' + s);
		if (!is_sorted(group)) throw new ParsingError('Group ' + group + ' not sorted: ' + s)
	}
	for (let x of s) {
		if (x == '(') curr_depth++;
		if (x == ')') curr_depth--;
		if (is_suit_length(x)) {
			if (x == 'x') xes++;
			else sum += parseInt(x);
			if (curr_depth == min_depth)
				r += '<span class="' + classes[i] + '">' + x + '</span>';
			else
				r += x;
			i++;
		}
		else
			r += x;
	}
	if (xes == 0 && sum != 13) throw new ParsingError('Shape ' + s + ' containing ' + sum + ' cards');
	if (xes == 1) throw new ParsingError('Shape ' + s + ' containing exactly one x');
	return '<span class="shape">' + r + "</span>";
}
function format_str(s) {
	s = s.replaceAll(/♣|!c/g, club_string);
	s = s.replaceAll(/♦|!d/g, diamond_string);
	s = s.replaceAll(/♥|!h/g, heart_string);
	s = s.replaceAll(/♠|!s/g, spade_string);
	let hand_regex = /%\(([^()]*)\)/g;
	let hands = s.split(hand_regex)
	for (let i = 1; i < hands.length; i += 2) hands[i] = parse_hand(hands[i])
	s = hands.join("");
	s = s.replaceAll(/(\p{Extended_Pictographic}+)/ug, '<span class="emoji">$1</span>')
	let shape_regex = /\!\{([()]*[0-9x][()]*[0-9x][()]*[0-9x][()]*[0-9x][()]*)\}/g
	let shapes = s.split(shape_regex);
	for (let i = 1; i < shapes.length; i += 2) shapes[i] = colour_shape(shapes[i]);
	s = shapes.join("");
	return s;
}
function add_button(name, action, label) {
	let topmenu = document.querySelector('#topmenulist')
	let ret = document.createElement('li');
	ret.id = name
	ret.innerHTML = '<div onclick=' + action.name + '()>' + label + '</div>'
	topmenu.appendChild(ret)
}
function add_theme_switch_node() {
	add_button('theme_switch_button', handle_theme_switch, '☀️');
}
function add_fold_everything_node() {
	add_button('fold_everything_button', fold_everything, '↩\uFE0F')
}
function display(node, HTML_title=true, do_topmenu=true) {
	$.balloon.defaults.classname = "my-balloon";
	$.balloon.defaults.css = {}
	init_theme()
	let content = document.querySelector('#bidding')
	let topmenu = document.querySelector('#topmenulist')
	if (do_topmenu) {
		topmenu.innerHTML = ''
	}
	let no = 0;
	let max_level = 0;
	function dfs(node, depth) {
		if (node.call !== undefined) { //Skip dummy initial node
			let a = document.createElement('div');
			a.classList.add('bidding');
			a.setAttribute('level', depth);
			a.classList.add('level' + String(depth).padStart(2, '0'));
			if (depth > max_level)
				max_level = depth;
			let is_comment = node.call.type == COMMENT;
			a.innerHTML = node.innerHTML 
			if (depth) a.setAttribute('style', "display: none;");
			if (node.children.length) a.classList.add('relay');
			for (let otherClass of node.other_classes) a.classList.add(otherClass);
			if (depth == 0 && !is_comment && do_topmenu) {
				a.setAttribute('id', 'open' + no);
				let topmenu_node = document.createElement('li');
				let link = document.createElement('a');
				topmenu_node.appendChild(link);
				for (let otherClass of node.other_classes) {
					topmenu_node.classList.add(otherClass);
				}
				link.innerHTML = format_str(call_to_str(node.call.value));
				link.setAttribute('href', '#open' + no);
				link.classList.add('topmenu');
				topmenu.appendChild(topmenu_node);
				no++;
			}
			if (!is_comment) {
				$(a).balloon({position: 'left-top', contents: format_str(node.current_auction.to_table())});
			}
			content.appendChild(a);
		}
		for (let subnode of node.children) {
			dfs(subnode, depth + 1);
		}
	}
	dfs(node, -1);
	if (do_topmenu) {
		add_theme_switch_node()
		add_fold_everything_node()
	}
	$(function(){$('#bidding .hand').balloon({position: "top"})})
	if (do_topmenu) {
		set_system_title(node.title, node.diff_title);
	}
	if (HTML_title) {
		set_HTML_title(node.HTML_title ?? node.title);
	}
	$('body').addClass('done')
}
function join_versions(versions) {
	let added = new Map();
	for (let version of versions) {
		let [name, num] = version.split(/([0-9]*)$/g);
		if (!added.has(name)) added.set(name, []);
		added.get(name).push(num === undefined ? undefined : +num)
	}
	let ret = [];
	for (let [name, nums] of added) {

		nums.sort((a,b) => a-b);
		let curr = []
		let prev_beg = undefined, prev_end = undefined;
		let has_undefined = false;
		for (let x of nums) {
			if (x === undefined) {
				has_undefined = true;
				continue;
			}
			if (x - 1 === prev_end) prev_end++;
			else {
				if (prev_beg !== undefined) {
					curr = curr.concat(name + prev_beg + (prev_end !== prev_beg ? '-' + prev_end : ''));
				}
				prev_beg = prev_end = x;
			}
		}
		if (has_undefined) ret.push(name);
		if (prev_beg !== undefined) {
			curr = curr.concat(name + prev_beg + (prev_end !== prev_beg ? '-' + prev_end : ''));
		}
		ret = ret.concat(curr);
	}
	return ret.join(", ")
}
function diff_meanings(contents) { //[[version_name, value], ...]
	let len = contents.length;
	let any_diff = false;
	for (let i = 1; i < len; ++i) if (contents[i][1] != contents[0][1]) any_diff = true;
	if (!any_diff) {return [false, contents[0][1]]}
	let by_content = new Map();
	for (let [version, value] of contents) {
		if (value !== undefined) {
			if (!by_content.has(value)) {
				by_content.set(value, [version])
			}
			else {
				by_content.get(value).push(version);
			}
		}
	}
	let diff_content = ''
	for (let [content, versions] of by_content) {
		diff_content += '<div class="version"><div class="version_id">' + join_versions(versions) + ':</div><div class="version_content">' + content + '</div></div>'
	}
	return [true, diff_content]
}//[any_diff, content]
function compare_by_indices(indices_a, indices_b) {
	let value = 0;
	for (let i = 0; i < indices_a.length; ++i) {
		if (indices_a[i] !== undefined && indices_b[i] !== undefined) {
			if (indices_a[i] < indices_b[i]) value--;
			else if (indices_a[i] > indices_b[i]) value++;
		}
	}
	return value;
}
function compare_by_call(call_a, call_b) {
	if (call_a.type == CALL && call_b.type == CALL) return call_a.value - call_b.value;
	return 0;
}
function compare_by_first_occurrence(indices_a, indices_b) {
	for (let i = 0; i < indices_a.length; ++i) {
		if ((indices_a[i] === undefined) != (indices_b[i] === undefined)) {
			if (indices_a[i] === undefined) return 1;
			return -1;
		}
	}
	return 0;
}
function compare_by_custom_call(call_a, call_b) {
	if (call_a.type == CUSTOM_CALL && call_b.type == CUSTOM_CALL) {
		if (call_a.value < call_b.value) return -1;
		if (call_a.value > call_b.value) return 1;
		return 0;
	}
	return 0;
}
function compare_by_whose(call_a, call_b) {
	if (call_a.whose == OURS && call_b.whose == THEIRS) return -1;
	if (call_a.whose == THEIRS && call_b.whose == OURS) return 1;
	return 0;
}
function call_order_compare(item_a, item_b) {
	let [call_a, indices_a] = item_a;
	let [call_b, indices_b] = item_b;
	//TODO: try various orders of these tests
	let compare_by_indices_value = compare_by_indices(indices_a, indices_b);
	if (compare_by_indices_value != 0) {
		return compare_by_indices_value < 0;
	}
	let compare_by_call_value = compare_by_call(call_a, call_b);
	if (compare_by_call_value != 0) {
		return compare_by_call_value < 0;
	}
	let compare_by_first_occurrence_value = compare_by_first_occurrence(indices_a, indices_a);
	if (compare_by_first_occurrence_value != 0) {
		return compare_by_first_occurrence_value < 0;
	}
	let compare_by_whose_value = compare_by_whose(call_a, call_b);
	if (compare_by_whose_value != 0) {
		return compare_by_whose_value < 0;
	}
	let compare_by_custom_call_value = compare_by_custom_call(call_a, call_b);
	if (compare_by_custom_call_value != 0) {
		return compare_by_custom_call_value < 0;
	}
	return true;
}
function extract_words(s) {
	if (s === undefined) return []
	let words = s.match(/[\p{Letter}\p{Mark}0-9-+♠♥♦♣]+/gu);
	if (words === null) return [];
	return words.map((x) => x.toLowerCase());
}
function calc_str_diff(string1, string2) {
	let words1 = extract_words(string1);
	let words2 = extract_words(string2);
	let occs = new Map();
	for (let word1 of words1) {
		if (!occs.has(word1)) occs.set(word1, [0, 0]);
		occs.get(word1)[0]++;
	}
	for (let word2 of words2) {
		if (!occs.has(word2)) occs.set(word2, [0, 0]);
		occs.get(word2)[0]++;
	}
	let score = 0;
	for (let [word, count] of occs) {
		let [c1, c2] = count;
		score += Math.max(c1, c2) - 2 * Math.min(c1, c2);
	}
	return score;
}
function calc_children_diff(children1, children2) {
	let occs = new Map();
	for (let child1 of children1) {
		let call_1 = child1.call.to_key();
		if (!occs.has(call_1)) occs.set(call_1, [0, 0])
		occs.get(call_1)[0]++;
	}
	for (let child2 of children2) {
		let call_2 = child2.call.to_key();
		if (!occs.has(call_2)) occs.set(call_2, [0, 0])
		occs.get(call_2)[1]++;
	}
	let score = 0;
	for (let [call, count] of occs) {
		let [c1, c2] = count;
		score += (Math.max(c1, c2) - 2 * Math.min(c1, c2)) * (call[0] == '@' ? 1 : 5);
	}
	return score;
}
function calc_diff(node1, id1, len1, node2, id2, len2) {
	let pos_diff = 0;
	if (len1 > 1 && len2 > 1) {
		let pos_1 = id1 / (len1 - 1);
		let pos_2 = id2 / (len2 - 1);
		pos_diff = Math.abs(pos_1 - pos_2);
	}
	let children_diff = calc_children_diff(node1.children, node2.children);
	let meaning_diff = calc_str_diff(node1.meaning, node2.meaning);
	return 1e10 * children_diff + 1e5 * meaning_diff + pos_diff;
}
//TODO: rename to diff or anything alike
function compare(starting_nodes) {
	let N = starting_nodes.length;
	if (N == 1) {
		return starting_nodes[0][1];
	}
	let ret = new Node();
	function dfs(input_nodes, output_node) { //TODO: if there's only one node left just relabel everything rather than creating new nodes
		//TODO: if all children match along all nodes just proceed without any matching algorithm
		let any_diff = false;
		let meanings = [];
		for (let i = 0; i < starting_nodes.length; ++i)
			meanings.push([input_nodes[i][0], input_nodes[i][1] === undefined ? undefined : input_nodes[i][1].meaning]);
		[diff_here, diff_meaning] = diff_meanings(meanings);
		output_node.meaning = diff_meaning;
		output_node.update_innerHTML()
		if (diff_here) {
			output_node.other_classes.add('diff');
			any_diff = true;
		}
		let joins = new Array(N);
		for (let i = 0; i < input_nodes.length; ++i) {
			if (input_nodes[i][1] === undefined) continue;
			joins[i] = new Array(input_nodes[i][1].children.length);
			for (let j = 0; j < input_nodes[i][1].children.length; ++j) {
				joins[i][j] = new Array(N);
				joins[i][j][i] = j;
			}
		}
		function try_join(version1, node1, version2, node2) {
			let ids_1 = joins[version1][node1];
			let ids_2 = joins[version2][node2];
			for (let i = 0; i < N; ++i) if (ids_1[i] !== undefined && ids_2[i] !== undefined) return false;
			ids_1 = ids_1.slice();
			ids_2 = ids_2.slice();
			for (let i = 0; i < N; ++i) if (ids_1[i] !== undefined)
				for (let j = 0; j < N; ++j) if (ids_2[j] !== undefined) {
					joins[i][ids_1[i]][j] = ids_2[j];
					joins[j][ids_2[j]][i] = ids_1[i];
				}
			return true;
		};
		let call_maps = new Array(N);
		for (let i = 0; i < N; ++i) {
			if (input_nodes[i][1] == undefined) continue;
			call_maps[i] = new Map();
			for (let j = 0; j < input_nodes[i][1].children.length; ++j) {
				let child = input_nodes[i][1].children[j];
				let key = child.call.to_key();
				// if (key[0] == '@') //TODO: remove comments from this part of algorithm
				if (!call_maps[i].has(key)) call_maps[i].set(key, [[child, j]])
				else call_maps[i].get(key).push([child, j])
			}
		}
		let merges = [];
		for (let i = 0; i < N; ++i) for (let j = i + 1; j < N; ++j) {
			let map_i = call_maps[i], map_j = call_maps[j];
			if (map_i !== undefined && map_j !== undefined) {
				for (let [call, nodes] of map_i) {
					let oth_nodes = map_j.get(call);
					if (oth_nodes !== undefined) {
						for (let [node, id] of nodes) {
							for (let [oth_node, oth_id] of oth_nodes) {
								let score = calc_diff(node, id, input_nodes[i][1].children.length, oth_node, oth_id, input_nodes[j][1].children.length); //TODO: omit if definitely unnecessary i.e. this call is used at most once in every version
								merges.push([score, i, id, j, oth_id]);
							}
						}
					}
				}
			}
		}
		merges.sort(function(a, b){return a[0] - b[0];});
		for (let [_priority, v1, node1, v2, node2] of merges) {
			try_join(v1, node1, v2, node2);
		}
		let all_calls_array = [];
		for (let i = 0; i < N; ++i) if (input_nodes[i][1] !== undefined) {
			for (let joined_node of joins[i]) {
				let already_used = false;
				for (let x = 0; x < i; ++x) if (joined_node[x] !== undefined) already_used = true;
				if (already_used) continue;
				let actual_call = input_nodes[i][1].children[joined_node[i]].call;
				all_calls_array.push([actual_call, joined_node]);
			}
		}
		let order = hamilton_path(all_calls_array, call_order_compare);
		// TODO: some comment if nodes were reordered
		for (let [call, indices] of order) {
			let sub_output = output_node.append_child(call, '')
			let sub_nodes = new Array(N);
			for (let i = 0; i < N; ++i)
				sub_nodes[i] = [input_nodes[i][0], indices[i] === undefined ? undefined : input_nodes[i][1].children[indices[i]]];
			let ret = dfs(sub_nodes, sub_output);
			if (ret) any_diff = true;
		}
		// let comments = new Array(input_nodes.length);
		// for (let i = 0; i < input_nodes.length; ++i) {
			// comments[i] = new Array();
			// if (input_nodes[i][1] !== undefined) {
				// for (let node of input_nodes[i][1].children) {
					// 
					// if (node.call.type == COMMENT) comments[i].push();
				// }
			// }
		// }
		if (any_diff) output_node.other_classes.add('subtreediff');
		return any_diff;
	}
	dfs(starting_nodes, ret);
	let titles = [];
	for (let i = 0; i < starting_nodes.length; ++i) titles.push([starting_nodes[i][0], starting_nodes[i][1].title]);
	[diff_title, title_content] = diff_meanings(titles);
	ret.title = title_content;
	if (diff_title) ret.diff_title = true;
	for (let i = 0; i < N; ++i) {
		let tried = starting_nodes[i][1].title;
		if (tried) {
			ret.HTML_title = tried;
			break;
		}
	}
	return ret;
}
function get_url(owner, repo, version, file) {
	return ('https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + version + '/' + file);
}
function hamilton_path(array, compare) {
	if (array.length <= 1) return array.slice();
	let pivot = Math.floor(array.length / 2);
	let bef = [], aft = [];
	for (let i = 0; i < array.length; ++i) if (i != pivot) {
		if (compare(array[i], array[pivot]))
			bef.push(array[i]);
		else
			aft.push(array[i]);
	}
	return hamilton_path(bef, compare).concat([array[pivot]]).concat(hamilton_path(aft, compare))
}
function display_error(e, where=undefined) {
	if (where === undefined) where = document.querySelector('#bidding');
	add_theme_switch_node()
	if (e instanceof ParsingError || e instanceof FileNotFound) {
		let errorNode = document.createElement('div');
		errorNode.classList.add('error');
		errorNode.innerHTML = 'Error: ' + format_str(e.message);
		where.appendChild(errorNode);
		if (e.title !== undefined) {
			set_system_title(e.title);
		}
		$('body').addClass('done')
	}
	else throw e;
}
function get_versions() {
	let domain = window.location.hostname, params = new URLSearchParams(window.location.search), path = window.location.pathname, protocol = window.location.protocol;
	repo = undefined, owner = undefined;
	if (protocol === 'http:' || protocol === 'https:') {
		if (domain.match('.github.io$')) {
			owner = domain.split('.')[0];
			repo = path.split('/')[1];
		}
	}
	let keys = [...params.keys()];
	let params_list = [];
	let paste = repo === undefined;
	for (let k of keys) {
		if (k === 'fbclid' || k === 'gclid' || k === 'dclid' || k === 'gclsrc' || k === 'msclkid' || k === 'theme') continue;
		let v = params.get(k)
		let [a, b] = v.split(':')
		let version = a ? a : 'main';
		let file = b ? b : 'description.txt';
		params_list.push([k, version, file]);
	}
	if (!params_list.length) params_list = [['', 'main', 'description.txt']]; 
	if (owner === undefined) {owner = 'kezsulap', repo = 'SSO_MAX_CC'} //Uncomment for local testing of web related features
	return [owner, repo, params_list]
}
function doesOverflowVertically(el) {
	let curOverflow = el.style.overflow;
	if (!curOverflow || curOverflow === "visible")
		el.style.overflow = "hidden";
	let isOverflowing = el.clientWidth < el.scrollWidth;
	el.style.overflow = curOverflow;
	return isOverflowing;
}
function align_topmenu() {
	let topmenu = document.querySelector('#topmenulist');
	let all_answers = topmenu.children;
	for (let i = all_answers.length; i >= 1; --i) {
		document.querySelector('#topmenulist').style.gridTemplateColumns = 'repeat(' + i + ', ' + (100 / i - 0.00001) + '%)';
		let any_overflow = false;
		for (let x of all_answers) if (doesOverflowVertically(x)) any_overflow = true;
		if (!any_overflow) break;
	}
}
