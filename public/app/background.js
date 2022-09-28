
/*global chrome*/
var labelsResult = [] //从label cloud⻚⾯收到的需要抓取的⻚⾯列表
var currentLabelGroup = '';  //当前数据所属项⽬名字，如Binance 
var index = 0; //当前打开的⻚⾯索引，当到达max时完成 
var typeIndex = 0; //每个项⽬有3个可能的类型标签，要遍历⼀下，这是索引，到达3时结束
var types = ['1', '3-0', '2']; //每个项⽬有3个可能的类型，分别对应Main, Others, Legacy 
var typeMax = types.length; //类型标签遍历的最⼤值 
var max = 0;//整个标签地址的最⼤值 
var timeInterval = 1000;
var labelsData = [] //最终输出的数据
var addressPool = [] //防地址重复的数组记录 

chrome.browserAction.onClicked.addListener(function (tab) {
   // Send a message to the active tab
   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { "message": "clicked_browser_action" });
   });
});

chrome.runtime.onMessage.addListener(
   function (request, sender, sendResponse) {
      console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
      //点击【开始抓取】的时候，App.js传来的总的要抓取的⻚⾯列表，并将相关数据进⾏重置
      if (request.type === "startScan") {
         labelsResult = request.data;
         // console.log("labelsResult", labelsResult);
         max = labelsResult.length;
         index = 0;
         typeIndex = 0
         labelsData = [];
         addressPool = [];
         scan();
         sendResponse({ farewell: request.data });
         return true;
      } else if (request.type === "parseLabels") {
         //当打开诸如https://etherscan.io/accounts/label/binance⻚⾯时
         //content.js抓到了具体的标签数据，通过 消息传过来
         request.data = request.data.map(item => {
            item.group = currentLabelGroup;
            return item;
         })
         for (let i = 0; i < request.data.length; i++) {
            let r = request.data[i];
            if (addressPool.indexOf(r.address) === -1) {
               labelsData.push(r);
            }
         }
         // 记录已经抓到的地址，防重复
         let addresses = request.data.map(item => item.address);
         addressPool = addressPool.concat(addresses);
         console.log("labelsData", labelsData)
         sendResponse({ labelsData: labelsData });
         return true;
      }
   }
);

// 加随机定时的打开关闭指定的地址标签⻚⾯，触发content.js进⾏数据抓取
function scan() { // 以下逻辑⽤于拼接要打开的标签地址 
   let type = types[typeIndex]; //2, 3-0 
   currentLabelGroup = labelsResult[index].lastIndexOf("/");
   currentLabelGroup = labelsResult[index].slice(currentLabelGroup + 1)
   let url = `${labelsResult[index]}?subcatid=${type}&size=2000&start=0&col=1&order=asc`
   chrome.tabs.create({ url: url })
   typeIndex++;
   let time = timeInterval + Math.round(Math.random() * timeInterval)

   setTimeout(function () {
      chrome.tabs.query({ url: "https://*/accounts/label/*" }, function (tabs) {
         chrome.tabs.remove(tabs[0].id, function () { });
      })
      console.log("typeIndex and typeMax", typeIndex, typeMax);
      // ⼀个项⽬⻚⾯的⼏个type⻚⾯循环
      if (typeIndex >= typeMax) {
         typeIndex = 0;
         index++;
         console.log("index and max", index, max);
         // 整个列表的⻚⾯循环
         if (index >= max) {
            alert("Over, total records: " + labelsData.length);
            index = 0;
            typeIndex = 0;
            downloadFile(JSON.stringify(labelsData));
         } else {
            scan();
         }
      } else {
         scan()
      }
   }, time)
}

// 文件下载
function downloadFile(content, filename = "labelsCloud.json") {
   var blob = new Blob([content], { type: "text/json;charset=UTF-8" });
   var url = window.URL.createObjectURL(blob);
   chrome.downloads.download({
      url: url,
      filename: filename
   })
}