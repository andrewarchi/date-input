import React from 'react';
import Input from '@material-ui/core/Input';

const r = String.raw;
const segmentFormats = {
  yyyy: [r`20\d\d|19\d\d`,       r`20\d|19\d`, r`20|19`, r`[21]`],
  yy:   [r`\d\d`,                r`\d`],
  mm:   [r`0[1-9]|1[0-2]`,       r`[01]`],
  dd:   [r`0[1-9]|[12]\d|3[01]`, r`[0-3]`],
  m:    [r`[1-9]`],
  d:    [r`[1-9]`],
};

class DateFormat {
  constructor(segments, delim, length) {
    this.segments = segments;
    this.delim = delim;
    this.length = length;
    this.name = segments.join(delim);
    this.replacePattern = `$1${delim}$2${delim}$3`;
    this.initPatterns();
  }

  initPatterns() {
    const patterns = [];
    for (let len = 1; len <= this.length; len++) {
      const pattern = [];
      let patternLen = 0;
      for (const segment of this.segments) {
        if (patternLen === len) {
          pattern.push('');
          continue;
        }
        const segmentIndex = Math.max(patternLen + segment.length - len, 0);
        pattern.push(segmentFormats[segment][segmentIndex]);
        patternLen += segment.length;
      }
      patterns.push(new RegExp(`^(${pattern.join`)(`})$`));
    }
    this.patterns = patterns;
  }

  test(date) {
    return date.length && date.length <= this.length
      ? this.patterns[date.length - 1].test(date)
      : false;
  }

  getFormatted(date) {
    return date.length && date.length <= this.length
      ? date.replace(this.patterns[date.length - 1], this.replacePattern)
      : date;
  }
}

const dateFormats = [
  new DateFormat(['yyyy', 'mm', 'dd'], '-', 8),
  new DateFormat(['mm', 'dd', 'yyyy'], '/', 8),
  new DateFormat(['m', 'dd', 'yyyy'],  '/', 7),
  new DateFormat(['mm', 'd', 'yyyy'],  '/', 7),
  new DateFormat(['m', 'd', 'yyyy'],   '/', 6),
  new DateFormat(['mm', 'dd', 'yy'],   '/', 6),
  new DateFormat(['m', 'dd', 'yy'],    '/', 5),
  new DateFormat(['mm', 'd', 'yy'],    '/', 5),
  new DateFormat(['m', 'd', 'yy'],     '/', 4)
];

console.log(dateFormats);

class DateInput extends React.Component {
  state = {
    value: ''
  };

  handleChange = e => {
    const dateValue = e.target.value.replace(/[^\d]/g, '');

    console.log(dateValue);
    console.log(dateFormats.map(format => [
      format.test(dateValue),
      format.name.padEnd(8),
      (format.test(dateValue) ? format.getFormatted(dateValue) : '').padEnd(8),
      format.test(dateValue) ? (format.length === dateValue.length ? 'complete' : 'partial') : ''
    ].join`\t`).join`\n`);

    const formats = dateFormats
      .filter(format => format.test(dateValue))
      .map(format => format.getFormatted(dateValue))
      .reduce((acc, curr) => acc.includes(curr) ? acc : [...acc, curr], []);
    e.target.value = formats.length === 1 ? formats[0] : dateValue;
    console.log(formats);

    this.setState({ value: e.target.value });
  }

  handleKeyDown = e => {
    if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
      this.setState({ currentValue: this.state.savedValue, cursorPosition: 0 });
      return;
    }
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
    }
    else {
      //e.preventDefault();
      return;
    }
  }

  handleFocus = e => {
    e.target.select();
  }

  setCaretPosition(elem, caretPos) {
    if (elem.createTextRange) {
      const range = elem.createTextRange();
      range.move('character', caretPos);
      range.select();
    }
    else if (elem.setSelectionRange) {
      elem.setSelectionRange(caretPos, caretPos);
    }
  }

  render() {
    const { value } = this.state;
    return (
      <Input
        value={value}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
      />
    );
  }
}

export default DateInput;
