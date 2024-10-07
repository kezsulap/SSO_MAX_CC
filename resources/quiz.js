class QuizQuestion {
	constructor(bidding, meanings, ids) {
		this.bidding = bidding;
		this.meanings = meanings;
		this.ids = ids;
	}
	show_question() {
		let question = document.querySelector('#question');
		question.innerHTML = format_str(this.bidding.to_table());
	}
	show_answer() {
		let content = '';
		for (let meaning of this.meanings) {
			let [call, description] = meaning;
			if (description)
				content += '<div class="answer_meaning"><div class="call">' + call_to_str(call.value) + '</div>: <div class="call_meaning">' + description + '</div></div>';
		}
		document.querySelector('#answer').innerHTML = format_str(content);
	}
	show_context() {
		let nodes = document.querySelectorAll('#bidding .bidding')
		for (let x of nodes) if (parseInt(x.getAttribute('level'))) x.style.display = 'none'
		for (let i = 1; i < this.ids.length - 1; ++i) {
			let start_id = this.ids[i];
			nodes[start_id].classList.add('rozwiniete')
			let start_level = parseInt(nodes[start_id].getAttribute('level'));
			for (let id = start_id + 1; id < nodes.length; ++id) {
				let curr_level = parseInt(nodes[id].getAttribute('level'));
				if (curr_level <= start_level) break;
				if (curr_level == start_level + 1) nodes[id].style.display = ''
			}
		}
	}
};
function extract_questions(root_node) {
	let ret = [];
	let current_id = -1;
	function dfs(node, meanings, active, ids) {
		let my_id = current_id++;
		ids = ids.concat([my_id])
		if (meanings.length && active) {
			ret.push(new QuizQuestion(node.current_auction, meanings, ids));
		}
		for (let subnode of node.children) {
			dfs(subnode, meanings.concat([[subnode.call, subnode.meaning]]), active && (subnode.call.type != COMMENT), ids);
		}
	}
	dfs(root_node, [], true, []);
	return ret;
}
current_question_id = undefined;
function pick_question() {
	return Math.floor(Math.random() * questions.length); //TODO: better algorithm
}
function handle_show_answer() {
	console.assert(current_question_id !== undefined);
	let question = questions[current_question_id];
	question.show_answer();
	question.show_context();
	document.querySelector('#show_answer_button').style.display = 'none';
	document.querySelector('#wrong_answer_button').style.display = '';
	document.querySelector('#medium_answer_button').style.display = '';
	document.querySelector('#correct_answer_button').style.display = '';
	document.querySelector('#next_question_button').style.display = 'none';
	document.querySelector('#context').style.display = '';
}
function handle_score(score) {
	console.log('score = ' + score)
	document.querySelector('#show_answer_button').style.display = 'none';
	document.querySelector('#wrong_answer_button').style.display = 'none';
	document.querySelector('#medium_answer_button').style.display = 'none';
	document.querySelector('#correct_answer_button').style.display = 'none';
	document.querySelector('#next_question_button').style.display = '';
	document.querySelector('#context').style.display = '';
}
function handle_next_question() {
	current_question_id = pick_question();
	let question = questions[current_question_id];
	question.show_question();
	document.querySelector('#answer').innerHTML = ''
	document.querySelector('#show_answer_button').style.display = '';
	document.querySelector('#wrong_answer_button').style.display = 'none';
	document.querySelector('#medium_answer_button').style.display = 'none';
	document.querySelector('#correct_answer_button').style.display = 'none';
	document.querySelector('#next_question_button').style.display = 'none';
	hide_context();
	document.querySelector('#context').style.display = 'none';
}
context_visible = false
function handle_toggle_context() {
	if (context_visible) hide_context();
	else show_context();
}
function show_context() {
	context_visible = true;
	document.querySelector('#bidding').style.display = '';
	document.querySelector('#show_context_button').innerText = 'Hide context:';
}
function hide_context() {
	context_visible = false;
	document.querySelector('#bidding').style.display = 'none';
	document.querySelector('#show_context_button').innerText = 'Show context:';
}
function init() {
	window.addEventListener('load', function() {
		let root_node = undefined;
		try {
			if (hardcoded !== undefined) {
				if (hardcoded.length > 1) display_error(new ParsingError('Using multiple files with quiz not supported'));
				let nodes = [];
				for (let i = 0; i < hardcoded.length; ++i) {
					nodes.push(['V' + (i + 1), parse_file(hardcoded[i])]);
				}
				root_node = nodes[0][1];
			}
			else {
				let [owner, repo, versions] = get_versions()
				if (owner === undefined) {
					display_error(new ParsingError('To host your system outside of github pages generate index.html using python script, for more see <a href="https://github.com/kezsulap/SSO_MAX_CC?tab=readme-ov-file#advanced-mode">this</a>'));
					return;
				}
				let nodes = [];
				if (versions.length > 1) display_error(new ParsingError('Using multiple files with quiz not supported'));
				for (let [name, version, file] of versions)
					nodes.push([name, parse_file(load(get_url(owner, repo, version, file)))]);
				root_node = nodes[0][1];
			}
		}
		catch (e) {
			display_error(e);
		}
		questions = extract_questions(root_node);
		// used = new Array(questions.length).fill(false) //TODO: part of better algorithm
		display(root_node, true, false);
		handle_next_question()
	})
}
init()
