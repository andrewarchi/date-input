const sanitizePattern = /[^\d]/g;
const delimPattern = /[/-]/g;

export class Monat {
  constructor(...formats) {
    this.formats = formats;
    this.delims = formats.map(f => f.delim).join``;
    this.userFormat = '';
  }

  parseNumeric(date) {
    const parsed = this.formats.map(format => format.parseNumeric(date)).filter(format => format.validYear());
    const parsedValue = parsed.length === 1 ? parsed[0].getFormatted() : sanitizeDelims(date);
    return parsedValue;
  }

  parseDelimited(date) {
    const blocks = date.split(delimPattern);
    if (blocks.length === 1) {
      return this.parseNumeric(date);
    }
    const parsedDates = this.formats.map(format => MonatDate.fromBlocks(format, blocks)).filter(date => date.isValid());
    return parsedDates.length === 1 ? parsedDates[0].getFormatted() : sanitizeDelims(date);
  }

  insertDelim(date, position, delim) {
    position = getSanitizedPosition(date, position);
    const sanitized = sanitizeDelims(date);
    const parsed = [];
    this.formats.forEach(format => {
      const delimited = format.insertDelim(sanitized, position);
      const parsedFormat = format.parseNumeric(delimited.value);
      if (delimited.validPosition) {
        parsed.push(parsedFormat);
      }
    });
    if (parsed.length === 1) {
      this.userFormat = parsed[0].id;
      return parsed[0].getFormatted();
    }
    else {
      const matched = parsed.filter(format => format.delim === delim);
      if (matched.length === 1) {
        this.userFormat = matched[0].id;
        return matched[0].getFormatted();
      }
    }
    return date;
  }

  setCompleted(value) {
    const parsed = this.formats.map(format => format.parseNumeric(value)).filter(format => format.validYear());
    if (parsed.length === 1) {
      return parsed[0].getFormatted();
    }
    return value;
  }

  isDelim(char) {
    return this.delims.includes(char);
  }
}

export class MonatFormat {
  constructor(blockFormats, delim, flexibleYear) {
    this.blockFormats = blockFormats;
    this.delim = delim;
    this.flexibleYear = flexibleYear;
    this.id = blockFormats.join(delim);
  }

  parseNumeric(input) {
    let value = sanitizeDelims(input);
    let year = '', month = '', day = '';
    const blocks = this.blockFormats.map(block => {
      switch (block) {
        case 'yyyy': [year, value] = parseYear(value, this.flexibleYear); return year;
        case 'mm': [month, value] = parseMonth(value); return month;
        case 'dd': [day, value] = parseDay(value, +month, +year); return day;
        default: return '';
      }
    });
    return new MonatDate(this, blocks, year, month, day);
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
    return this.parseNumeric(value);
  }

  insertDelim(date, position) {
    let blockPos = 0;
    for (let i = 0; i < this.blockFormats.length; i++) {
      const block = this.blockFormats[i];
      if (position > blockPos && position < blockPos + block.length &&
          block !== 'yyyy' && date.slice(blockPos, position) > 0) {
        const paddedBlock = date.slice(blockPos, position).padStart(block.length, '0');
        return { value: date.slice(0, blockPos) + paddedBlock + date.slice(position), validPosition: true };
      }
      blockPos += block.length;
    }
    return { value: date, validPosition: false };
  }

  joinBlocks(blocks) {
    let formatted = blocks[0];
    for (let i = 1; i < blocks.length; i++) {
      if (blocks[i] !== '' || blocks[i - 1].length === this.blockFormats[i - 1].length) {
        formatted += this.delim + blocks[i];
      }
    }
    return formatted;
  }
}

class MonatDate {
  constructor(format, blocks, year, month, day) {
    this.format = format;
    this.blocks = blocks;
    this.year = year;
    this.month = month;
    this.day = day;
  }

  getFormatted() {
    return this.format.joinBlocks(this.blocks);
  }

  isValid() {
    return this.month.length === 2 && this.day.length === 2 && this.year.length === 4 &&
      this.month > 0 && this.month <= 12 &&
      this.day > 0 && this.day <= getDaysInMonth(+this.month, +this.year) &&
      this.year >= 1900 && this.year <= 2999;
  }

  isComplete() {
    return this.blocks.join``.length === this.format.blockFormats.join``.length && this.value === '';
  }

  validYear() {
    return (this.format.flexibleYear && this.year.length < 3) || /^20|^19|^[21]?$/.test(this.year);
  }

  static fromBlocks(format, blocks) {
    let year = '', month = '', day = '';
    const formattedBlocks = blocks.map((block, i) => {
      switch (format.blockFormats[i]) {
        case 'yyyy': year = formatYear(block, format.flexibleYear); return year;
        case 'mm': month = block.padStart(2, '0'); return month;
        case 'dd': day = block.padStart(2, '0'); return day;
        default: return block;
      }
    });
    return new MonatDate(format, formattedBlocks, year, month, day);
  }
}

function formatYear(year, flexible) {
  if (flexible && year.length === 2 && year !== '20' && year !== '19') {
    const maxYear = (new Date().getFullYear() % 100) + 10;
    return (year <= maxYear ? '20' : '19') + year;
  }
  return year;
}

function parseYear(input, flexible) {
  if (flexible && input.length === 2) {
    return [formatYear(input, flexible), ''];
  }
  return [input.slice(0, 4), input.slice(4)];
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

function getDaysInMonth(month, year) {
  const feb = !year || isLeapYear(year) ? 29 : 28;
  return [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
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

export const MDY = new MonatFormat(['mm', 'dd', 'yyyy'], '/', true);
export const YMD = new MonatFormat(['yyyy', 'mm', 'dd'], '-', false);
