import React from 'react';
import Input from '@material-ui/core/Input';

const r = String.raw;
const yyyy = r`(20\d\d|19\d\d)`;
const yy   = r`(\d\d)`;
const mm   = r`(0[1-9]|1[0-2])`;
const dd   = r`(0[1-9]|[12]\d|3[01])`;
const m    = r`([1-9])`;
const d    = r`([1-9])`;

const re = (...args) => new RegExp(`^${String.raw(...args)}$`);
const formats = [
  { name: 'YYYY-MM-DD', pattern: re`${yyyy}${mm}${dd}`, format: '$1-$2-$3', length: 8 },
  { name: 'MM/DD/YYYY', pattern: re`${mm}${dd}${yyyy}`, format: '$1/$2/$3', length: 8 },
  { name: 'M/DD/YYYY',  pattern: re`${m}${dd}${yyyy}`,  format: '$1/$2/$3', length: 7 },
  { name: 'MM/D/YYYY',  pattern: re`${mm}${d}${yyyy}`,  format: '$1/$2/$3', length: 7 },
  { name: 'M/D/YYYY',   pattern: re`${m}${d}${yyyy}`,   format: '$1/$2/$3', length: 6 },
  { name: 'MM/DD/YY',   pattern: re`${mm}${dd}${yy}`,   format: '$1/$2/$3', length: 6 },
  { name: 'M/DD/YY',    pattern: re`${m}${dd}${yy}`,    format: '$1/$2/$3', length: 5 },
  { name: 'MM/D/YY',    pattern: re`${mm}${d}${yy}`,    format: '$1/$2/$3', length: 5 },
  { name: 'M/D/YY',     pattern: re`${m}${d}${yy}`,     format: '$1/$2/$3', length: 4 }
];

class DateInput extends React.Component {
  state = {
    value: ''
  };

  handleChange = e => {
    const value = e.target.value.replace(/[^\d]/g, '');
    for (const format of formats) {
      if (value.length === format.length && format.pattern.test(value)) {
        console.log(format.name, '\t', value.replace(format.pattern, format.format));
        e.target.value = value.replace(format.pattern, format.format);
        break;
      }
      else if (value.length > format.length) {
        e.target.value = value;
        break;
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
