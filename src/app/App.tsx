import { Routes, Route, Outlet, Link, useLocation } from 'react-router';
import '../styles/globals.css';
import { HighFidelityPage } from './components/HighFidelityPage';
import { WireframePage } from './components/WireframePage';

import { DetailPage } from './components/DetailPage';
import { ExternalEntryPage } from './components/ExternalEntryPage';
import { HistoricalPositionsPage } from './components/HistoricalPositionsPage';
import { BatchImportPage } from './components/BatchImportPage';
import { WireframeDetailPage, WireframeExternalEntryPage, WireframeBatchImportPage, WireframeHistoricalPage } from './components/WireframeSubPages';

const WIREFRAME_PAGES = [
  { path: '/wireframe', label: '持仓总览' },
  { path: '/wireframe/detail', label: '持仓详情' },
  { path: '/wireframe/external-entry', label: '录入外部数据' },
  { path: '/wireframe/batch-import', label: '批量导入' },
  { path: '/wireframe/historical', label: '历史持仓' },
];

function WireframeLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden">
      {/* 线框图页面切换导航 */}
      <div className="w-44 flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col">
        <div className="px-4 py-4 border-b border-[#E5E7EB]">
          <div className="text-xs font-bold text-[#333333]">原型线框图</div>
          <div className="text-[9px] text-[#999999] mt-0.5">页面结构参考</div>
        </div>
        <div className="flex-1 py-2">
          {WIREFRAME_PAGES.map(page => (
            <Link
              key={page.path}
              to={page.path}
              className={`block px-4 py-2.5 text-xs transition-colors ${
                location.pathname === page.path
                  ? 'bg-[#F3F4F6] text-[#1677FF] font-medium border-r-2 border-[#1677FF]'
                  : 'text-[#666666] hover:bg-[#F9FAFB]'
              }`}
            >
              {page.label}
            </Link>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-[#E5E7EB]">
          <Link to="/" className="text-[10px] text-[#1677FF] hover:underline">
            ← 返回高保真
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="relative h-screen overflow-hidden">
      <Routes>
        {/* 线框图区域 */}
        <Route path="/wireframe" element={<WireframeLayout />}>
          <Route index element={<WireframePage />} />
          <Route path="detail" element={<WireframeDetailPage />} />
          <Route path="external-entry" element={<WireframeExternalEntryPage />} />
          <Route path="batch-import" element={<WireframeBatchImportPage />} />
          <Route path="historical" element={<WireframeHistoricalPage />} />
        </Route>

        {/* 高保真区域 */}
        <Route path="/detail/:id" element={<DetailPage />} />
        <Route path="/external-entry" element={<ExternalEntryPage />} />
        <Route path="/historical" element={<HistoricalPositionsPage />} />
        <Route path="/batch-import" element={<BatchImportPage />} />
        <Route path="/" element={<HighFidelityPage />} />
      </Routes>
    </div>
  );
}
