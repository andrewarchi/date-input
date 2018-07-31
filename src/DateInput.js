import React from 'react';
import Input from '@material-ui/core/Input';
import { MDY, YMD } from './dateFormat';

const mdy = new MDY();
const ymd = new YMD();

class DateInput extends React.Component {
  state = {
    value: '',
    valueMDY: '',
    valueYMD: ''
  };


  handleChange = e => {
    console.log(e.target.value);

    const value = e.target.value.replace(/[^\d]/g, '');
    const valueMDY = mdy.join(mdy.parseInput(e.target.value));
    const valueYMD = ymd.join(ymd.parseInput(e.target.value));

    this.setState({ value, valueMDY, valueYMD });
  }

  handleKeyDown(format) {
    return e => {
      if (e.target.selectionStart === e.target.selectionEnd) {
        if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
          // Number
        }
        if (e.key === '/' || e.keyCode === 111 || e.keyCode === 191 ||
            e.key === '-' || e.keyCode === 109 || e.keyCode === 189) {
          const delimited = format.insertDelim(e.target.value, e.target.selectionStart);
          const valueMDY = mdy.join(mdy.parseInput(delimited));
          const valueYMD = ymd.join(ymd.parseInput(delimited));
          if (delimited !== e.target.value) {
            this.setState({ value: delimited, valueMDY, valueYMD });
          }
        }
        else if (e.key === 'Backspace' || e.keyCode === 8) {
          if (/[^\d]/.test(e.target.value.charAt(e.target.selectionStart-1))) {
            e.target.selectionStart--;
            e.target.selectionEnd--;
          }
        }
        //e.key === 'Tab' || e.keyCode === 9
        //e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowDown' || (e.keyCode >= 37 && e.keyCode <= 40)
        //e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27
      }
    }
  }

  handleFocus = e => {
    e.target.select();
  }

  handleBlur = e => {
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
    const { value, valueMDY, valueYMD } = this.state;
    return <React.Fragment>
      <Input value={value} placeholder="Unformatted" onFocus={this.handleFocus} onBlur={this.handleBlur} onChange={this.handleChange} /> &nbsp;
      <Input value={valueMDY} placeholder="MM/DD/YYYY" onFocus={this.handleFocus} onBlur={this.handleBlur} onChange={this.handleChange} onKeyDown={this.handleKeyDown(mdy)} /> &nbsp;
      <Input value={valueYMD} placeholder="YYYY-MM-DD" onFocus={this.handleFocus} onBlur={this.handleBlur} onChange={this.handleChange} onKeyDown={this.handleKeyDown(ymd)} />
    </React.Fragment>
  }
}

export default DateInput;
