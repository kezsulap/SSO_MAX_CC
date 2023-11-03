function theme(bright) {
	if (bright) {
		document.querySelector('body').classList.remove('dark');
		document.querySelector('body').classList.add('bright');
	}
	else {
		document.querySelector('body').classList.add('dark');
		document.querySelector('body').classList.remove('bright');
	}
}
curr_theme = localStorage.getItem('theme') == 'bright'
function Easter(Y) {
	var C = Math.floor(Y/100);
	var N = Y - 19*Math.floor(Y/19);
	var K = Math.floor((C - 17)/25);
	var I = C - Math.floor(C/4) - Math.floor((C - K)/3) + 19*N + 15;
	I = I - 30*Math.floor((I/30));
	I = I - Math.floor(I/28)*(1 - Math.floor(I/28)*Math.floor(29/(I + 1))*Math.floor((21 - N)/11));
	var J = Y + Math.floor(Y/4) + I + 2 - C + Math.floor(C/4);
	J = J - 7*Math.floor(J/7);
	var L = I - J;
	var M = 3 + Math.floor((L + 40)/44);
	var D = L + 28 - 31*Math.floor(M/4);
	return [M, D];
}
function pick_special_theme() {
	const date = new Date();

	let day = date.getDate();
	let month = date.getMonth() + 1;
	let year = date.getFullYear();

	if (month == 4 && day == 1) return 'april-fool'
	if (month == 12 && day >= 24 && day <= 26) return 'christmas'
	if (month == 6 && day == 1) return 'children'
	if (month == 4 && day == 24) return 'earth'
	
	let [easter_m, easter_d] = Easter(year)
	let days_til_easter = (new Date(year + '-' + month + '-' + day).getTime() - new Date(year + '-' + easter_m + '-' + easter_d).getTime()) / (24 * 60 * 60 * 1000)
	if (days_til_easter >= -2 && days_til_easter <= 1) return 'easter'
	if (month == 10 && day == 31) return 'halloween'
	if (month == 11 && day == 11) return 'independence'
	if (month == 3 && day == 10) return 'men'	
	if (month == 12 && day == 31) return 'new-year'
	if (month == 1 && day == 1) return 'new-year'
	if (month == 5 && day == 17) return 'rainbow'
	if (month == 12 && day == 6) return 'santa'
	if (month == 2 && day == 24) return 'ukraine'
	if (month == 2 && day == 14) return 'valentines'	
	if (month == 3 && day == 8) return 'women'	
}
function init_theme() {
	theme(curr_theme)
	special_theme = pick_special_theme()
	if (special_theme) document.querySelector('body').classList.add(special_theme)
}
window.addEventListener('load', init_theme)
function handle_theme_switch() {
	curr_theme = !curr_theme
	localStorage.setItem('theme', curr_theme ? 'bright' : 'dark')
	theme(curr_theme)
}

