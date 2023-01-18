import { HashRouter, Route, Routes, Navigate } from 'react-router-dom'
import Home from '@/popup/pages/home'
import './popup.scss' // 作为popup所有页面的全局样式
// 在popup页面调试content script，仅用于开发环境，build前记得要注释掉
// import '@/content'

function Popup() {
    return (
        <HashRouter>
            <Routes>
                <Route exact path="/home" element={<Home />} />
                <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
        </HashRouter>
    )
}

export default Popup