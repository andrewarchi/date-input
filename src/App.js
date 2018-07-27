import React from 'react';
import DateInput from './DateInput';
import './App.css';

class App extends React.Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">React Date Input</h1>
        </header>
        <section className="App-intro">
          <DateInput />
        </section>
      </div>
    );
  }
}

export default App;
