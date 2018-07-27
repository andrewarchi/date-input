import React from 'react';
import Input from '@material-ui/core/Input';

const r = String.raw;
const componentFormats = {
  yyyy: { patterns: [r`20\d\d|19\d\d`,       r`20\d|19\d`, r`20|19`, r`[21]`], format: y => y.padEnd(4, '0') },
  yy:   { patterns: [r`\d\d`,                r`\d`],                           format: y => getFullYear(y.padStart(2, '0')) },
  mm:   { patterns: [r`0[1-9]|1[0-2]`,       r`[01]`],                         format: m => m.padEnd(2, '0') },
  dd:   { patterns: [r`0[1-9]|[12]\d|3[01]`, r`[0-3]`],                        format: d => d.padEnd(2, '0') },
  m:    { patterns: [r`[1-9]`],                                                format: m => m.padStart(2, '0') },
  d:    { patterns: [r`[1-9]`],                                                format: d => d.padStart(2, '0') }
};

function getFullYear(year) {
  if (year.length !== 2) {
    return year.padStart(4, '0');
  }
  const maxYear = (new Date().getFullYear() % 100) + 10;
  return (year <= maxYear ? '20' : '19') + year;
}

class DateFormat {
  constructor(components, delim) {
    this.components = components;
    this.delim = delim;
    this.name = components.join(delim);
    this.length = components.join``.length;
    this.formatPattern = `$1${delim}$2${delim}$3`;
    this.patterns = this.initPatterns();
    this.dateIndices = this.initDateIndices(components);
  }

  initPatterns() {
    const patterns = [];
    for (let len = 1; len <= this.length; len++) {
      const pattern = [];
      let patternLen = 0;
      for (const component of this.components) {
        if (patternLen === len) {
          pattern.push('');
          continue;
        }
        const componentIndex = Math.max(patternLen + component.length - len, 0);
        pattern.push(componentFormats[component].patterns[componentIndex]);
        patternLen += component.length;
      }
      patterns.push(new RegExp(`^(${pattern.join`)(`})$`));
    }
    return patterns;
  }

  initDateIndices(components) {
    return components.map(component => {
      switch (component[0]) {
        case 'y': return 0;
        case 'm': return 1;
        case 'd': return 2;
        default: return 0;
      }
    });
  }

  test(date) {
    return date.length && date.length <= this.length && this.patterns[date.length - 1].test(date);
  }

  getFormatted(date) {
    return date.length && date.length <= this.length
      ? date.replace(this.patterns[date.length - 1], this.formatPattern)
      : date;
  }

  getDate(date) {
    return date.replace(this.patterns[date.length - 1], (...matches) => {
      const parsed = ['0000', '00', '00'];
      for (let i = 0; i < this.components.length; i++) {
        parsed[this.dateIndices[i]] = componentFormats[this.components[i]].format(matches[i + 1]);
      }
      return parsed.join`-`;
    });
  }
}

const dateFormats = [
  new DateFormat(['yyyy', 'mm', 'dd'], '-'),
  new DateFormat(['mm', 'dd', 'yyyy'], '/'),
  new DateFormat(['m', 'dd', 'yyyy'],  '/'),
  new DateFormat(['mm', 'd', 'yyyy'],  '/'),
  new DateFormat(['m', 'd', 'yyyy'],   '/'),
  new DateFormat(['mm', 'dd', 'yy'],   '/'),
  new DateFormat(['m', 'dd', 'yy'],    '/'),
  new DateFormat(['mm', 'd', 'yy'],    '/'),
  new DateFormat(['m', 'd', 'yy'],     '/')
];

console.log(dateFormats);

class DateInput extends React.Component {
  state = {
    value: '',
    invalid: true,
    pristine: true
  };

  handleChange = e => {
    const dateValue = e.target.value.replace(/[^\d]/g, '');

    console.log(dateValue);
    console.log(dateFormats.map(format => [
      format.test(dateValue),
      format.name.padEnd(8),
      (format.test(dateValue) ? format.getFormatted(dateValue) : '').padEnd(11),
      format.test(dateValue) ? (format.length === dateValue.length ? 'complete' : 'partial') : ''
    ].join`\t`).join`\n`);

    const matchedFormats = dateFormats.filter(format => format.test(dateValue))
    const uniqueFormats = [...new Set(matchedFormats.map(format => format.getFormatted(dateValue)))];
    const value = uniqueFormats.length === 1 ? uniqueFormats[0] : dateValue;
    if (matchedFormats.length === 1) {
      console.log(value, matchedFormats[0].getDate(dateValue));
    }

    e.target.value = value;
    const endDelim = value.match(/[^\d]{2,}$/);
    if (endDelim && endDelim[0].length > 1) {
      this.setCaretPosition(e.target, value.length - endDelim[0].length + 1);
    }

    this.setState({ value: value, invalid: value === dateValue, pristine: false });
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
    const { value, invalid, pristine } = this.state;
    return (
      <Input
        value={value}
        error={invalid && !pristine}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
      />
    );
  }
}

export default DateInput;
