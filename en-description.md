```
&Title of the system can be optionally put on the first line of the file after & symbol
pass start each line with the description of the call and then put it's meaning
	1c then describe responses in a line starting with a single tab character
		1d then responses to that bid with double tab character at the start
			1h etc.
		#Lines starting with '#' are comments, they are ignored by the parser
		#and can be used to make the file more readable for yourself
		#to describe responses for some previous bid use one more tab
		#then the bid we're responding to
		1h so this is a response to 1c
		1s and so is this
		1n Comments #can also be put at the end 
		2c Click a bid to fold/unfold direct responses to it
		2d Right click/long tap on a touch-screen to unfold
			2h all subsequent nodes
		2h suit symbols described using either ♠/♥/♦/♣ or !s/!h/!d/!c
			2s are automatically replaced with actual symbols and
			2n coloured blue/red/orange/green
	1d This is a response to pass
		(1h) for competitive bidding put a call in () to make it opp's call
			dbl double can be described as x, dbl, db or ktr
				(rdbl) redouble as xx, rdb, rdbl, rktr or re
					p pass as p, pa, pas or pass
		PasS bid descriptions can use upper or lowercase letters
			(2♦) denomination of bids can be described using ♦/d/!d
				2!h 
					2nT notrump can be n/nt/ba
		(2c) it is OK to specify either 2 our or 2 opponent's calls in a row
			(2d) and this assumes the player in-between passes
@Lines starting with @ are notes they don't describe specific calls,
	@but can be used to convey other information
	@and can also have subnodes as well
@For example
@Slam bidding
	4NT blackwood
		5c 1/4
		5d 0/3
		5h 2 without Q of trumps
		5s 2 with Q of trumps and no side kings
1c
	({1 level overcall}) also you can put any text describing a call
		{2 of opponent suit} in curly braces to mean ({op's call}) or {our call}
1d You can use this syntax %(Qx J10x Q98xx AKx) to show a hand
	@To indicade a void use a hyphen %(- - - AKQJ10xxxxxxxx)

#Any number of blank lines anywhere in the file is OK


@Non vulnerable
1nt 12-14
@Vulnerable
#Defining 1nt again would result in an error of redefining a sequence
!1nt 15-17 #you can put ! before the call to override it
	(2c) majors
		x Penalty
	#The same goes for opponent's calls, so (2c) will result in an error
	!(2c) natural #But this is fine
		x Stayman
	
```
This will result in [this output](https://kezsulap.github.io/SSO_MAX_CC/index.html?v=code:README-files/en-example1.txt)
### Defining a sequence
If a sequence occurs multiple times can be defined once and pasted into multiple places in the file
```
#define a part of system occurring in multiple spaces
#with naming any parts which are different
function 1nt_open(strength, inv_strength)
	#$(variable_name) will be replaced by parameter given below
	1nt $(strength) balanced 
		2c Stayman
			2d no 4M
		2d 5+♥
		2h 5+♠
		2n $(inv_strength), no 4M
end
1c 12-14 balanced/15+ 5+♣/18+ any
	1d 0-6 any
		#Replace all $(strength) with 18-21 and all $(inv_strength) with 4-5
		:1nt_open(18-21, 4-5)
:1nt_open(15-17, 8-9)
```
This would expand to
```
1c 12-14 balanced/15+ 5+♣/18+ any
	1d 0-6 any
		1nt 18-21 balanced
			2c Stayman
				2d no 4M
			2d 5+♥
			2h 5+♠
			2n 4-5, no 4M
1nt 15-17 balanced
	2c Stayman
		2d no 4M
	2d 5+♥
	2h 5+♠
	2n 8-9, no 4M
```
and be processed accordingly to [this output](https://kezsulap.github.io/SSO_MAX_CC/index.html?v=code:README-files/en-example2.txt)
```
function after_transfer_to_h()
	1h exactly 3!h
	1s 4!s, no 3!h
	1n etc.
	#? means the bid will be added only if it's valid and not repeated,
	#otherwise it'll be omitted with no error
	?(dbl) takeout
		rdbl strong
	#!? means the bid will be added only if it's valid even if repeated
	#otherwise it'll be omitted with no error
	!?(dbl) diamonds 
		rdbl 3+♦
end
function after_transfer_to_s()
	1s exactly 3!s
	1n etc.
end
function after_transfer_to_nt_after_1c()
	1n automatic with 12-14
	2c 15+ 5+♣
	{2d and higher} 18+ natural
end
function after_transfer_to_nt_after_1d()
	1n 12-14 5332
	2c 12+ 5+♦, 4+♣
	2d 12-14 6+♦
end
function 1_level_transfers(double_transfers_to, which_bidding_after_transfer_to_NT)
	?dbl 4+!$(double_transfers_to) 
		#variable substitution does basic text substitution before processing
		#the whole line, so all sorts of trickery like this will work
		:after_transfer_to_$(double_transfers_to)() 
	?1d 4+♥ 
		:after_transfer_to_h()
	?1h 4+♠
		:after_transfer_to_s()
	?1s transfer to NT
		:$(which_bidding_after_transfer_to_NT)()
end
1c 12-14 balanced/15+ 5+♣/18+ any
	(dbl)
		pass 0-6PC, any shape
		rdbl 12+, 3+♣
		#double will be considered invalid anyway, $(double_transfers_to) can be set to anything
		:1_level_transfers(-, after_transfer_to_nt_after_1c)
	(1d)
		:1_level_transfers(h, after_transfer_to_nt_after_1c)
	(1h)
		:1_level_transfers(s, after_transfer_to_nt_after_1c)
1d 12-17 5+♦
	(1h)
		:1_level_transfers(s, after_transfer_to_nt_after_1d)
```
This would expand to
```
1c 12-14 balanced/15+ 5+♣/18+ any
	(dbl)
		pass 0-6PC, any shape
		rdbl 12+, 3+♣
		?dbl 4+!- #invalid double, omitted
			:after_transfer_to_-() 
		?1d 4+♥ 
			:after_transfer_to_h()
		?1h 4+♠
			:after_transfer_to_s()
		?1s transfer to NT
			:after_transfer_to_nt_after_1c()
	(1d)
		?dbl 4+!h 
			:after_transfer_to_h() 
		?1d 4+♥ #insufficient bid, omitted
			:after_transfer_to_h()
		?1h 4+♠
			:after_transfer_to_s()
		?1s transfer to NT
			:after_transfer_to_nt_after_1c()
	(1h)
		?dbl 4+!s
			:after_transfer_to_s() 
		?1d 4+♥ #insufficient bid, omitted  
			:after_transfer_to_h()
		?1h 4+♠ #insufficient bid, omitted
			:after_transfer_to_s()
		?1s transfer to NT
			:after_transfer_to_nt_after_1c()
1d 12-17 5+♦
	(1h)
		?dbl 4+!s
			:after_transfer_to_s() 
		?1d 4+♥  #insufficient bid, omitted
			:after_transfer_to_h()
		?1h 4+♠  #insufficient bid, omitted
			:after_transfer_to_s()
		?1s transfer to NT
			:$after_transfer_to_nt_after_1d()
```
And then to 
```
1c 12-14 balanced/15+ 5+♣/18+ any
	(dbl)
		pass 0-6PC, any shape
		rdbl 12+, 3+♣
		?1d 4+♥ 
			1h exactly 3!h
			1s 4!s, no 3!h
			1n etc.
			?(dbl) takeout #included
				rdbl strong
			!?(dbl) diamonds #included
				rdbl 3+♦
		?1h 4+♠
			1s exactly 3!s
			1n etc.
		?1s transfer to NT
			1n automatic with 12-14
			2c 15+ 5+♣
			{2d and higher} 18+ natural
	(1d)
		?dbl 4+!h 
			1h exactly 3!h
			1s 4!s, no 3!h
			1n etc.
			?(dbl) takeout #Invalid double, ommited
				rdbl strong
			!?(dbl) diamonds #Invalid double, ommited
				rdbl 3+♦
		?1h 4+♠
			1s exactly 3!s
			1n etc.
		?1s transfer to NT
			1n automatic with 12-14
			2c 15+ 5+♣
			{2d and higher} 18+ natural
	(1h)
		?dbl 4+!s
			1s exactly 3!s
			1n etc.
		?1s transfer to NT
			1n automatic with 12-14
			2c 15+ 5+♣
			{2d and higher} 18+ natural
1d 12-17 5+♦
	(1h)
		?dbl 4+!s
			1s exactly 3!s
			1n etc.
		?1s transfer to NT
			1n 12-14 5332
			2c 12+ 5+♦, 4+♣
			2d 12-14 6+♦

```
Eventually resulting in [this output](https://kezsulap.github.io/SSO_MAX_CC/index.html?v=code:README-files/en-function-example3.txt)
### Arithmetic operators in functions
Functions support addition and subtractions of variables on numbers and calculating bid x steps above/below some bid
```
function open_1s(lower_strength)
	!1s 5+♠ $(lower_strength)-$(lower_strength + 5) PC
		1n $(17 - lower_strength)-$(20 - lower_strength) PC, no 4♠
		2c $(24 - lower_strength)+PC, GF
end
@Nonvulnerable
:open_1s(10)
@Both red
:open_1s(11)
@Red vs White
:open_1s(12)
```
[Output](https://kezsulap.github.io/SSO_MAX_CC/index.html?v=code:README-files/en-function-example4.txt)
```
function kings(start_bid)
	?$(start_bid) no kings
	$(start_bid + 1) king of ♣ or ♦+♥
	$(start_bid + 2) king of ♦ or ♣+♥
	$(start_bid + 3) king of ♥ or ♣+♦
	$(start_bid + 4) kings of ♣+♦+♥
end
4NT blackwood on !s
	5c 1/4
		5d ask for Q of ♠
			5h no
			@other show Q of ♠
			:kings(5s)
	5d 0/3
		5h ask for Q of ♠
			5s no
			@other show Q of ♠
			:kings(5n)
	5h 2 without Q
		5n ask for Ks
			:kings(6c)
		(dbl)
			pass ask for Ks
				xx no kings
				#response 5h will be omitted as it's insufficient
				#that's a workaround to make show only responses with 1+ kings
				:kings(5h)
```
[Output](https://kezsulap.github.io/SSO_MAX_CC/index.html?v=code:README-files/en-function-example5.txt)
```
function test_function(bid)
	#? to skip the bid if it's below 1♣, without it this file would give an error
	?$(bid - 6) 5 steps below $(bid) 
	?$(bid - 5) 4 steps below $(bid)

	?$(bid + 29) 29 steps above $(bid)
	?$(bid + 30) 30 steps above $(bid) #? to skip the bid if it's above 7NT
end
:test_function(2♣)
```
[Output](https://kezsulap.github.io/SSO_MAX_CC/index.html?v=code:README-files/en-function-example6.txt)

