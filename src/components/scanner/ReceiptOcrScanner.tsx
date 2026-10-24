import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/math';
import { ExpenseItem } from '../../types';

export const ReceiptOcrScanner: React.FC = () => {
  const { setActiveTab, setSelectedExpenseForSplit, addExpense, currentUser } = useApp();

  // Scanner state: 'scanning' | 'error' | 'success'
  const [scannerState, setScannerState] = useState<'scanning' | 'error' | 'success'>('scanning');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [activeFilterMode, setActiveFilterMode] = useState<'neural' | 'standard'>('neural');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Parsed OCR data
  const [merchantName, setMerchantName] = useState('Mainland China • Indiranagar');
  const [parsedItems, setParsedItems] = useState<ExpenseItem[]>([
    { id: 'ocr-1', name: 'Dim Sum Basket', price: 380, quantity: 1, assignedMemberIds: [currentUser.id] },
    { id: 'ocr-2', name: 'Schezwan Noodles', price: 420, quantity: 2, assignedMemberIds: ['user-rahul', 'user-ananya'] },
    { id: 'ocr-3', name: 'Crispy Chilli Fish', price: 550, quantity: 1, assignedMemberIds: ['user-rahul', 'user-siddharth'] },
  ]);
  const [parsedTax, setParsedTax] = useState(200);

  const parsedTotal = parsedItems.reduce((sum, i) => sum + i.price * i.quantity, 0) + parsedTax;

  // Handle image upload from user computer
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImage(event.target.result as string);
          setScannerState('scanning');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert OCR items to a real expense and transfer to Split Calculator
  const handleImportToSplit = () => {
    const newExpense = addExpense({
      title: merchantName,
      amount: parsedTotal,
      category: 'Dining',
      paymentRail: 'UPI',
      upiAccount: 'HDFC UPI',
      payerId: currentUser.id,
      splitMethod: 'ITEMIZED',
      status: 'pending',
      items: parsedItems,
      tax: parsedTax,
      splits: [
        { memberId: currentUser.id, amount: 480, percentage: 31, isSettled: true },
        { memberId: 'user-rahul', amount: 450, percentage: 29, isSettled: false },
        { memberId: 'user-ananya', amount: 320, percentage: 20.6, isSettled: false },
        { memberId: 'user-siddharth', amount: 300, percentage: 19.4, isSettled: false },
      ],
      notes: 'Imported via Receipt OCR Neural Scanner',
    });

    setSelectedExpenseForSplit(newExpense);
    setActiveTab('splits');
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto pb-16 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline-sm text-base sm:text-lg text-on-surface font-bold">
              Receipt OCR Scanner
            </h1>
            <span className="font-mono text-xs text-secondary font-semibold">
              Computer Vision & Multimodal Parser
            </span>
          </div>
        </div>

        {/* State Toggle Pill */}
        <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-full border border-outline-variant/30">
          <button
            onClick={() => setScannerState('scanning')}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all ${
              scannerState !== 'error'
                ? 'bg-secondary text-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Auto Scan
          </button>
          <button
            onClick={() => setScannerState('error')}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all ${
              scannerState === 'error'
                ? 'bg-tertiary-container text-on-tertiary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Error State
          </button>
        </div>
      </div>

      {/* Top Viewfinder Controls Bar matching Stitch */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 bg-surface-container-high/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/30 shadow-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              scannerState === 'error' ? 'bg-tertiary animate-pulse' : 'bg-secondary animate-ping'
            }`}
          />
          <span
            className={`font-mono text-[11px] uppercase font-bold tracking-wider ${
              scannerState === 'error' ? 'text-tertiary' : 'text-secondary'
            }`}
          >
            {scannerState === 'error' ? '⚠ Warning: Low Contrast' : '⚡ Auto-Detect ON'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-surface-container-high/90 backdrop-blur-md p-1 rounded-full border border-outline-variant/30 shadow-sm">
          {/* Torch toggle */}
          <button
            onClick={() => setIsFlashOn(!isFlashOn)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isFlashOn
                ? 'bg-amber-400 text-surface font-bold shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Toggle Flashlight"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={isFlashOn ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              flash_on
            </span>
          </button>

          {/* Grid toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              showGrid
                ? 'bg-primary/20 text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Toggle Perspective Grid"
          >
            <span className="material-symbols-outlined text-[18px]">grid_4x4</span>
          </button>

          {/* OCR mode */}
          <button
            onClick={() =>
              setActiveFilterMode(activeFilterMode === 'neural' ? 'standard' : 'neural')
            }
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              activeFilterMode === 'neural'
                ? 'bg-secondary-container/40 text-secondary'
                : 'text-on-surface-variant'
            }`}
            title="OCR Neural Filter"
          >
            <span className="material-symbols-outlined text-[18px]">document_scanner</span>
          </button>

          {/* Upload file trigger */}
          <label className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">photo_library</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* ERROR STATE VIEW matching Stitch receipt_ocr_scanner_error_state */}
      {scannerState === 'error' ? (
        <div className="flex flex-col space-y-4">
          {/* Viewfinder Status Pill */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-error-container/80 text-on-error-container shadow-md backdrop-blur-md animate-pulse border border-tertiary/40">
              <span className="material-symbols-outlined text-[16px] text-tertiary">warning</span>
              <span className="font-mono text-xs uppercase tracking-wider text-tertiary font-bold">
                Poor Lighting & Blur Detected
              </span>
            </div>
          </div>

          {/* Camera Viewfinder Stage (Dim & Blurry) */}
          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-surface-container-lowest flex items-center justify-center shadow-2xl border border-tertiary-container/40">
            {/* Blurry Dim simulated receipt background */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-[3px] brightness-70 contrast-85 scale-105"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDdHDM6d43K9kZ9jrX4fnjkPIvFLAhHjxY5JiqpT1P1qDPlfCOUklmAtDR2OxsyXanrS4voJGZPTellrxC_NxYFAuc_VJf6vHdTXhS2QXrbvQNDrP3bUz3hCnLZMhJqXs8x5RvD4GrlzedkQRH6EDjsxAzWTdsmxAvOj1wIanptcXzF8uiZnh5ulbILuMQj1enBujJFq7NPOesmuOCjycB66A_asUC8fkQgrzR5yh-OXT95sbsMWhz-')",
              }}
            />

            {/* Vignette & Glare obstruction patch */}
            <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-lowest/90 via-transparent to-surface-container-lowest/70 pointer-events-none" />
            <div className="absolute top-1/4 right-8 w-32 h-32 rounded-full bg-surface-container-lowest/80 blur-2xl pointer-events-none" />

            {/* Struggling Bounding Reticle with Amber/Crimson Tones */}
            <div className="relative w-[85%] h-[82%] rounded-lg flex flex-col justify-between p-3 pointer-events-none">
              {/* Top Brackets */}
              <div className="flex justify-between w-full">
                <div className="w-7 h-7 border-t-[3px] border-l-[3px] border-tertiary-container rounded-tl-md" />
                <div className="w-7 h-7 border-t-[3px] border-r-[3px] border-tertiary-container rounded-tr-md" />
              </div>

              {/* Center Diagnostic HUD */}
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-tertiary-container to-transparent opacity-80 animate-pulse" />
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-dim/95 text-tertiary shadow-lg backdrop-blur-md border border-tertiary/30">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">error</span>
                  <span className="font-mono text-xs font-bold">Text Unreadable (42% Confidence)</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/90 text-on-surface-variant backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[14px]">screen_rotation</span>
                  <span className="text-xs text-on-surface font-mono">
                    Hold steady • Avoid shadows
                  </span>
                </div>
              </div>

              {/* Bottom Brackets */}
              <div className="flex justify-between w-full">
                <div className="w-7 h-7 border-b-[3px] border-l-[3px] border-tertiary-container rounded-bl-md" />
                <div className="w-7 h-7 border-b-[3px] border-r-[3px] border-tertiary-container rounded-br-md" />
              </div>
            </div>

            {/* Flash assist floating button */}
            <button
              onClick={() => {
                setIsFlashOn(true);
                setScannerState('scanning');
              }}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary-container text-on-tertiary font-mono text-xs font-bold shadow-lg active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[16px]">flash_on</span>
              <span>Turn on Flash</span>
            </button>
          </div>

          {/* Actionable Diagnostic Coaching Card matching Stitch */}
          <div className="flex flex-col p-4 rounded-2xl bg-surface-container-low shadow-lg border border-outline-variant/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-error-container/70 flex items-center justify-center shrink-0 text-tertiary">
                <span className="material-symbols-outlined text-[22px]">document_scanner</span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-sm text-sm sm:text-base text-on-surface font-bold">
                    Unable to Read Receipt
                  </h3>
                  <span className="font-mono text-[10px] text-tertiary bg-surface-container px-2 py-0.5 rounded-full font-bold">
                    Error 0x4B
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Motion blur and dim ambient light are obstructing total sum, GSTIN, and line items.
                </p>
              </div>
            </div>

            {/* Troubleshooting Checklist Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar">
              <button
                onClick={() => {
                  setIsFlashOn(true);
                  setScannerState('scanning');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest active:scale-95 transition-all shrink-0 text-xs font-medium border border-tertiary/20"
              >
                <span className="material-symbols-outlined text-[16px] text-tertiary">
                  flashlight_on
                </span>
                <span>1-Tap Flash</span>
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant shrink-0 text-xs font-medium border border-outline-variant/20">
                <span className="material-symbols-outlined text-[16px] text-secondary">crop_free</span>
                <span>Flatten creases</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant shrink-0 text-xs font-medium border border-outline-variant/20">
                <span className="material-symbols-outlined text-[16px] text-primary">wb_sunny</span>
                <span>Step into direct light</span>
              </div>
            </div>

            {/* Fallback Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-outline-variant/20 mt-3">
              <button
                onClick={() => setScannerState('scanning')}
                className="py-2.5 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-mono text-xs font-bold flex items-center justify-center gap-1.5 border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                <span>Retry Scan</span>
              </button>

              <button
                onClick={() => setActiveTab('splits')}
                className="py-2.5 px-3 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary font-mono text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Manual Entry Mode</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SUCCESS / SCANNING HUD VIEW matching Stitch receipt_ocr_scanner */
        <div className="flex flex-col space-y-4">
          {/* Live Viewfinder Camera Screen */}
          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-surface-container-lowest border border-outline-variant/30">
            {/* Camera sensor photo */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: uploadedImage
                  ? `url(${uploadedImage})`
                  : "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB6t4uDgPWudKzo5lw55H0qvjuut853ilt0CNNx08U7qhzdJec5gDeto-gQL7ARAigg0yK8_Am_ZwEVEH1MqUMY_i_z_r0ZuwV1Lx7FhL5M256p5pPOe_J-OoE41Tt28toOiDVv2rVBcDdNt59xQElGvxIyupPmwNsXsK80BhRirWjyRghC-LET3t5okS26gD4ZtIeEuO2-uxJbefxxtEQE3eYEzIW62ANQ1zaWJD4G9NOQR_ep8g2k')",
              }}
            />

            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/60 via-transparent to-surface-container-lowest/80 pointer-events-none" />

            {/* Rule of Thirds Guide Lines */}
            {showGrid && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
                <div className="border-r border-b border-primary/40" />
                <div className="border-r border-b border-primary/40" />
                <div className="border-b border-primary/40" />
                <div className="border-r border-b border-primary/40" />
                <div className="border-r border-b border-primary/40" />
                <div className="border-b border-primary/40" />
                <div className="border-r border-b border-primary/40" />
                <div className="border-r border-b border-primary/40" />
                <div />
              </div>
            )}

            {/* Dynamic Perspective Snapping Polygon Brackets */}
            <div className="absolute inset-x-8 top-8 bottom-12 pointer-events-none flex flex-col justify-between">
              {/* Top Brackets */}
              <div className="flex justify-between items-start">
                <div className="w-7 h-7 border-t-2 border-l-2 border-secondary rounded-tl-lg shadow-[0_0_12px_rgba(78,222,163,0.8)]" />
                <div className="flex items-center gap-1.5 bg-surface-container-lowest/85 backdrop-blur-md px-2.5 py-0.5 rounded-full mt-[-6px] border border-secondary/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  <span className="font-mono text-[10px] text-secondary tracking-wider uppercase font-bold">
                    Perspective Locked
                  </span>
                </div>
                <div className="w-7 h-7 border-t-2 border-r-2 border-secondary rounded-tr-lg shadow-[0_0_12px_rgba(78,222,163,0.8)]" />
              </div>

              {/* Animated Glowing Laser Scanner Line */}
              <div className="w-full relative flex items-center justify-center my-auto">
                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent shadow-[0_0_14px_#4edea3] animate-pulse" />
                <div className="absolute bg-surface-container-high/90 border border-secondary/30 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                  <span className="material-symbols-outlined text-[14px] text-secondary animate-spin">
                    sync
                  </span>
                  <span className="font-mono text-[10px] text-on-surface uppercase tracking-wider font-bold">
                    OCR Neural Scan
                  </span>
                </div>
              </div>

              {/* Bottom Brackets */}
              <div className="flex justify-between items-end">
                <div className="w-7 h-7 border-b-2 border-l-2 border-secondary rounded-bl-lg shadow-[0_0_12px_rgba(78,222,163,0.8)]" />
                <div className="font-mono text-[10px] text-secondary bg-surface-container-lowest/80 px-2 py-0.5 rounded backdrop-blur border border-secondary/20">
                  90mm × 165mm
                </div>
                <div className="w-7 h-7 border-b-2 border-r-2 border-secondary rounded-br-lg shadow-[0_0_12px_rgba(78,222,163,0.8)]" />
              </div>
            </div>

            {/* Real-time OCR Text Bounding Boxes placed over detected coordinates */}
            <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
              {/* Merchant Tag Anchor */}
              <div className="mt-4 self-center">
                <div className="bg-surface-container-lowest/90 border border-secondary text-secondary px-3 py-1 rounded-lg shadow-xl flex items-center gap-1.5 animate-bounce">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  <span className="font-mono text-xs font-bold text-on-surface">
                    {merchantName}
                  </span>
                </div>
              </div>

              {/* Itemized OCR Bounding Tokens */}
              <div className="flex flex-col gap-2 max-w-[90%] mx-auto w-full my-auto">
                {parsedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-primary-container/30 border border-primary/50 px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-md"
                  >
                    <span className="font-mono text-xs text-primary-fixed font-semibold">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono text-xs text-secondary font-bold">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between items-center bg-surface-container-high/80 border border-outline/40 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  <span className="font-mono text-[11px] text-on-surface-variant">
                    Taxes & Service (10%)
                  </span>
                  <span className="font-mono text-xs text-on-surface font-semibold">
                    {formatINR(parsedTax)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Bill Summary Card */}
          <div className="p-4 rounded-2xl bg-surface-container shadow-xl border border-outline-variant/30 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </div>
                <div>
                  <span className="font-headline-sm text-sm text-on-surface font-bold">
                    Scan Verified
                  </span>
                  <span className="block font-mono text-[10px] text-secondary font-semibold">
                    4 line items parsed with 98% confidence
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-xl font-bold text-on-surface">
                  {formatINR(parsedTotal)}
                </span>
                <span className="block text-[10px] font-mono text-on-surface-variant">
                  Total Bill
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleImportToSplit}
                className="flex-1 py-3 px-4 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary font-headline-sm text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">group_add</span>
                <span>Import into Split Calculator</span>
              </button>

              <label className="py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline-sm text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border border-outline-variant/30">
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Upload Custom Bill</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
