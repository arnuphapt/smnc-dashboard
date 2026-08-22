/**
 * EvaluationPdfTemplate.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * แก้ไข Template HTML/CSS ของใบรายงานผลการประเมินจริยธรรมการวิจัยได้ที่ไฟล์นี้
 * (IRB Evaluation Report — วิทยาลัยพยาบาลศรีมหาสารคาม)
 *
 * โครงสร้างไฟล์:
 *   - PDF_STYLES              : CSS ทั้งหมดของเอกสาร
 *   - buildDocumentHtml()     : HTML โครงสร้างหน้ากระดาษทั้งฉบับ
 *   - buildEvaluatorBlocksHtml() : HTML บล็อกผู้ประเมินแต่ละคน (เกณฑ์ + ข้อเสนอแนะ)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface TemplateData {
  thaiDate: string
  submittedDate: string
  thaiExpiryDate: string
  projectTitle: string
  submitterName: string
  statusLabel: string
  evaluatorBlocks: EvaluatorBlockData[]
}

export interface CriterionData {
  label: string
  scoreHtml: string
  revisionDetail?: string
}

export interface EvaluatorBlockData {
  index: number
  verdictLabel: string
  riskLabel: string
  intervalLabel: string
  cleanNotes: string
  criteria: CriterionData[]
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS — แก้ไขสไตล์ทั้งหมดของเอกสารได้ที่นี่
// ─────────────────────────────────────────────────────────────────────────────
export const PDF_STYLES = `
  .pdf-doc-container {
    background: #fff;
  }

  .pdf-page {
    width: 794px;
    font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
    font-size: 13px;
    color: #000;
    background: #fff;
    padding: 24px 30px;
    line-height: 1.5;
    box-sizing: border-box;
    margin-bottom: 20px;
  }

  /* Header */
  .doc-header { text-align: center; margin-bottom: 14px; }
  .doc-header .org-name { font-size: 18px; font-weight: 800; }
  .doc-header .org-sub  { font-size: 13.5px; }
  .doc-header .form-title {
    font-size: 15px; font-weight: 700; margin-top: 6px;
    padding: 5px 0;
  }

  /* แถวเลขที่ / วันที่ */
  .ref-row { display: flex; justify-content: space-between; font-size: 13px; margin: 12px 0 8px 0; }

  /* ตารางข้อมูลโครงการ */
  .info-table { width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; border: 1px solid #000; }
  .info-table td { padding: 6px 10px 14px 10px; font-size: 12.5px; vertical-align: top; border: 1px solid #000; line-height: 1.5; box-sizing: border-box; }
  .info-table .lbl { width: 180px; font-weight: 700; }

  /* หัวข้อ Section */
  .section-title {
    font-weight: 700; font-size: 13.5px; margin: 14px 0 4px 0;
  }

  /* ตารางเกณฑ์ */
  .criteria-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1px solid #000; }
  .criteria-table th { border: 1px solid #000; padding: 6px 10px 12px 10px; font-size: 12.5px; font-weight: 700; text-align: center; vertical-align: middle; line-height: 1.5; box-sizing: border-box; }
  .criteria-table td { border: 1px solid #000; padding: 6px 10px 14px 10px; font-size: 12.5px; vertical-align: top; line-height: 1.5; box-sizing: border-box; }

  /* กล่องข้อเสนอแนะ */
  .notes-box { min-height: 24px; padding: 6px 0 12px 0; font-size: 12.5px; white-space: pre-wrap; margin-top: 4px; line-height: 1.6; }

  /* กล่องข้อเสนอแนะรายข้อ (inline ในเกณฑ์) */
  .revision-box {
    margin-top: 6px; margin-bottom: 4px; padding: 0;
    font-size: 12px; line-height: 1.5;
  }

  /* ส่วนล่าง: สรุปผล + ลายเซ็น */
  .bottom-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; gap: 20px; page-break-inside: avoid; }
  .conclusion-block { flex: 1; }
  .checkbox-row { font-size: 12.5px; line-height: 1.8; margin-top: 5px; }

  /* บล็อกลายเซ็น */
  .sign-block { width: 320px; text-align: center; }
  .sign-line { border-bottom: 1px solid #000; margin: 40px auto 6px; width: 85%; }
  .sign-label { font-size: 12.5px; font-weight: 500; line-height: 1.5; }
`

// ─────────────────────────────────────────────────────────────────────────────
// buildSingleEvaluatorBlockHtml — HTML ของตารางเกณฑ์ผู้ประเมิน 1 ท่าน
// ─────────────────────────────────────────────────────────────────────────────
export function buildSingleEvaluatorBlockHtml(ev: EvaluatorBlockData): string {
  const criteriaRows = ev.criteria.map((c) => `
    <tr>
      <td>
        <div style="font-weight:600;">${c.label}</div>
        ${c.revisionDetail ? `
        <div class="revision-box">
          <strong>ข้อเสนอแนะ / รายละเอียดการแก้ไข:</strong> ${c.revisionDetail}
        </div>` : ''}
      </td>
      <td style="text-align:center;white-space:nowrap;font-weight:700;">
        ${c.scoreHtml}
      </td>
    </tr>`).join('')

  return `
    <div class="evaluator-block">
      <div class="section-title">ผลการพิจารณา: ผู้ประเมินที่ ${ev.index + 1}</div>
      <table class="info-table">
        <tr>
          <td class="lbl">ผลการประเมิน:</td>
          <td><strong>${ev.verdictLabel}</strong></td>
        </tr>
        <tr>
          <td class="lbl">ระดับความเสี่ยง:</td>
          <td>&#9745; ${ev.riskLabel}</td>
        </tr>
        <tr>
          <td class="lbl">รอบรายงานความก้าวหน้า:</td>
          <td>${ev.intervalLabel}</td>
        </tr>
      </table>
      <table class="criteria-table">
        <thead>
          <tr>
            <th style="width:75%;text-align:left;">เกณฑ์การพิจารณา และข้อเสนอแนะรายข้อ</th>
            <th style="width:25%;">ผลการพิจารณา</th>
          </tr>
        </thead>
        <tbody>${criteriaRows}</tbody>
      </table>
      <div class="section-title" style="margin-top:10px;">ข้อเสนอแนะเพิ่มเติมจากผู้ประเมินที่ ${ev.index + 1}</div>
      <div class="notes-box">${(ev.cleanNotes || 'ไม่มีข้อเสนอแนะเพิ่มเติม').replace(/\n/g, '<br/>')}</div>
    </div>`
}

// ─────────────────────────────────────────────────────────────────────────────
// buildDocumentHtml — สร้างหน้ากระดาษแบบแยกแต่ละหน้า (.pdf-page)
// ─────────────────────────────────────────────────────────────────────────────
export function buildDocumentHtml(data: TemplateData): string {
  const {
    thaiDate, submittedDate, thaiExpiryDate,
    projectTitle, submitterName, statusLabel, evaluatorBlocks,
  } = data

  const conclusionAndSignHtml = `
    <div class="bottom-section">
      <div class="conclusion-block">
        <div class="section-title" style="margin-top:0;">ผลการพิจารณาโดยรวม</div>
        <div class="checkbox-row">${statusLabel}</div>
      </div>
      <div class="sign-block">
        <div class="sign-line"></div>
        <div class="sign-label">(ผู้ช่วยศาสตราจารย์ ดร.อนุชา ไทยวงษ์)</div>
        <div class="sign-label"><strong>ประธานคณะกรรมการพิจารณาจริยธรรมการวิจัยในมนุษย์</strong></div>
        <div class="sign-label">วันที่ ...... / ...... / ......</div>
      </div>
    </div>
  `

  if (evaluatorBlocks.length === 0) {
    return `
      <style>${PDF_STYLES}</style>
      <div class="pdf-doc-container">
        <div class="pdf-page">
          <div class="doc-header">
            <div class="org-name">วิทยาลัยพยาบาลศรีมหาสารคาม</div>
            <div class="org-sub">สถาบันพระบรมราชชนก กระทรวงสาธารณสุข</div>
            <div class="form-title">แบบประเมินโครงร่างวิจัย &middot; คณะกรรมการจริยธรรมการวิจัยในมนุษย์ (IRB)</div>
          </div>
          <div class="ref-row">
            <span>เลขที่หนังสือ:&nbsp;............................................</span>
            <span>วันที่ประเมิน:&nbsp;<strong>${thaiDate}</strong></span>
          </div>
          <div class="section-title">ข้อมูลโครงการและขอบเขตการพิจารณา</div>
          <table class="info-table">
            <tr><td class="lbl">ชื่อโครงการวิจัย:</td><td colspan="3"><strong>${projectTitle}</strong></td></tr>
            <tr><td class="lbl">ผู้วิจัย / ผู้ยื่นคำขอ:</td><td>${submitterName}</td><td class="lbl">วันที่ยื่นคำขอ:</td><td>${submittedDate}</td></tr>
            <tr><td class="lbl">กำหนดส่งรายงานความก้าวหน้า:</td><td colspan="3">${thaiExpiryDate}</td></tr>
          </table>
          <div class="section-title">เกณฑ์การพิจารณาจริยธรรมการวิจัย และความเห็นผู้ประเมิน</div>
          <div class="notes-box">ยังไม่มีผลการประเมิน</div>
          ${conclusionAndSignHtml}
        </div>
      </div>
    `
  }

  const pagesHtml = evaluatorBlocks.map((ev, i) => {
    const isFirstPage = i === 0
    const isLastPage = i === evaluatorBlocks.length - 1

    return `
      <div class="pdf-page">
        ${isFirstPage ? `
          <div class="doc-header">
            <div class="org-name">วิทยาลัยพยาบาลศรีมหาสารคาม</div>
            <div class="org-sub">สถาบันพระบรมราชชนก กระทรวงสาธารณสุข</div>
            <div class="form-title">แบบประเมินโครงร่างวิจัย &middot; คณะกรรมการจริยธรรมการวิจัยในมนุษย์ (IRB)</div>
          </div>
          <div class="ref-row">
            <span>เลขที่หนังสือ:&nbsp;............................................</span>
            <span>วันที่ประเมิน:&nbsp;<strong>${thaiDate}</strong></span>
          </div>
          <div class="section-title">ข้อมูลโครงการและขอบเขตการพิจารณา</div>
          <table class="info-table">
            <tr><td class="lbl">ชื่อโครงการวิจัย:</td><td colspan="3"><strong>${projectTitle}</strong></td></tr>
            <tr><td class="lbl">ผู้วิจัย / ผู้ยื่นคำขอ:</td><td>${submitterName}</td><td class="lbl">วันที่ยื่นคำขอ:</td><td>${submittedDate}</td></tr>
            <tr><td class="lbl">กำหนดส่งรายงานความก้าวหน้า:</td><td colspan="3">${thaiExpiryDate}</td></tr>
          </table>
        ` : `
          <div class="doc-header" style="margin-bottom:8px;">
            <div class="org-name" style="font-size:16px;">วิทยาลัยพยาบาลศรีมหาสารคาม</div>
            <div class="form-title" style="font-size:13.5px;margin-top:2px;">แบบประเมินโครงร่างวิจัย &middot; คณะกรรมการจริยธรรมการวิจัยในมนุษย์ (IRB)</div>
          </div>
          <table class="info-table" style="margin-bottom:8px;">
            <tr><td class="lbl" style="width:140px;">โครงการวิจัย:</td><td><strong>${projectTitle}</strong></td></tr>
            <tr><td class="lbl" style="width:140px;">ผู้วิจัย:</td><td>${submitterName}</td></tr>
          </table>
        `}

        ${buildSingleEvaluatorBlockHtml(ev)}

        ${isLastPage ? conclusionAndSignHtml : ''}
      </div>
    `
  }).join('')

  return `
    <style>${PDF_STYLES}</style>
    <div class="pdf-doc-container">
      ${pagesHtml}
    </div>
  `
}

