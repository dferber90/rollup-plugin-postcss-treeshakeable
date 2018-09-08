import React, { Component } from "react";
// Notice that we are not importing Butler itself, so
// we will treeshake it out when building.
import { ButlerContainer } from "ui-library";

class App extends Component {
  render() {
    return (
      <div className="App">
        <ButlerContainer />
      </div>
    );
  }
}

export default App;
