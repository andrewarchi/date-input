import React from 'react';
import Input from '@material-ui/core/Input';
import { DateParser, delimPattern, sanitizeDelims } from './dateFormat';

class DateInput extends React.Component {
  state = {
    value: '',
    savedValue: '',
    userFormat: ''
  };

  formats = [
    new DateParser(['mm', 'dd', 'yyyy'], '/', true),
    new DateParser(['yyyy', 'mm', 'dd'], '-', false)
  ];

  setValue(value, keepDelims = false) {
    const parsed = this.formats.map(format => format.parse(value, keepDelims)).filter(format => format.validYear);
    const parsedValue = parsed.length === 1 ? parsed[0].format() : sanitizeDelims(value);
    this.setState({ value: parsedValue });
  }

  insertDelim(value, position, formatName) {
    const parsed = [];
    this.formats.forEach(format => {
      const delimited = format.insertDelimSanitized(value, position);
      const parsedFormat = format.parse(delimited.value);
      if (delimited.validPosition) {
        parsed.push(parsedFormat);
      }
    });
    if (parsed.length === 1) {
      this.setState({ value: parsed[0].format(), userFormat: parsed[0].id });
    }
    else {
      const namedFormat = parsed.find(format => format.id === formatName);
      if (namedFormat) {
        this.setState({ value: namedFormat.format(), userFormat: namedFormat.id });
      }
    }
  }

  handleChange = e => {
    this.setValue(e.target.value);
  }

  handlePaste = e => {
    if (this.state.value === '' || (e.target.selectionStart === 0 && e.target.selectionEnd === e.target.value.length)) {
      const clipboard = e.clipboardData.getData('Text');
      this.setValue(clipboard, true);
    }
    e.preventDefault();
  }

  handleKeyDown = e => {
    const { value, selectionStart, selectionEnd } = e.target;
    if (selectionStart === selectionEnd) {
      const key = e.key;
      const code = e.keyCode;
      if (key === '/' || code === 111 || code === 191) {
        this.insertDelim(value, selectionStart, 'mm/dd/yyyy');
        e.preventDefault();
      }
      else if (key === '-' || code === 109 || code === 189) {
        this.insertDelim(value, selectionStart, 'yyyy-mm-dd');
        e.preventDefault();
      }
      else if (key === 'Backspace' || code === 8) {
        if (delimPattern.test(value.charAt(selectionStart - 1))) {
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
