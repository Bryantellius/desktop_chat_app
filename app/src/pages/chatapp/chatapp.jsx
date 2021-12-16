import React from "react";
import { connect } from "react-redux";
import {
  writeConfigRequest,
  useConfigInMainRequest,
} from "secure-electron-store";
import { io } from "socket.io-client";
import dayjs from "dayjs";

class ChatApp extends React.Component {
  constructor(props) {
    super(props);

    this.socket;
    this.timer;

    this.state = {
      status: "disconnected",
      running: false,
      time: 0,
      loadedMeet: {},
      currentRace: {},
    };

    this.startTime = this.startTime.bind(this);
    this.stopTime = this.stopTime.bind(this);
    this.resetTime = this.resetTime.bind(this);
    this.addResult = this.addResult.bind(this);
    this.loadMeet = this.loadMeet.bind(this);
    this.selectCurrentRace = this.selectCurrentRace.bind(this);
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

    this.loadMeet();
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  loadMeet() {
    fetch("http://localhost:3001/api/v1/load-meet")
      .then((res) => res.json())
      .then((data) => this.setState({ loadedMeet: data }))
      .catch((err) => alert(err));
  }

  startTime() {
    this.setState({ running: true });

    this.timer = setInterval(() => {
      let updatedTime = this.state.time + 1;
      this.socket.emit(
        "time-increment",
        dayjs()
          .minute(0)
          .second(updatedTime / 10)
          .format("mm:ss")
      );
      this.setState({ time: updatedTime });
    }, 100);
  }

  resetTime() {
    this.stopTime();
    this.socket.emit("reset", dayjs().minute(0).second(0).format("mm:ss"));
    this.setState({
      time: 0,
    });
  }

  stopTime() {
    this.setState({ running: false });
    clearInterval(this.timer);
  }

  selectCurrentRace(e) {
    let currentRace = this.state.loadedMeet.races.find(
      (val) => val.id == e.target.value
    );
    this.setState({ currentRace });
    this.socket.emit("race-selection", currentRace);
  }

  addResult(e) {
    e.preventDefault();

    let athleteId = document.getElementById("athleteId");

    let athlete = this.state.currentRace.entries.find(
      (val) => val.athleteId == athleteId.value
    );

    this.socket.emit("result", {
      athlete,
      time: dayjs()
        .minute(0)
        .second(this.state.time / 10)
        .format("mm:ss"),
    });

    athleteId.value = "";
    athleteId.focus();
  }

  render() {
    return (
      <React.Fragment>
        <section className="section">
          <div className="container has-text-centered">
            <span
              id="connectionBubble"
              className={`tag is-${
                this.state.status == "disconnected" ? "danger" : "success"
              }`}>
              {this.state.status == "disconnected" ? "Not" : ""} Connected
            </span>
            <h1 className="title is-1">
              {this.state.currentRace?.title || "Live Results"}
            </h1>
            <div className="subtitle">
              {dayjs()
                .hour(0)
                .minute(0)
                .second(this.state.time ? this.state.time / 10 : 0)
                .format("mm:ss")}
            </div>
            <div className="control has-icons-left">
              <div className="select">
                <select onChange={this.selectCurrentRace}>
                  <option selected>Select a race..</option>
                  {this.state.loadedMeet.races?.map((race, idx) => (
                    <option key={idx} value={race.id}>
                      {race.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="icon is-small is-left">
                <i className="fas fa-globe"></i>
              </div>
            </div>
            <div className="control">
              <button
                className={`button is-link is-dark`}
                onClick={this.loadMeet}>
                Load
              </button>
            </div>
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
            <hr />
            <form className="field has-addons" onSubmit={this.addResult}>
              <div className="control">
                <input
                  id="athleteId"
                  className="input"
                  type="number"
                  placeholder="Athlete #"
                />
              </div>
              <div className="control">
                <button
                  type="submit"
                  className="button is-info"
                  disabled={!this.state.running}>
                  Time
                </button>
              </div>
            </form>
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
