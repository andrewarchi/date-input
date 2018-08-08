import React from 'react';
import PropTypes from 'prop-types';
import Input from '@material-ui/core/Input';
import { Monat, MDY, YMD, sanitizeDelims } from './monat';

class DateInput extends React.Component {
  monat = new Monat(MDY, YMD);
  state = {
    date: null,
    savedDate: null,
    value: '',
    userFormat: ''
  };

  setDate(e, dates, input) {
    const { userFormat } = this.state;
    const date = dates.length === 1 ? dates[0] : dates.find(date => date.format.name === userFormat);
    const value = date ? date.toString() : sanitizeDelims(input);

    e.target.value = value;
    if (this.props.onChange) {
      this.props.onChange(e);
    }
    if (this.props.onDateChange) {
      this.handleDateChange(this.state.date, date);
    }
    this.setState({ date, value });
  }

  handleDateChange(prevDate, nextDate) {
    prevDate = prevDate ? prevDate.toComplete() : null;
    nextDate = nextDate ? nextDate.toComplete() : null;
    const prevDateStr = prevDate && prevDate.isValidComplete() ? prevDate.toFormat(MDY).toString() : '';
    const nextDateStr = nextDate && nextDate.isValidComplete() ? nextDate.toFormat(MDY).toString() : '';
    if (prevDateStr !== nextDateStr) {
      this.props.onDateChange(nextDateStr, nextDate);
    }
  }

  handleChange = e => {
    this.setDate(e, this.monat.parseNumeric(e.target.value), e.target.value);
  }

  handlePaste = e => {
    if (this.state.value === '' || (e.target.selectionStart === 0 && e.target.selectionEnd === e.target.value.length)) {
      const clipboard = e.clipboardData.getData('Text');
      this.setDate(e, this.monat.parseDelimited(clipboard), clipboard);
    }
    e.preventDefault();
  }

  handleKeyDown = e => {
    const { value, selectionStart, selectionEnd } = e.target;
    const { savedDate, userFormat } = this.state;
    if (selectionStart === selectionEnd) {
      const key = e.key;
      const code = e.keyCode;
      if (key === '/' || code === 111 || code === 191 || key === '-' || code === 109 || code === 189) {
        const dates = this.monat.insertDelim(value, selectionStart);
        if (dates.length === 1) {
          const date = dates[0];
          this.setState({ date, value: date.toString(), userFormat: date.format.name });
        }
        else if (userFormat) {
          const date = dates.find(date => date.format.name === userFormat);
          if (date) {
            this.setState({ date, value: date.toString() });
          }
        }
      }
      else if (key === 'Backspace' || code === 8) {
        if (this.monat.isDelim(value.charAt(selectionStart - 1))) {
          this.setCaretPosition(e.target, selectionStart - 1);
        }
      }
      else if (key === 'Escape' || key === 'Esc' || code === 27) {
        this.setState({ date: savedDate, value: savedDate.toString() });
      }
      //key === 'ArrowUp' || code === 38
      //key === 'ArrowDown' || code === 40
    }
  }

  handleFocus = e => {
    e.target.select();
    this.setState({ savedDate: this.state.date });
  }

  handleBlur = e => {
    const dates = this.monat.setCompleted(e.target.value);
    if (dates.length === 1) {
      this.setState({ date: dates[0], value: dates[0].toString() });
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

DateInput.propTypes = {
  onChange: PropTypes.func,
  onDateChange: PropTypes.func
};

export default DateInput;
