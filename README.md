## 问题记录

### chrome.extension.getBackgroundPage

为了解决插件 V3 中 background script 中无法获取到 window 对象,使用 getBackgroundPage 来获取, 但是执行却报出 `background.js:1 Uncaught TypeError: chrome.extension.getBackgroundPage is not a function` 的错误
发现是是因为 background（V3 叫做 service worker）加载不出导致的
V2 中有一个 persistent 属性, 如果设置为 true 会始终后台运行, 相当于一个独立的服务器页面, 而如果是 false 则会让 background 变成了一种短暂加载进内存的脚本, 脚本可以多次被线程加载执行, 执行完毕后就释放, 可以降低谷歌浏览器的内存耗费(事实上这么点内存耗费并不是那么重要所以大多数情况下无脑设置 persistent:true)
在 V3 中，chrome extensions 砍掉了 background, 直接改为了 persistent 始终为 false 的 service worker，也就是说, 新的 background 会不断的卸载重装卸载重装

> -   关于对 Service Worker 的讨论: https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension/66618269#66618269

-   官方对于 Service Worker 的转移 https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/
