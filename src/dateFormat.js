const sanitizePattern = /[^\d]/g;
export const delimPattern = /[/-]/g;

export class Monat {
  constructor(...formats) {
    this.formats = formats;
  }
}

export class MonatFormat {
  constructor(blockFormats, delim, flexibleYear) {
    this.blockFormats = blockFormats;
    this.delim = delim;
    this.flexibleYear = flexibleYear;
    this.id = blockFormats.join(delim);
  }

  parse(input) {
    let value = sanitizeDelims(input);
    let year = '', month = '', day = '';
    const blocks = this.blockFormats.map((block, i) => {
      switch (block) {
        case 'yyyy': [year, value] = parseYear(value); return year;
        case 'mm': [month, value] = parseMonth(value); return month;
        case 'dd': [day, value] = parseDay(value, +month, +year); return day;
        default: return '';
      }
    });
    return new ParsedDate(this.blockFormats, this.delim, this.flexibleYear, input, blocks, year, month, day);
  }

  parseDelimited(input) {
    const delims = getDelimPositions(input);
    let value = input;
    let offset = 0;
    for (const position of delims) {
      const delimited = this.insertDelim(value, position + offset).value;
      offset += delimited.length - value.length;
      value = delimited;
    }
    return this.parse(value);
  }

  insertDelim(value, position) {
    return insertDelim(sanitizeDelims(value), getSanitizedPosition(value, position), this.blockFormats);
  }
}

class ParsedDate {
  constructor(blockFormats, delim, flexibleYear, value, blocks, year, month, day) {
    this.blockFormats = blockFormats;
    this.delim = delim;
    this.flexibleYear = flexibleYear;
    this.blocks = blocks;
    this.year = year;
    this.month = month;
    this.day = day;
    this.validYear = (this.flexibleYear && year.length < 3) || /^20|^19|^[21]?$/.test(year);
    this.complete = blocks.join``.length === this.blockFormats.join``.length && value === '';
  }

  format() {
    return this.join(this.blocks.map((block, i) => {
      switch (this.blockFormats[i]) {
        case 'yyyy': return formatYear(block, this.flexibleYear);
        case 'mm':
        case 'dd': return block.padStart(2, '0');
        default: return block;
      }
    }))
  }

  join(blocks) {
    let formatted = this.blocks[0];
    for (let i = 1; i < this.blocks.length; i++) {
      if (this.blocks[i] !== '' || this.blocks[i - 1].length === this.blockFormats[i - 1].length) {
        formatted += this.delim + this.blocks[i];
      }
    }
    return formatted;
  }

  isValid() {
    return this.month.length === 2 && this.day.length === 2 && this.year.length === 4 &&
      this.month > 0 && this.month <= 12 &&
      this.day > 0 && this.day <= getDaysInMonth(+this.month, +this.year) &&
      this.year >= 1900 && this.year <= 2999;
  }
}

function formatYear(year, flexible) {
  if (flexible && year.length === 2 && year !== '20' && year !== '19') {
    const maxYear = (new Date().getFullYear() % 100) + 10;
    return (year <= maxYear ? '20' : '19') + year;
  }
  return year;
}

function parseYear(input) {
  return [input.slice(0, 4), input.slice(4)];
}

function parseMonth(input) {
  if (input.charAt(0) > 1 || input.slice(0, 2) > 12) {
    return [input.charAt(0), input.slice(1)];
  }
  return [input.slice(0, 2), input.slice(2)];
}

function parseDay(input, month, year) {
  const maxDay = getDaysInMonth(month, year);
  const maxDigit = month === 2 ? 2 : 3;
  if (input.charAt(0) > maxDigit || input.slice(0, 2) > maxDay) {
    return [input.charAt(0), input.slice(1)];
  }
  return [input.slice(0, 2), input.slice(2)];
}

function getDaysInMonth(month, year) {
  const feb = !year || isLeapYear(year) ? 29 : 28;
  return [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function insertDelim(value, position, blockFormats) {
  let blockPos = 0;
  for (let i = 0; i < blockFormats.length; i++) {
    const block = blockFormats[i];
    if (position > blockPos && position < blockPos + block.length &&
        block !== 'yyyy' && value.slice(blockPos, position) > 0) {
      const paddedBlock = value.slice(blockPos, position).padStart(block.length, '0');
      return { value: value.slice(0, blockPos) + paddedBlock + value.slice(position), validPosition: true };
    }
    blockPos += block.length;
  }
  return { value, validPosition: false };
}

export function sanitizeDelims(value) {
  return value.replace(sanitizePattern, '');
}

function getSanitizedPosition(value, position) {
  return position - (value.slice(0, position).match(sanitizePattern) || []).length;
}

function getDelimPositions(value) {
  const delims = [];
  let offset = 0;
  for (let i = 0; i < value.length; i++) {
    if (delimPattern.test(value.charAt(i))) {
      delims.push(i - offset++);
    }
    else if (sanitizePattern.test(value.charAt(i))) {
      offset++;
    }
  }
  return delims;
}

/*console.log([...Array(999999)].map((a, i) => {
  const mdyBlocks = mdy.parseInput(i+'');
  const ymdBlocks = ymd.parseInput(i+'');
  return [mdy.join(mdyBlocks), mdy.isValid(mdyBlocks), ymd.join(ymdBlocks), ymd.isValid(ymdBlocks)];
}));*/

/*console.log([
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
}));*/

/*const mdy = new DateParser(['mm', 'dd', 'yyyy'], '/', true);
const ymd = new DateParser(['yyyy', 'mm', 'dd'], '-', false);
console.log([
  ['1/2/34', '1934-1-2'],
  ['01/02/1934', '1934-01-02'],
  ['1/23/45', '1945-1-23'],
  ['12/3/45', '1945-12-3'],
  ['12/31/18', '2018-12-31'],
  ['02/12/2018', '2018-02-12'],
  ['232018', '201823'],
  ['2/3/2018', '2018-02-03']
].map(a => {
  const insertedMDY = mdy.parsePaste(a[0]);
  const insertedYMD = ymd.parsePaste(a[1]);
  return [...a, insertedMDY, mdy.parse(insertedMDY).format(), insertedYMD, ymd.parse(insertedYMD).format()];
}));*/
