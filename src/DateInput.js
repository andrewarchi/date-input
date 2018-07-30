import React from 'react';
import Input from '@material-ui/core/Input';

const r = String.raw;
const componentFormats = {
  yyyy: [r`20\d\d|19\d\d`,       r`20\d|19\d`, r`20|19`, r`[21]`],
  yy:   [r`\d\d`,                r`\d`],
  mm:   [r`0[1-9]|1[0-2]`,       r`[01]`],
  dd:   [r`0[1-9]|[12]\d|3[01]`, r`[0-3]`],
  m:    [r`[1-9]`],
  d:    [r`[1-9]`]
};

class DateFormat {
  constructor(components, delim) {
    this.components = components;
    this.delim = delim;
    this.name = components.join(delim);
    this.length = components.join``.length;
    this.dateIndices = components.map(component => 'ymd'.indexOf(component[0]));
    this.formatPattern = `$1${delim}$2${delim}$3`;

    this.patterns = [];
    for (let len = 1; len <= this.length; len++) {
      const pattern = [];
      let patternLen = 0;
      for (const component of this.components) {
        if (patternLen === len) {
          pattern.push('');
          continue;
        }
        const componentIndex = Math.max(patternLen + component.length - len, 0);
        pattern.push(componentFormats[component][componentIndex]);
        patternLen += component.length;
      }
      this.patterns.push(new RegExp(`^(${pattern.join`)(`})$`));
    }
  }

  testEntire(date) {
    return date.length === this.length && this.patterns[this.length - 1].test(date);
  }

  test(date) {
    return date.length && date.length <= this.length && this.patterns[date.length - 1].test(date);
  }

  getFormatted(date) {
    return date.length && date.length <= this.length
      ? date.replace(this.patterns[date.length - 1], this.formatPattern)
      : date;
  }

  getDateParts(date) {
    if (!date.length || date.length > this.length) {
      return ['', '', ''];
    }
    const matches = date.match(this.patterns[date.length - 1]);
    const dateParts = ['0000', '00', '00'];
    for (let i = 0; i < this.components.length; i++) {
      dateParts[this.dateIndices[i]] = matches[i + 1];
    }
    const [year, month, day] = dateParts;
    return [this.getFullYear(year), month.padStart(2, '0'), day.padStart(2, '0')];
  }

  getDateString(date) {
    return this.getDateParts(date).join`-`;
  }

  getDate(date) {
    return new Date(this.getDateString(date));
  }

  getFullYear(year) {
    if (year.length !== 2) {
      return year.padStart(4, '0');
    }
    const maxYear = (new Date().getFullYear() % 100) + 10;
    return (year <= maxYear ? '20' : '19') + year;
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

class DateInput extends React.Component {
  state = {
    value: '',
    parsed: '',
    date: null,
    invalid: true,
    pristine: true,
    ambiguous: false,
    formats: dateFormats
  };

  getValue(elem) {
    return elem.value.replace(/[^\d]/g, '');
  }

  formatValue(elem, dateFormat) {
    const value = dateFormat.getFormatted(this.getValue(elem));
    elem.value = value;
    this.setState({ value });
  }

  getFormats(date) {
    const formats = dateFormats.filter(format => format.test(date));
    const formatted = formats.map(format => format.getFormatted(date));
    const ambiguous = formats.length >= 2 && !formatted.slice(1).every(f => f === formatted[0]);
    return { formats, formatted, ambiguous };
  }

  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  handleChange = e => {
    console.log(e.target.value)
    let value = this.getValue(e.target);
    const date = value;

    logFormats(date);

    const { formats, formatted, ambiguous } = this.getFormats(date);
    console.log(this.getFormats(date))
    if (!formats.length) {
      this.setState({ parsed: '', date: null, invalid: true, error: 'Invalid format' });
    }
    else if (!ambiguous) {
      value = formatted[0];
      const [ year, month, day ] = formats[0].getDateParts(date);
      const m = +month, d = +day;
      if ((d === 31 && (m === 4 || m === 6 || m === 9 || m === 11)) || (m === 2 && d > 29)) {
        this.setState({ parsed: '', date: null, invalid: true, error: 'Day is too large' });
      }
      else if (m === 2 && d === 29 && !this.isLeapYear(year)) {
        this.setState({ parsed: '', date: null, invalid: true, error: 'Not a leap year' });
      }
      else {
        this.setState({ parsed: value, date: formats[0].getDate(date), invalid: false, error: '' });
      }
    }
    else {
      console.log('Ambiguous formats');
      this.setState({ parsed: '', date: null, invalid: false, error: '' });
    }
    this.setState({ value, ambiguous, pristine: false });
    e.target.value = value;

    /*const endDelim = value.match(/[^\d]{2,}$/);
    if (endDelim && endDelim[0].length > 1) {
      this.setCaretPosition(e.target, value.length - endDelim[0].length + 1);
    }*/
  }

  handleKeyDown = e => {
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      console.log('number')
    }
    else if ((e.key === '/' || e.keyCode === 111 || e.keyCode === 191) || (e.key === '-' || e.keyCode === 109 || e.keyCode === 189)) {

    }
    else if (e.key === 'Backspace' || e.keyCode === 8) {
      if (e.target.selectionStart === e.target.selectionEnd && !/\d/.test(e.target.value[e.target.selectionStart-1])) {
        e.target.selectionStart--;
        e.target.selectionEnd--;
        e.preventDefault();
      }
    }
    //e.key === 'Tab' || e.keyCode === 9
    //e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowDown' || (e.keyCode >= 37 && e.keyCode <= 40)
    //e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27
  }

  handleFocus = e => {
    e.target.select();
  }

  handleBlur = e => {
    const dateValue = this.getValue(e.target);
    const formats = dateFormats.filter(format => format.testEntire(dateValue));
    if (formats.length === 1) {
      this.formatValue(e.target, formats[0]);
    }
  }

  setCaretPosition(elem, position) {
    if (elem.createTextRange) {
      const range = elem.createTextRange();
      range.move('character', position);
      range.select();
    }
    else if (elem.setSelectionRange) {
      elem.setSelectionRange(position, position);
    }
  }

  render() {
    const { value, parsed, date, invalid, pristine, ambiguous, error } = this.state;
    return <React.Fragment>
      <Input
        value={value}
        error={invalid && !pristine}
        placeholder="Enter a date"
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
      />
      <input type="date" />
      <p><strong>Parsed:</strong> {parsed}</p>
      <p><strong>Date:</strong> {date + ''}</p>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {ambiguous && <p style={{color: 'red'}}>Ambiguous</p>}
    </React.Fragment>
  }
}

console.log(dateFormats);

function logFormats(dateValue) {
  console.log(dateValue);
  console.log(dateFormats.map(format => {
    const test = format.test(dateValue);
    const name = format.name.padEnd(8);
    return test ? [
      name,
      format.getFormatted(dateValue).padEnd(11),
      format.length === dateValue.length ? 'complete' : 'partial'
    ].join`\t` : name;
  }).join`\n`);
}

export default DateInput;
