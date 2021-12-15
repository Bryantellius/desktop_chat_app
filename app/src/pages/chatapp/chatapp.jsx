import React from "react";
import { connect } from "react-redux";
import {
  writeConfigRequest,
  useConfigInMainRequest,
} from "secure-electron-store";
import { io } from "socket.io-client";

class ChatApp extends React.Component {
  constructor(props) {
    super(props);

    this.socket;
    this.timer;

    this.state = {
      status: "disconnected",
      running: false,
      time: 0,
    };

    this.startTime = this.startTime.bind(this);
    this.stopTime = this.stopTime.bind(this);
    this.resetTime = this.resetTime.bind(this);
  }

  componentDidMount() {
    // Request so that the main process can use the store
    // window.api.store.send(useConfigInMainRequest);

    this.socket = io("http://localhost:3001", { reconnect: true });

    this.socket.on("connect", () => {
      console.log(this.socket.id);
      this.setState({ status: "connected" });
    });

    this.socket.on("disconnect", () => {
      console.log(this.socket.id);
      this.setState({ status: "disconnected" });
    });
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  startTime() {
    this.setState({ running: true });

    this.timer = setInterval(() => {
      this.setState({ time: this.state.time + 1 });
      this.socket.emit("time-increment", this.state.time);
    }, 100);
  }

  resetTime() {
    this.stopTime();
    this.setState({ time: 0 });
  }

  stopTime() {
    this.setState({ running: false });
    clearInterval(this.timer);
  }

  render() {
    return (
      <React.Fragment>
        <section className="section">
          <div className="container has-text-centered">
            <h1 className="title is-1">Live Results</h1>
            <div className="subtitle">{this.state.time}</div>
            <div className="field is-grouped">
              <div className="control">
                <button
                  disabled={this.state.running}
                  className={`button is-link`}
                  onClick={this.startTime}>
                  Start
                </button>
              </div>
              <div className="control">
                <button
                  disabled={!this.state.running}
                  className={`button is-link is-danger`}
                  onClick={this.stopTime}>
                  Stop
                </button>
              </div>
              <div className="control">
                <button
                  className={`button is-link is-dark`}
                  onClick={this.resetTime}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="container"></div>
        </section>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, props) => ({
  home: state.home,
});

export default connect(mapStateToProps)(ChatApp);
