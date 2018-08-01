const sanitizePattern = /[^\d]/g;
const delimPattern = /[/-]/g;

class DateFormat {
  constructor(blocks, delim) {
    this.blocks = blocks;
    this.blockSizes = blocks.map(b => b.length);
    this.delim = delim;
  }

  parseInput(value) {
    value = sanitizeDelims(value);
    let year, month, day;
    return this.blocks.map((block, i) => {
      switch (block) {
        case 'yyyy': [year, value] = parseYear(value, i === this.blocks.length - 1); return year;
        case 'mm': [month, value] = parseMonth(value); return month;
        case 'dd': [day, value] = parseDay(value, +month, +year); return day;
        default: return '';
      }
    });
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
    let blockPos = 0;
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      if (position > blockPos && position < blockPos + block.length &&
          block !== 'yyyy' && sanitized.slice(blockPos, position) > 0) {
        const paddedBlock = sanitized.slice(blockPos, position).padStart(block.length, '0');
        return sanitized.slice(0, blockPos) + paddedBlock + sanitized.slice(position);
      }
      blockPos += block.length;
    }
    return sanitized;
  }

  parsePaste(value) {
    let parsed = sanitizeDelims(value);
    let sanitizedCount = 0;
    for (let i = 0; i < value.length; i++) {
      if (delimPattern.test(value.charAt(i))) {
        const delimited = this.insertDelim(parsed, i - sanitizedCount);
        if (delimited !== parsed) {
          sanitizedCount += delimited.length - parsed.length - 1;
          parsed = delimited;
        }
        else {
          sanitizedCount++;
        }
      }
      else if (sanitizePattern.test(value.charAt(i))) {
        sanitizedCount++;
      }
    }
    return parsed;
  }
}

export const mdy = new DateFormat(['mm', 'dd', 'yyyy'], '/');
export const ymd = new DateFormat(['yyyy', 'mm', 'dd'], '-');

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
  return value.replace(sanitizePattern, '');
}

function getSanitizedPosition(value, position) {
  return position - (value.slice(0, position).match(sanitizePattern) || []).length;
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
  return [...a, insertedMDY, mdy.join(mdy.parseInput(insertedMDY)), insertedYMD, ymd.join(ymd.parseInput(insertedYMD))];
}));
