class DateFormat {
  constructor(id, delim, blockSizes) {
    this.id = id;
    this.delim = delim;
    this.blockSizes = blockSizes;
  }

  join(blocks) {
    let formatted = blocks[0];
    for (let i = 1; i < blocks.length; i++) {
      if (blocks[i] !== '' || blocks[i - 1].length === this.blockSizes[i - 1]) {
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
}

export class MDY extends DateFormat {
  constructor() {
    super('mdy', '/', [2, 2, 4]);
  }

  parseInput(value) {
    const [ month, rest1 ] = parseMonth(value);
    const [ day, rest2 ] = parseDay(rest1, +month);
    const [ year ] = parseYear(rest2, true);
    return [ month, day, year ];
  }

  paste(value) {}
  insertDelim(position) {}

  isValid(blocks) {
    const [ month, day, year ] = blocks;
    return super.isValid(year, month, day);
  }
}

export class YMD extends DateFormat {
  constructor() {
    super('ymd', '-', [4, 2, 2]);
  }

  parseInput(value) {
    const [ year, rest1 ] = parseYear(value, false);
    const [ month, rest2 ] = parseMonth(rest1);
    const [ day ] = parseDay(rest2, +month, +year);
    return [ year, month, day ];
  }

  isValid(blocks) {
    return super.isValid(...blocks);
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

function getCleanIndex(value, index) {
  return index - (value.slice(0, index).match(/[^\d]/g) || []).length;
}

/*const mdy = new MDY();
const ymd = new YMD();
console.log([...Array(999999)].map((a, i) => {
  const mdyBlocks = mdy.parseInput(i+'');
  const ymdBlocks = ymd.parseInput(i+'');
  return [mdy.join(mdyBlocks), mdy.isValid(mdyBlocks), ymd.join(ymdBlocks), ymd.isValid(ymdBlocks)];
}));*/
