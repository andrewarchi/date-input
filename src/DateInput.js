import React from 'react';
import Input from '@material-ui/core/Input';
import { Monat, MDY, YMD } from './monat';

class DateInput extends React.Component {
  monat = new Monat(MDY, YMD);
  state = {
    value: '',
    savedValue: ''
  };

  handleChange = e => {
    this.setState({ value: this.monat.parseNumeric(e.target.value).getFormatted() });
  }

  handlePaste = e => {
    if (this.state.value === '' || (e.target.selectionStart === 0 && e.target.selectionEnd === e.target.value.length)) {
      const clipboard = e.clipboardData.getData('Text');
      this.setState({ value: this.monat.parseDelimited(clipboard).getFormatted() });
    }
    e.preventDefault();
  }

  handleKeyDown = e => {
    const { value, selectionStart, selectionEnd } = e.target;
    if (selectionStart === selectionEnd) {
      const key = e.key;
      const code = e.keyCode;
      if (key === '/' || code === 111 || code === 191 || key === '-' || code === 109 || code === 189) {
        this.setState({ value: this.monat.insertDelim(value, selectionStart).getFormatted() });
        e.preventDefault();
      }
      else if (key === 'Backspace' || code === 8) {
        if (this.monat.isDelim(value.charAt(selectionStart - 1))) {
          this.setCaretPosition(e.target, selectionStart - 1);
        }
      }
      else if (key === 'Escape' || key === 'Esc' || code === 27) {
        this.setState({ value: this.state.savedValue });
      }
      //key === 'ArrowUp' || code === 38
      //key === 'ArrowDown' || code === 40
    }
  }

  handleFocus = e => {
    e.target.select();
    this.setState({ savedValue: this.state.value });
  }

  handleBlur = e => {
    this.setState({ value: this.monat.setCompleted(e.target.value).getFormatted() });
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
        placeholder="M/D/Y or Y-M-D"
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
