import React from 'react';
import { createRoot } from "react-dom/client"
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN'
import Popup from '@/popup'
// 引入自定义全局公用样式
import '@/common/styles/frame.scss'

const antdConfig = {
  locale: zhCN,
}

let app = createRoot(document.getElementById("root"));
app.render(<ConfigProvider {...antdConfig}>
  <Popup />
</ConfigProvider>)