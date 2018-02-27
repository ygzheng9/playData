import { Button } from 'antd';
import * as React from 'react';

import StartPoint from './routes/StartPoint';

import './App.css';

// tslint:disable-next-line:no-var-requires
const logo = require('./logo.svg');

interface HelloProps {
  compiler: string;
  framework: string;
}

const Hello = (props: HelloProps) => (
  <h1>
    Hello from {props.compiler} and {props.framework}!
    <div className="App">
      <Button type="primary">Button</Button>
    </div>
  </h1>
);

const OriginalMessage = () => {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1 className="App-title">Welcome to React</h1>
      </header>
      <p className="App-intro">empty ts project</p>
      <Hello compiler="webpack" framework="react" />
    </div>
  );
};

class App extends React.Component<{}, {}> {
  public render() {
    return (
      <div className="App">
        {false ? <OriginalMessage /> : ''}
        <StartPoint />
      </div>
    );
  }
}

export default App;
