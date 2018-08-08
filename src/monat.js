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
    return this.formats.map(format => new MonatDate(format, blocks).toComplete()).filter(date => date.isValidComplete());
  }

  insertDelim(date, position) {
    const sanitized = sanitizeDelims(date);
    const sanitizedPosition = getSanitizedPosition(date, position);
    const parsed = this.formats.map(format => format.insertDelim(sanitized, sanitizedPosition))
      .filter(date => date && date.isValidPartial());
    if (parsed.length === 1) {
      this.userFormat = parsed[0].name;
    }
    return parsed;
  }

  setCompleted(value) {
    return this.formats.map(format => format.parseNumeric(value).toComplete()).filter(format => format.isValidPartial());
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
    this.name = format;
    this.yearIndex = this.blocks.indexOf('yyyy');
    this.monthIndex = this.blocks.indexOf('mm');
    this.dayIndex = this.blocks.indexOf('dd');
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
    return new MonatDate(this, blocks, year, month, day);
  }

  insertDelim(date, position) {
    const blocks = [];
    let blockPos = 0;
    for (let i = 0; i < this.blocks.length; i++) {
      const blockSize = this.blocks[i].length;
      let block;
      if (position > blockPos && position <= blockPos + blockSize) {
        const blockType = this.blocks[i];
        block = formatBlock(date.slice(blockPos, position), blockType, this.flexibleYear);
        if (!validBlock(block, blockType, blocks[this.yearIndex], blocks[this.monthIndex], blocks[this.dayIndex])) {
          return null;
        }
        blockPos = position;
      }
      else {
        block = date.slice(blockPos, blockPos + blockSize);
        blockPos += blockSize;
      }
      blocks.push(block);
    }
    return new MonatDate(this, blocks);
  }
}

class MonatDate {
  constructor(format, blocks, year, month, day) {
    this.format = format;
    this.blocks = blocks;
    this.year = year;
    this.month = month;
    this.day = day;
    if (!year && !month && !day && blocks) {
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
    return new MonatDate(format, blocks, this.year, this.month, this.day);
  }

  toComplete() {
    const blocks = this.blocks.map((block, i) =>
      formatBlock(block, this.format.blocks[i], this.format.flexibleYear)
    );
    return new MonatDate(this.format, blocks);
  }

  toString() {
    let formatted = this.blocks[0];
    for (let i = 1; i < this.blocks.length; i++) {
      if (this.blocks[i] !== '' || this.blocks[i - 1].length === this.format.blocks[i - 1].length) {
        formatted += this.format.delim + this.blocks[i];
      }
    }
    return formatted;
  }

  isValidComplete() {
    return validYear(this.year) && validMonth(this.month) && validDay(this.day, this.month, this.year);
  }

  isValidPartial() {
    return validYearPartial(this.year, this.format.flexibleYear) &&
      validMonthPartial(this.month) &&
      validDayPartial(this.day, this.month, this.year);
  }
}

function formatBlock(block, blockType, flexibleYear) {
  switch (blockType) {
    case 'yyyy': return flexibleYear ? expandYear(block) : block;
    case 'mm': return block.padStart(2, '0');
    case 'dd': return block.padStart(2, '0');
    default: return block;
  }
}

function formatYear(year, flexible, forceExpand = false) {
  if (flexible && (forceExpand || (year !== '20' && year !== '19'))) {
    return expandYear(year);
  }
  return year;
}

function expandYear(year) {
  if (year && year.length === 2) {
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

function validBlock(block, blockType, year, month, day) {
  switch (blockType) {
    case 'yyyy': return validYear(block);
    case 'mm': return validMonth(block);
    case 'dd': return validDay(block, month, year);
    default: return false;
  }
}

function validYear(year) {
  return year.length === 4 && +year >= 1900 && +year <= 2099;
}
function validMonth(month) {
  return month.length === 2 && +month >= 1 && +month <= 12;
}
function validDay(day, month, year) {
  return day.length === 2 && +day >= 1 && +day <= getDaysInMonth(+month, +year);
}

function validYearPartial(year, flexibleYear) {
  return !year || (flexibleYear && year.length <= 2) || (year.length <= 4 && /^20|^19|^[21]?$/.test(year));
}
function validMonthPartial(month) {
  return !month || month.length <= 1 || validMonth(month);
}
function validDayPartial(day, month, year) {
  return !day || day.length <= 1 || validDay(day, month, year);
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
