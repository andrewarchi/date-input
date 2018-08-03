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

  insertDelim(date, position) {
    const sanitized = sanitizeDelims(date);
    const sanitizedPosition = getSanitizedPosition(date, position);
    const parsed = this.formats.map(format => format.insertDelim(sanitized, sanitizedPosition)).filter(date => date.isValid());
    if (parsed.length === 1) {
      this.userFormat = parsed[0].id;
      return parsed[0].getFormatted();
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

  insertDelim(date, position) {
    const blocks = [];
    let blockPos = 0;
    for (let i = 0; i < this.blockFormats.length; i++) {
      const blockSize = this.blockFormats[i].length;
      if (position > blockPos && position <= blockPos + blockSize) {
        const block = date.slice(blockPos, position);
        blocks.push(this.blockFormats[i] === 'yyyy' ? formatYear(block, this.flexibleYear, true) : block.padStart(blockSize, '0'));
        blockPos = position;
      }
      else {
        blocks.push(date.slice(blockPos, blockPos + blockSize));
        blockPos += blockSize;
      }
    }
    return MonatDate.fromBlocks(this, blocks);
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
    return (this.month === '' || (this.month >= 1 && this.month <= 12)) &&
      (this.day === '' || (this.day >= 1 && this.day <= getDaysInMonth(+this.month, +this.year))) &&
      (this.year === '' || (this.year >= 1900 && this.year <= 2099));
  }

  isValidComplete() {
    return this.month.length === 2 && this.day.length === 2 && this.year.length === 4 && this.isValid();
  }

  validYear() {
    return (this.format.flexibleYear && this.year.length < 3) || /^20|^19|^[21]?$/.test(this.year);
  }

  static fromBlocks(format, blocks) {
    let year = '', month = '', day = '';
    const formattedBlocks = blocks.map((block, i) => {
      switch (format.blockFormats[i]) {
        case 'yyyy': year = formatYear(block, format.flexibleYear); return year;
        case 'mm': month = formatMonthDay(block); return month;
        case 'dd': day = formatMonthDay(block); return day;
        default: return block;
      }
    });
    return new MonatDate(format, formattedBlocks, year, month, day);
  }
}

function formatYear(year, flexible, forceExpand = false) {
  if (flexible && year.length === 2 && (forceExpand || (year !== '20' && year !== '19'))) {
    const maxYear = (new Date().getFullYear() % 100) + 10;
    return (year <= maxYear ? '20' : '19') + year;
  }
  return year;
}

function formatMonthDay(block) {
  return block !== '' ? block.padStart(2, '0') : block;
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

function sanitizeDelims(value) {
  return value.replace(sanitizePattern, '');
}

function getSanitizedPosition(value, position) {
  return position - (value.slice(0, position).match(sanitizePattern) || []).length;
}

export const MDY = new MonatFormat(['mm', 'dd', 'yyyy'], '/', true);
export const YMD = new MonatFormat(['yyyy', 'mm', 'dd'], '-', false);
