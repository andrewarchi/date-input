import React from 'react';
import Input from '@material-ui/core/Input';
import { mdy, ymd, delimPattern, sanitizeDelims } from './dateFormat';

class DateInput extends React.Component {
  state = {
    value: ''
  };

  setValue(value, valueMDY, valueYMD) {
    const parsedMDY = mdy.parseInput(valueMDY);
    const parsedYMD = ymd.parseInput(valueYMD);
    let parsedValue = '';
    if (parsedMDY.validYear) {
      if (parsedYMD.validYear) {
        parsedValue = sanitizeDelims(value);
      }
      else {
        parsedValue = mdy.join(parsedMDY);
      }
    }
    else {
      parsedValue = ymd.join(parsedYMD);
    }

    this.setState({ value: parsedValue });
  }

  handleChange = e => {
    this.setValue(e.target.value, e.target.value, e.target.value);
  }

  handlePaste = e => {
    if (this.state.value === '' || (e.target.selectionStart === 0 && e.target.selectionEnd === e.target.value.length)) {
      const clipboard = e.clipboardData.getData('Text');
      this.setValue(clipboard, mdy.parsePaste(clipboard), ymd.parsePaste(clipboard));
    }
    e.preventDefault();
  }

  handleKeyDown = e => {
    const { value, selectionStart, selectionEnd } = e.target;
    if (selectionStart === selectionEnd) {
      const key = e.key;
      const code = e.keyCode;
      if (key === '/' || code === 111 || code === 191 || key === '-' || code === 109 || code === 189) {
        this.setValue(value, mdy.insertDelim(value, selectionStart), ymd.insertDelim(value, selectionStart));
      }
      else if (key === 'Backspace' || code === 8) {
        if (delimPattern.test(value.charAt(selectionStart - 1))) {
          this.setCaretPosition(e.target, selectionStart - 1);
        }
      }
      //e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowDown' || (e.keyCode >= 37 && e.keyCode <= 40)
      //e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27
    }
  }

  handleFocus = e => {
    e.target.select();
  }

  handleBlur = e => {
    const parsedMDY = mdy.parseInput(e.target.value);
    const parsedYMD = ymd.parseInput(e.target.value);
    if (parsedMDY.complete && !parsedYMD.complete) {
      this.setState({ value: mdy.join(parsedMDY) });
    }
    else if (parsedYMD.complete && !parsedMDY.complete) {
      this.setState({ value: ymd.join(parsedYMD) });
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
    return (
      <Input
        value={this.state.value}
        placeholder="M/D/Y or Y/M/D"
        onChange={this.handleChange}
        onPaste={this.handlePaste}
        onKeyDown={this.handleKeyDown}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
      />
    );
  }
}

export default DateInput;
