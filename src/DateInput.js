import React from 'react';
import Input from '@material-ui/core/Input';

const r = String.raw;
const segmentFormats = {
  yyyy: r`(20\d\d|19\d\d)`,
  yy:   r`(\d\d)`,
  mm:   r`(0[1-9]|1[0-2])`,
  dd:   r`(0[1-9]|[12]\d|3[01])`,
  m:    r`([1-9])`,
  d:    r`([1-9])`
};

class DateFormat {
  constructor(segments, delim, length) {
    this.segments = segments;
    this.delim = delim;
    this.length = length;
    this.pattern = new RegExp('^' + segments.map(s => segmentFormats[s]).join`` + '$');
    this.replacePattern = `$1${delim}$2${delim}$3`;
    this.name = segments.join(delim);
  }

  test(date) {
    return this.pattern.test(date);
  }

  getFormatted(date) {
    return date.replace(this.pattern, this.replacePattern);
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


console.log(dateFormats)
class DateInput extends React.Component {
  state = {
    value: ''
  };

  handleChange = e => {
    const dateValue = e.target.value.replace(/[^\d]/g, '');
    console.log(dateValue);
    for (const format of dateFormats) {
      if (format.test(dateValue)) {
        console.log(format.name, '\t', format.getFormatted(dateValue));
        e.target.value = format.getFormatted(dateValue);
      }
    }
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
