from itertools import product
from collections import defaultdict

def format_shape(x):
    return "".join(map(str, x))

all_shapes = [(s, h, d, c) for s, h, d, c in product(range(14), range(14), range(14), range(14)) if s + h + d + c == 13 and max(c, d, h, s) <= 6 and sum(sorted([c, d, h, s])[2:]) <= 10]
def go(opens):
    counts = {shape : [] for shape in all_shapes}
    for fun in opens:
        bid = fun.__name__
        would_open = [shape for shape in all_shapes if fun(*shape)]
        for shape in would_open:
            counts[shape].append(bid)
        print(f'{bid = } would_open = {", ".join([format_shape(x) for x in would_open])}, total of {len(would_open)}')
    
    missing_shapes = []

    for shape, bids in counts.items():
        if not bids:
            missing_shapes.append(format_shape(shape))

    if missing_shapes:
        print(f'No openings matching shapes: {missing_shapes} (total of {len(missing_shapes)} shape(s))')

    by_bid_ambiguous = defaultdict(list)
    
    for shape, bids in counts.items():
        # print(f'{shape = }, {bids = }')
        if len(bids) >= 2:
            bids_tuple = tuple(bids)
            by_bid_ambiguous[bids_tuple].append(shape)

    for bids, shapes in by_bid_ambiguous.items():
        # print(f'{bids = }, {shapes = }')
        print(f'{[format_shape(shape) for shape in shapes]} are ambiguous with {bids = }')

opens = []

def opening(f):
    opens.append(f)
    return f

@opening
def semibalanced_1c(s, h, d, c):
    return max(c, d, h, s) <= 5 and (h + s <= 8) and min(h, s) >= 2 and sorted([c, d, h, s])[2] <= 4

@opening
def open_1y_short_spade(s, h, d, c):
    return (s <= 1 and min(c, d, h) >= 3 and max(c, d, h, s) <= 5 and min(h, c) <= 4 and min(h, d) <= 4) or (s == 0 and h <= 4 and sorted([h, c, d]) == [3, 4, 6])

@opening
def open_1y_short_hearts(s, h, d, c):
    return (h <= 1 and min(c, d, s) >= 3 and max(c, d, s, h) <= 5 and min(s, c) <= 4 and min(s, d) <= 4) or (h == 0 and s <= 4 and sorted([s, c, d]) == [3, 4, 6])

@opening
def open_1n_majors_or_minors(s, h, d, c):
    return (max(c, d) >= 4 and c + d >= 10 and max(s, h) <= 2) or (max(h, s) >= 5 and min(h, s) >= 4)

@opening
def open_2c_natural(s, h, d, c):
    return c >= 6 and d < 4 and min(h, s) >= 1

@opening
def open_2c_two_suited(s, h, d, c):
    return d >= 5 and s >= 5

@opening
def open_2d_natural(s, h, d, c):
    return d >= 6 and c < 4 and min(h, s) >= 1

@opening
def open_2d_two_suited(s, h, d, c):
    return c >= 5 and h >= 5

@opening
def open_2h_natural(s, h, d, c):
    return h >= 6 and s < 4

@opening
def open_2h_two_suited(s, h, d, c):
    return c >= 5 and s >= 5

@opening
def open_2s_natural(s, h, d, c):
    return s >= 6 and h < 4

@opening
def open_2s_two_suited(s, h, d, c):
    return d >= 5 and h >= 5

# @opening 
# def open_2n(s, h, d, c):
    # return max(c, d) == 6 and max(h, s) == 4 and min(h, s) == 3


go(opens)
