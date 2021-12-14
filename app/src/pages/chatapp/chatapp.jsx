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

    this.state = {
      messages: [],
    };

    this.addMessage = this.addMessage.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.onSubmitMessage = this.onSubmitMessage.bind(this);
  }

  componentDidMount() {
    // Request so that the main process can use the store
    // window.api.store.send(useConfigInMainRequest);

    fetch("http://localhost:3001/messages")
      .then((res) => res.json())
      .then((data) => this.setState({ messages: data }))
      .catch((err) => alert(err.message));

    let socket = io("http://localhost:3001", { reconnect: true });

    socket.on("connect", () => {
      console.log(socket.id);
    });

    socket.on("disconnect", () => {
      console.log(socket.id);
    });

    socket.on("message", this.addMessage);
  }

  addMessage(message) {
    this.setState({ messages: [message, ...this.state.messages] });
  }

  sendMessage(message) {
    fetch("http://localhost:3001/messages", {
      mode: "cors",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    })
      .then((res) => res.json())
      .then((res) => {
        this.addMessage(message);
        alert(res.message);
      })
      .catch((err) => alert(err.message));
  }

  onSubmitMessage(event) {
    event.preventDefault(); // prevent navigation

    let content = document.getElementById("message");
    let author = document.getElementById("author");

    this.sendMessage({ name: author.value, message: content.value });

    // reset
    content.value = "";
    author.value = "";
  }

  render() {
    return (
      <React.Fragment>
        <section className="section">
          <div className="container has-text-centered">
            <h1 className="title is-1">Chatter</h1>
            <div className="subtitle">v1.0.0</div>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <form className="mb-4" onSubmit={this.onSubmitMessage}>
              <div className="field is-horizontal">
                <input
                  placeholder="Hello World"
                  id="message"
                  className="input"
                />
                <input placeholder="Elmo" id="author" className="input" />
                <input
                  className="button is-primary"
                  type="submit"
                  value="Post"
                />
              </div>
            </form>
            <div id="messages">
              {this.state.messages.map((m, idx) => {
                return (
                  <div key={idx}>
                    <p>{m.message}</p>
                    <small>{m.name}</small>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, props) => ({
  home: state.home,
});

export default connect(mapStateToProps)(ChatApp);
