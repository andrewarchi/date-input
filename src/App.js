import React from 'react';
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider';
import DateInput from './DateInput';
import './App.css';

class App extends React.Component {
  render() {
    return (
      <MuiThemeProvider>
        <div className="App">
          <header className="App-header">
            <h1 className="App-title">React Date Input</h1>
          </header>
          <p className="App-intro">
            <DateInput />
          </p>
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
