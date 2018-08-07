const sanitizePattern = /[^\d]/g;
const delimPattern = /[/-]/g;

export class Monat {
  constructor(...formats) {
    this.formats = formats;
    this.delims = formats.map(f => f.delim).join``;
    this.userFormat = '';
  }

  parseNumeric(date) {
    return this.formats.map(format => format.parseNumeric(date)).filter(format => format.isValidPartial());
  }

  parseDelimited(date) {
    const blocks = date.split(delimPattern);
    if (blocks.length === 1) {
      return this.parseNumeric(date);
    }
    return this.formats.map(format => new MonatDate(date, format, blocks).toComplete()).filter(date => date.isValidPartial());
  }

  insertDelim(date, position) {
    const sanitized = sanitizeDelims(date);
    const sanitizedPosition = getSanitizedPosition(date, position);
    const parsed = this.formats.map(format => format.insertDelim(sanitized, sanitizedPosition)).filter(date => date.isValidPartial());
    if (parsed.length === 1) {
      this.userFormat = parsed[0].id;
    }
    return parsed;
  }

  setCompleted(value) {
    return this.formats.map(format => format.parseNumeric(value)).filter(format => format.isValidPartial());
  }

  isDelim(char) {
    return this.delims.includes(char);
  }
}

export class MonatFormat {
  constructor(format, delim, flexibleYear) {
    this.blocks = format.split(delim);
    this.delim = delim;
    this.flexibleYear = flexibleYear;
    this.id = format;
  }

  parseNumeric(input) {
    let value = sanitizeDelims(input);
    let year = '', month = '', day = '';
    const blocks = this.blocks.map(block => {
      switch (block) {
        case 'yyyy': [year, value] = parseYear(value, this.flexibleYear); return year;
        case 'mm': [month, value] = parseMonth(value); return month;
        case 'dd': [day, value] = parseDay(value, +month, +year); return day;
        default: return '';
      }
    });
    return new MonatDate(input, this, blocks, year, month, day);
  }

  insertDelim(date, position) {
    const blocks = [];
    let blockPos = 0;
    for (let i = 0; i < this.blocks.length; i++) {
      const blockSize = this.blocks[i].length;
      if (position > blockPos && position <= blockPos + blockSize) {
        const block = date.slice(blockPos, position);
        const formatted = this.blocks[i] === 'yyyy'
          ? (this.flexibleYear ? expandYear(block) : block)
          : block.padStart(blockSize, '0');
        blocks.push(formatted);
        blockPos = position;
      }
      else {
        blocks.push(date.slice(blockPos, blockPos + blockSize));
        blockPos += blockSize;
      }
    }
    return new MonatDate(date, this, blocks);
  }
}

class MonatDate {
  constructor(value, format, blocks, year, month, day) {
    this.value = value;
    this.format = format;
    this.blocks = blocks;
    this.year = year;
    this.month = month;
    this.day = day;
    if (!year && !month && !day) {
      blocks.forEach((block, i) => {
        switch (format.blocks[i]) {
          case 'yyyy': this.year = block; return;
          case 'mm': this.month = block; return;
          case 'dd': this.day = block; return;
          default:
        }
      })
    }
  }

  toFormat(format) {
    const blocks = format.blocks.map(block => {
      switch (block) {
        case 'yyyy': return this.year;
        case 'mm': return this.month;
        case 'dd': return this.day;
        default: return '';
      }
    });
    return new MonatDate(this.value, format, blocks, this.year, this.month, this.day);
  }

  toComplete() {
    let year = '', month = '', day = '';
    const blocks = this.blocks.map((block, i) => {
      switch (this.format.blocks[i]) {
        case 'yyyy': year = this.format.flexibleYear ? expandYear(block) : block; return year;
        case 'mm': month = this.month.padStart(2, '0'); return month;
        case 'dd': day = this.day.padStart(2, '0'); return day;
        default: return block;
      }
    });
    return new MonatDate(this.format, blocks, year, month, day);
  }

  toString() {
    if (!this.format) { return this.value; } // TEMP
    let formatted = this.blocks[0];
    for (let i = 1; i < this.blocks.length; i++) {
      if (this.blocks[i] !== '' || this.blocks[i - 1].length === this.format.blocks[i - 1].length) {
        formatted += this.format.delim + this.blocks[i];
      }
    }
    return formatted;
  }

  isValidComplete() {
    const month = +this.month;
    const day = +this.day;
    const year = +this.year;
    return this.month.length === 2 && month >= 1 && month <= 12 &&
      this.day.length === 2 && day >= 1 && day <= getDaysInMonth(month, year) &&
      this.year.length === 4 && year >= 1900 && year <= 2099;
  }

  isValidPartial() {
    return (this.format.flexibleYear && this.year.length < 3) || /^20|^19|^[21]?$/.test(this.year);
  }
}

function expandYear(year) {
  if (year && year.length === 2) {
    const maxYear = (new Date().getFullYear() % 100) + 10;
    return (year <= maxYear ? '20' : '19') + year;
  }
  return year;
}

function formatYear(year, flexible, forceExpand = false) {
  if (flexible && (forceExpand || (year !== '20' && year !== '19'))) {
    return expandYear(year);
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

export const MDY = new MonatFormat('mm/dd/yyyy', '/', true);
export const YMD = new MonatFormat('yyyy-mm-dd', '-', false);
