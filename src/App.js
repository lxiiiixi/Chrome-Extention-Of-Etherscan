/*global chrome*/

import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {

  // 点击触发getLabels函数开始抓取labels
  getLabels() {
    let queryString1 = 'a.py-1.px-3.d-block';
    let hrefs = Array.from(document.querySelectorAll(queryString1))
    let result1 = hrefs.map(href => href.href);
    result1 = result1.filter(href => href.indexOf('/accounts') > -1)
    console.log(result1);
    // 这里抓取https://etherscan.io/labelcloud⻚⾯所有的⼤类标签
    // 然后通过chrome.runtime.sendMessage发送数据到background.js中
    chrome.runtime.sendMessage({ type: "startScan", data: result1 }, function (response) {
      console.log("startScan data", response.farewell);
    });
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          {this.props.isExt ?
            <img src={chrome.runtime.getURL("static/media/logo.svg")} className="App-logo" alt="logo" />
            :
            <img src={logo} className="App-logo" alt="logo" />
          }

          <h1 className="App-title">Etherscan Bot</h1>
        </header>
        <button className="mybutton" onClick={this.getLabels.bind(this)}>开始抓取</button>
      </div>
    );
  }
}

export default App;
