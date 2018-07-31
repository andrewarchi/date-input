class DateFormat {
  constructor(blocks, delim) {
    this.blocks = blocks;
    this.blockSizes = blocks.map(b => b.length);
    this.delim = delim;
  }

  join(blocks) {
    let formatted = blocks[0];
    for (let i = 1; i < blocks.length; i++) {
      if (blocks[i] !== '' || blocks[i - 1].length === this.blocks[i - 1].length) {
        formatted += this.delim + blocks[i];
      }
    }
    return formatted;
  }

  isValid(year, month, day) {
    return month.length === 2 && day.length === 2 && year.length === 4 &&
      month > 0 && month <= 12 &&
      day > 0 && day <= getDaysInMonth(+month, +year) &&
      year >= 1900 && year <= 2999;
  }

  insertDelim(value, position) {
    const sanitized = sanitizeDelims(value);
    position = getSanitizedPosition(value, position);
    let blockStart = 0;
    let blockEnd = 0;
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      blockEnd += block.length;
      if (block !== 'yyyy' && position > blockStart && position < blockEnd && sanitized.slice(blockStart, position) > 0) {
        return sanitized.slice(0, blockStart) + '|' + sanitized.slice(blockStart, position).padStart(block.length, '0') + '|' + sanitized.slice(position);
      }
      blockStart += block.length;
    }
    return sanitized;
  }
}

export class MDY extends DateFormat {
  constructor() {
    super(['mm', 'dd', 'yyyy'], '/');
  }

  parseInput(value) {
    const [ month, rest1 ] = parseMonth(sanitizeDelims(value));
    const [ day, rest2 ] = parseDay(rest1, +month);
    const [ year ] = parseYear(rest2, true);
    return [ month, day, year ];
  }

  paste(value) {}

  isValid(blocks) {
    const [ month, day, year ] = blocks;
    return super.isValid([ year, month, day ]);
  }
}

export class YMD extends DateFormat {
  constructor() {
    super(['yyyy', 'mm', 'dd'], '-');
  }

  parseInput(value) {
    const [ year, rest1 ] = parseYear(sanitizeDelims(value), false);
    const [ month, rest2 ] = parseMonth(rest1);
    const [ day ] = parseDay(rest2, +month, +year);
    return [ year, month, day ];
  }
}

function parseMonth(input) {
  if (input.charAt(0) > 1 || input.slice(0, 2) > 12) {
    return ['0' + input.charAt(0), input.slice(1)];
  }
  return [input.slice(0, 2), input.slice(2)];
}

function parseDay(input, month, year) {
  const maxDay = getDaysInMonth(month, year);
  const maxDigit = month === 2 ? 2 : 3;
  if (input.charAt(0) > maxDigit || input.slice(0, 2) > maxDay) {
    return ['0' + input.charAt(0), input.slice(1)];
  }
  return [input.slice(0, 2), input.slice(2)];
}

function parseYear(input, flexible) {
  if (flexible) {
    const year = input.slice(0, 2);
    if (input.length === 2 && year !== '20' && year !== '19') {
      const maxYear = (new Date().getFullYear() % 100) + 10;
      return [(year <= maxYear ? '20' : '19') + year, input.slice(2)];
    }
  }
  return [input.slice(0, 4), input.slice(4)];
}

function getDaysInMonth(month, year) {
  const leapYear = typeof year === 'undefined' || isLeapYear(year);
  return [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function sanitizeDelims(value) {
  return value.replace(/[^\d]/g, '');
}

function getSanitizedPosition(value, position) {
  return position - (value.slice(0, position).match(/[^\d]/g) || []).length;
}

/*const mdy = new MDY();
const ymd = new YMD();
console.log([...Array(999999)].map((a, i) => {
  const mdyBlocks = mdy.parseInput(i+'');
  const ymdBlocks = ymd.parseInput(i+'');
  return [mdy.join(mdyBlocks), mdy.isValid(mdyBlocks), ymd.join(ymdBlocks), ymd.isValid(ymdBlocks)];
}));*/

const mdy = new MDY();
const ymd = new YMD();
console.log([
  ['1/23/45', 1],
  ['0/12/34', 1],
  ['12/34/56', 1],
  ['1/23/45', 2],
  ['0/12/34', 2],
  ['12/34/56', 3]
].map(a => {
  const insertedMDY = mdy.insertDelim(a[0], a[1]);
  const insertedYMD = ymd.insertDelim(a[0], a[1]);
  return [...a, insertedMDY, mdy.join(mdy.parseInput(insertedMDY)), insertedYMD, ymd.join(ymd.parseInput(insertedYMD))];
}));
