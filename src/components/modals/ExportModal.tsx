import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportToCSV, exportToExcel } from '../../utils/exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { expenses, settlements, users, currentUser } = useApp();
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const [includeCash, setIncludeCash] = useState(true);
  const [includeSplits, setIncludeSplits] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsExporting(true);

    setTimeout(() => {
      if (format === 'xlsx') {
        exportToExcel(expenses, settlements, users, currentUser);
      } else if (format === 'csv') {
        exportToCSV(expenses, users);
      } else if (format === 'pdf') {
        window.print();
      }

      setIsExporting(false);
      setSuccessToast(true);
      setTimeout(() => {
        setSuccessToast(false);
        onClose();
      }, 1500);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface-container-high rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">table_chart</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Export Financial Ledger
              </h3>
              <span className="text-[11px] font-mono text-secondary-fixed">
                EXCEL ENGINE V3.4 • AUDIT READY
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container p-4 border border-outline-variant/20">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-[24px] shrink-0 mt-0.5">
              cloud_download
            </span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Download your complete transaction ledger, cash entries, receipt OCR breakdowns, and group split settlement logs formatted for Microsoft Excel, Google Sheets, and Tally.
            </p>
          </div>
        </div>

        {/* Target Format Selector */}
        <div className="flex flex-col space-y-2">
          <span className="font-mono text-xs text-on-surface-variant uppercase font-semibold">
            Target Format
          </span>

          {/* XLSX */}
          <button
            type="button"
            onClick={() => setFormat('xlsx')}
            className={`w-full text-left p-3.5 rounded-xl border transition-all ${
              format === 'xlsx'
                ? 'bg-surface-container-highest border-secondary text-on-surface shadow-md'
                : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-[20px]">grid_on</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-on-surface">Excel Workbook (.XLSX)</span>
                    <span className="px-1.5 py-0.2 rounded bg-secondary/20 text-secondary text-[10px] font-mono font-bold">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Multi-sheet ledger with auto-sum formulas, tax tags & split ledgers
                  </p>
                </div>
              </div>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  format === 'xlsx' ? 'bg-secondary text-surface' : 'bg-surface-container-low text-outline'
                }`}
              >
                {format === 'xlsx' && '✓'}
              </span>
            </div>
          </button>

          {/* CSV */}
          <button
            type="button"
            onClick={() => setFormat('csv')}
            className={`w-full text-left p-3.5 rounded-xl border transition-all ${
              format === 'csv'
                ? 'bg-surface-container-highest border-secondary text-on-surface shadow-md'
                : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-[20px]">reorder</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-on-surface">CSV Spreadsheet (.CSV)</span>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Plain tabular text for Tally Prime, QuickBooks & Python scripts
                  </p>
                </div>
              </div>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  format === 'csv' ? 'bg-secondary text-surface' : 'bg-surface-container-low text-outline'
                }`}
              >
                {format === 'csv' && '✓'}
              </span>
            </div>
          </button>

          {/* PDF */}
          <button
            type="button"
            onClick={() => setFormat('pdf')}
            className={`w-full text-left p-3.5 rounded-xl border transition-all ${
              format === 'pdf'
                ? 'bg-surface-container-highest border-secondary text-on-surface shadow-md'
                : 'bg-surface-container border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline">
                  <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-on-surface">Printable Statement Report</span>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Clean visual audit summary with monthly analytics breakdown
                  </p>
                </div>
              </div>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  format === 'pdf' ? 'bg-secondary text-surface' : 'bg-surface-container-low text-outline'
                }`}
              >
                {format === 'pdf' && '✓'}
              </span>
            </div>
          </button>
        </div>

        {/* Options */}
        <div className="p-3 rounded-xl bg-surface-container-lowest flex flex-col gap-2 border border-outline-variant/20">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
            <input
              type="checkbox"
              checked={includeCash}
              onChange={(e) => setIncludeCash(e.target.checked)}
              className="w-4 h-4 rounded text-secondary focus:ring-secondary"
            />
            <span>Include Physical Cash Transactions ({expenses.filter((e) => e.paymentRail === 'CASH').length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
            <input
              type="checkbox"
              checked={includeSplits}
              onChange={(e) => setIncludeSplits(e.target.checked)}
              className="w-4 h-4 rounded text-secondary focus:ring-secondary"
            />
            <span>Include Individual Split Ledger Breakdown</span>
          </label>
        </div>

        {/* Success Feedback */}
        {successToast && (
          <div className="p-2.5 rounded-xl bg-secondary/15 text-secondary flex items-center gap-2 text-xs font-semibold">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Report generated and downloaded successfully!</span>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="w-full h-12 bg-secondary-container hover:bg-secondary text-on-secondary font-headline-sm text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isExporting ? 'sync' : 'download'}
          </span>
          <span>{isExporting ? 'Generating Report...' : 'Download Ledger File'}</span>
        </button>
      </div>
    </div>
  );
};
