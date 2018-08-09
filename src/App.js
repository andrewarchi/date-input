import React from 'react';
import DateInput from './DateInput';
import './App.css';

class App extends React.Component {
  render() {
    const log = title => (...args) => console.log(title, ...args);
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Monat</h1>
        </header>
        <section className="App-intro">
          <DateInput value="1/2/34" onChange={log('onChange')} onDateChange={log('onDateChange')} />
        </section>
      </div>
    );
  }
}

export default App;
