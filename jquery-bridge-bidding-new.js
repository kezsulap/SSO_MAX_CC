//Tu będzie licencja :)

//znakiBrydzowe
//$( document ).ready(function() {
//var str = document.getElementById("content").innerHTML; 
//var res = str.replace(/♣/g, "♧").replace(/♦/g, "♢").replace(/♥/g, "♡").replace(/♠/g, "♤").replace(/@♧/g, //"<i>[WK:4♧]</i>").replace(/@♢/g, //"<i>[WK:4♢]</i>").replace(/@♡/g, "<i>[WK:4♡]</i>").replace(/@♤/g, "<i>[WK:4♤]</i>");
//document.getElementById("content").innerHTML = res;
//});

//znakiBrydzowe2
$( document ).ready(function() {
var str = document.getElementById("content").innerHTML; 
var res = str.replace(/@♣/g, "<i>[4♣:ES]</i>").replace(/@♦/g, "<i>[4♦:ES]</i>").replace(/@♥/g, "<i>[4♥:ES]</i>").replace(/@♠/g, "<i>[4♠:ES]</i>");
document.getElementById("content").innerHTML = res;
});


$(function() {
  $('div#bidding>div').addClass('bidding');
  $("div.bidding").addClass('level00').attr('level', 0);
  $("div.bidding:contains('	')").removeClass('level00').addClass('level01').attr('level', 1);
  $("div.bidding:contains('		')").removeClass('level01').addClass('level02').attr('level', 2);
  $("div.bidding:contains('			')").removeClass('level02').addClass('level03').attr('level', 3);
  $("div.bidding:contains('				')").removeClass('level03').addClass('level04').attr('level', 4);
  $("div.bidding:contains('					')").removeClass('level04').addClass('level05').attr('level', 5);
  $("div.bidding:contains('						')").removeClass('level05').addClass('level06').attr('level', 6);
  $("div.bidding:contains('							')").removeClass('level06').addClass('level07').attr('level', 7);
  $("div.bidding:contains('								')").removeClass('level07').addClass('level08').attr('level', 8);
  $("div.bidding:contains('									')").removeClass('level08').addClass('level09').attr('level', 9);
  $("div.bidding:contains('										')").removeClass('level09').addClass('level10').attr('level', 10);
  $("div.bidding:contains('											')").removeClass('level10').addClass('level11').attr('level', 11);
  $("div.bidding:contains('												')").removeClass('level11').addClass('level12').attr('level', 12);
  $("div.bidding:contains('													')").removeClass('level12').addClass('level13').attr('level', 13);
  $("div.bidding:contains('														')").removeClass('level13').addClass('level14').attr('level', 14);
  $("div.bidding:contains('															')").removeClass('level14').addClass('level15').attr('level', 15);
  $("div.bidding:contains('																')").removeClass('level15').addClass('level16').attr('level', 16);
  $("div.bidding:contains('																	')").removeClass('level16').addClass('level17').attr('level', 17);
  $("div.bidding:not('.level00')").hide();
  
  $( "div.bidding" ).each(function() {
	level = parseInt($(this).attr("level"));
    if ($(this).next().attr("level") == level + 1) {
		$(this).addClass("relay");
	}
  });
  
  $( "body" ).on("click", "div.relay:not('rozwiniete')", function() {
    clicked = parseInt($(this).attr("level"));
    $(this).nextAll().each(function() {
      sibling_number = parseInt($(this).attr("level"));
      if (sibling_number <= clicked) {
        return false;
      }
      if (sibling_number == clicked + 1) {
        $(this).show("slow");
      }
    });
    $(this).addClass( "rozwiniete" );	
  });
      
  $( "body" ).on("click", "div.rozwiniete", function() {
    clicked = parseInt($(this).attr("level"));
    $(this).nextAll().each(function() {
      sibling_number = parseInt($(this).attr("level"));
      if (sibling_number <= clicked) {
        return false;
      } else {
      	$(this).removeClass( "rozwiniete" );
        $(this).hide("slow");
      }
    });
    $(this).removeClass( "rozwiniete" );
  });
  

$(function(){
$('a.hidetoprint').click(function(){
$('div#topmenu').hide();
$('nav').hide();
return false;
});
});

$(function(){
$('a.rozwin').click(function(){
$("div.bidding:not('.level00')").show();
return false;
});
});

// Różne  
$(function(){
$('i:contains(WK:4♧)').attr('title', '4♧ = wywołanie końcowe<br/>(możemy zagrać 4♢),<br/>4♢ = pytanie szlemowe').addClass('mip');
$('i:contains(4♣:ES)').attr('title', '4♣ = end signal').addClass('mip');
$('i:contains(WK:4♢)').attr('title', '4♢ = wywołanie końcowe').addClass('mip');
$('i:contains(4♦:ES)').attr('title', '4♦ = end signal').addClass('mip');
$('i:contains(WK:4♡)').attr('title', '4♡ = wywołanie końcowe').addClass('mip');
$('i:contains(4♥:ES)').attr('title', '4♥ = end signal').addClass('mip');
$('i:contains(WK:4♤)').attr('title', '4♤ = wywołanie końcowe, 4♡ = do gry').addClass('mip');
$('i:contains(4♠:ES)').attr('title', '4♠ = end signal, 4♥ = do gry').addClass('mip');
$('i:contains(min)').attr('title', 'min').addClass('mi');
$('i:contains(D)').attr('title', 'min').addClass('mi');
$('i:contains(↓)').attr('title', 'min').addClass('mi');
$('i:contains(max)').attr('title', 'max').addClass('mi');
$('i:contains(G)').attr('title', 'max').addClass('mi');
$('i:contains(↑)').attr('title', 'max').addClass('mi');
$('i:contains(↕)').attr('title', 'whole').addClass('mi');
$('div.bidding:contains(•)').css("text-indent", "0").css("padding-left", ".5em");
$('div.bidding:contains(::)').append(" &#9888;");

$('i:contains( (odwrotny schemat odpowiedzi))').attr('title', 'odwrotny schemat odpowiedzi<br/>dla odzywek 4♧ i 4♢<br/> stosujemy gdy jest dwukolorówka<br/>starszy z młodszym');
$('div.bidding:contains(***)').addClass('newred');
$('div.bidding:contains(:.)').append("<i> (lepsza ręka w ramach minimum)</i>");
$('ul.topmenu').append("<li><a href='javascript:history.back()' class='topmenu' title='Powrót do poprzedniej<br/>strony'>←</a></li><li><a href='#' class='topmenu' title=''>&nbsp;Wkrótce (początek 2021) nowy adres strony internetowej&nbsp;</a></li>");
});

// Ustawienie balonów
$(function() {
	$('a, i, abbr, p').balloon({position: "bottom right"});
	$('p.relay, .divpokaz').balloon({position: "null"});
	$('a.alp, a.menu6a').balloon({position: "bottom right"});
	$('a.app, menu6b, a.tekstreklamowy').balloon({position: "bottom left"});
	$('span').balloon({position: "bottom"});
	$('td').balloon({position: "right"});
	$('.bidding').balloon({position: "left"});
	});


// Napisy końcowe :)  
});
