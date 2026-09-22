import { jsPDF } from "jspdf";
import { APP_NAME } from "@/lib/brand";
import { wheelPdfPageLabel } from "./pdf-title";

const MARGIN = 10;
const HEADER_BLOCK = 16;
const FOOTER_BLOCK = 10;

type SaveWheelPdfOptions = {
  tableNode: HTMLElement;
  chartNode: HTMLElement | null;
  filename: string;
  title: string;
  subtitle: string;
};

type PageBox = {
  pageWidth: number;
  pageHeight: number;
  contentTop: number;
  contentWidth: number;
  contentHeight: number;
};

export async function saveWheelPdf({
  tableNode,
  chartNode,
  filename,
  title,
  subtitle,
}: SaveWheelPdfOptions) {
  const html2canvas = (await import("html2canvas")).default;

  const capture = (node: HTMLElement) =>
    html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });

  const tableCanvas = await capture(tableNode);
  const chartCanvas = chartNode ? await capture(chartNode) : null;

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const box = pageBox(pdf);
  const tableSlices = sliceCount(tableCanvas, box);
  const chartPages = chartCanvas ? 1 : 0;
  const totalPages = Math.max(1, tableSlices + chartPages);

  let page = 1;
  addSlicedImage(pdf, tableCanvas, box, () => {
    drawChrome(pdf, box, title, subtitle, page, totalPages);
    page += 1;
  });

  if (chartCanvas) {
    if (page > 1) {
      pdf.addPage();
    }
    addFittedImage(pdf, chartCanvas, box);
    drawChrome(pdf, box, title, subtitle, page, totalPages);
  }

  pdf.save(filename);
}

function pageBox(pdf: jsPDF): PageBox {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  return {
    pageWidth,
    pageHeight,
    contentTop: MARGIN + HEADER_BLOCK,
    contentWidth: pageWidth - MARGIN * 2,
    contentHeight: pageHeight - MARGIN * 2 - HEADER_BLOCK - FOOTER_BLOCK,
  };
}

function sliceCount(canvas: HTMLCanvasElement, box: PageBox) {
  const imgHeight = (canvas.height * box.contentWidth) / canvas.width;
  return Math.max(1, Math.ceil(imgHeight / box.contentHeight - 1e-6));
}

function addSlicedImage(
  pdf: jsPDF,
  canvas: HTMLCanvasElement,
  box: PageBox,
  onPage: () => void,
) {
  const pxPerMm = canvas.width / box.contentWidth;
  const slicePx = Math.max(1, Math.floor(box.contentHeight * pxPerMm));
  let sourceY = 0;
  let first = true;

  while (sourceY < canvas.height) {
    if (!first) {
      pdf.addPage();
    }
    first = false;
    const heightPx = Math.min(slicePx, canvas.height - sourceY);
    const slice = sliceCanvas(canvas, sourceY, heightPx);
    const heightMm = heightPx / pxPerMm;
    pdf.addImage(
      slice,
      "PNG",
      MARGIN,
      box.contentTop,
      box.contentWidth,
      heightMm,
    );
    onPage();
    sourceY += heightPx;
  }
}

function addFittedImage(pdf: jsPDF, canvas: HTMLCanvasElement, box: PageBox) {
  let width = box.contentWidth;
  let height = (canvas.height * width) / canvas.width;
  if (height > box.contentHeight) {
    height = box.contentHeight;
    width = (canvas.width * height) / canvas.height;
  }
  const x = MARGIN + (box.contentWidth - width) / 2;
  const y = box.contentTop + (box.contentHeight - height) / 2;
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, y, width, height);
}

function sliceCanvas(canvas: HTMLCanvasElement, sourceY: number, heightPx: number) {
  const slice = document.createElement("canvas");
  slice.width = canvas.width;
  slice.height = heightPx;
  const context = slice.getContext("2d");
  if (!context) {
    throw new Error("Could not slice the page image.");
  }
  context.drawImage(
    canvas,
    0,
    sourceY,
    canvas.width,
    heightPx,
    0,
    0,
    canvas.width,
    heightPx,
  );
  return slice.toDataURL("image/png");
}

function drawChrome(
  pdf: jsPDF,
  box: PageBox,
  title: string,
  subtitle: string,
  page: number,
  totalPages: number,
) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(37, 34, 30);
  pdf.text(title, MARGIN, MARGIN + 5);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(92, 86, 76);
  pdf.text(subtitle, MARGIN, MARGIN + 11);

  const footerY = box.pageHeight - MARGIN + 1;
  pdf.setFontSize(8);
  pdf.setTextColor(92, 86, 76);
  pdf.text(APP_NAME, MARGIN, footerY);
  pdf.text(wheelPdfPageLabel(page, totalPages), box.pageWidth - MARGIN, footerY, {
    align: "right",
  });
}
