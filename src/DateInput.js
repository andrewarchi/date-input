import React from 'react';
import PropTypes from 'prop-types';
import Input from '@material-ui/core/Input';
import { Monat, MDY, YMD, sanitizeDelims } from './monat';

class DateInput extends React.Component {
  constructor(props) {
    super(props);
    this.monat = new Monat(MDY, YMD);
    this.state = {
      ...this.getDateFromProps(props),
      savedDate: null,
      userFormat: ''
    };
  }

  componentWillReceiveProps(props) {
    if (this.state.value !== props.value && this.state.input !== props.input) {
      this.setState(this.getDateFromProps(props));
    }
  }

  getDateFromProps(props) {
    const input = typeof props.value === 'string' ? props.value : '';
    const dates = this.monat.parseDelimited(input);
    const date = dates.length === 1 ? dates[0] : null;
    const value = date ? date.toString() : sanitizeDelims(input);
    return { date, value, input: props.value };
  }

  setDate(e, dates, input) {
    const { userFormat } = this.state;
    const date = dates.length === 1 ? dates[0] : dates.find(date => date.format.name === userFormat);
    const value = date ? date.toString() : sanitizeDelims(input);

    e.target.value = value;
    if (this.props.onChange) {
      this.props.onChange(e);
    }
    if (this.props.onValueChange) {
      this.props.onValueChange(value, date);
    }
    if (this.props.onDateChange) {
      this.handleDateChange(this.state.date, date);
    }
    this.setState({ date, value, input });
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
          const value = date.toString();
          if (date) {
            this.setState({ date, value, input: value });
          }
        }
      }
      else if (key === 'Backspace' || code === 8) {
        if (this.monat.isDelim(value.charAt(selectionStart - 1))) {
          this.setCaretPosition(e.target, selectionStart - 1);
        }
      }
      else if (key === 'Escape' || key === 'Esc' || code === 27) {
        const value = savedDate.toString();
        this.setState({ date: savedDate, value, input: value });
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
      const value = dates[0].toString();
      this.setState({ date: dates[0], value, input: value });
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
    const {
      value,
      onValueChange,
      onDateChange,
      onChange,
      onPaste,
      onKeyDown,
      onFocus,
      onBlur,
      ...props
    } = this.props;
    return (
      <Input
        value={this.state.value}
        placeholder="M/D/Y or Y-M-D"
        onChange={this.handleChange}
        onPaste={this.handlePaste}
        onKeyDown={this.handleKeyDown}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        {...props}
      />
    );
  }
}

DateInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onValueChange: PropTypes.func,
  onDateChange: PropTypes.func
};

export default DateInput;
