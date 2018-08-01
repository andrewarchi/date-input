import React from 'react';
import Input from '@material-ui/core/Input';
import { DateParser, delimPattern, sanitizeDelims } from './dateFormat';

class DateInput extends React.Component {
  state = {
    value: ''
  };

  formats = [
    new DateParser(['mm', 'dd', 'yyyy'], '/', true),
    new DateParser(['yyyy', 'mm', 'dd'], '-', false)
  ];

  setValue(value, transform) {
    const parsed = this.formats.map(format => transform(format, value)).filter(format => format.validYear);
    const parsedValue = parsed.length === 1 ? parsed[0].format() : sanitizeDelims(value);
    this.setState({ value: parsedValue });
  }

  handleChange = e => {
    this.setValue(e.target.value, (format, value) => format.parse(value));
  }

  handlePaste = e => {
    if (this.state.value === '' || (e.target.selectionStart === 0 && e.target.selectionEnd === e.target.value.length)) {
      const clipboard = e.clipboardData.getData('Text');
      this.setValue(clipboard, (format, value) => format.parse(format.parsePaste(value)));
    }
    e.preventDefault();
  }

  handleKeyDown = e => {
    const { value, selectionStart, selectionEnd } = e.target;
    if (selectionStart === selectionEnd) {
      const key = e.key;
      const code = e.keyCode;
      if (key === '/' || code === 111 || code === 191 || key === '-' || code === 109 || code === 189) {
        this.setValue(value, (format, value) => format.parse(format.insertDelim(value, selectionStart)));
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
    const parsed = this.formats.map(format => format.parse(e.target.value)).filter(format => format.complete);
    if (parsed.length === 1) {
      this.setState({ value: parsed[0].format() });
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
