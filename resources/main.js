function init() {
	window.addEventListener('load', function() {
		if ($('body').hasClass('done')) {
			return;
		}
		try {
			if (hardcoded !== undefined) {
				let nodes = [];
				for (let i = 0; i < hardcoded.length; ++i) {
					nodes.push(['V' + (i + 1), parse_file(hardcoded[i])]);
				}
				display(compare(nodes))
			}
			else {
				let [owner, repo, versions] = get_versions()
				if (owner === undefined) {
					display_error(new ParsingError('To host your system outside of github pages generate index.html using python script, for more see <a href="https://github.com/kezsulap/SSO_MAX_CC?tab=readme-ov-file#advanced-mode">this</a>'));
					return;
				}
				let nodes = [];
				for (let [name, version, file] of versions)
					nodes.push([name, parse_file(load(get_url(owner, repo, version, file)))]);
				display(compare(nodes));
			}
		}
		catch (e) {
			display_error(e);
		}
		align_topmenu();
		addEventListener("resize", (event) => {align_topmenu()});
	})
}
init();
