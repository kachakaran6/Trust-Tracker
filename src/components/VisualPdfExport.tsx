/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef } from "react";
import { format, parseISO } from "date-fns";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import Chart from "chart.js/auto";

(pdfMake as any).vfs = (pdfFonts as any).vfs;

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category_id: string | null;
  created_at: string;
  description?: string;
}

interface VisualPdfExportProps {
  totalIncome: number;
  totalExpense: number;
  filteredTransactions: Transaction[];
  formatCurrency: (amount: number) => string;
  getCategoryName: (id: string | null) => string;
  logoBase64?: string;
}

const VisualPdfExport = ({
  totalIncome,
  totalExpense,
  filteredTransactions,
  formatCurrency,
  getCategoryName,
  logoBase64,
}: VisualPdfExportProps) => {
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  const createChartBase64 = (): string | null => {
    const canvas = hiddenCanvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const incomeSum = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((acc, cur) => acc + cur.amount, 0);
    const expenseSum = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, cur) => acc + cur.amount, 0);

    // Create temporary chart (no animation, no legend)
    const chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Income", "Expense"],
        datasets: [
          {
            data: [incomeSum, expenseSum],
            backgroundColor: ["#4caf50", "#f44336"],
          },
        ],
      },
      options: {
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    });

    const base64 = canvas.toDataURL("image/png");
    chart.destroy();

    return base64;
  };

  const handleExport = () => {
    const chartBase64 = createChartBase64();
    if (!chartBase64) {
      alert("Could not generate chart");
      return;
    }

    const incomeRows = filteredTransactions
      .filter((t) => t.type === "income")
      .map((t) => [
        format(parseISO(t.created_at), "yyyy-MM-dd"),
        getCategoryName(t.category_id),
        formatCurrency(t.amount),
        t.description || "",
      ]);

    const expenseRows = filteredTransactions
      .filter((t) => t.type === "expense")
      .map((t) => [
        format(parseISO(t.created_at), "yyyy-MM-dd"),
        getCategoryName(t.category_id),
        formatCurrency(t.amount),
        t.description || "",
      ]);

    const netBalance = totalIncome - totalExpense;

    const docDefinition = {
      pageMargins: [40, 60, 40, 60],

      content: [
        {
          columns: [
            logoBase64
              ? { image: logoBase64, width: 60, margin: [0, 0, 20, 0] }
              : {},
            {
              stack: [
                { text: "Fintica", style: "brandName" },
                { text: "Transactions Report", style: "reportTitle" },
                {
                  text: `Generated on: ${new Date().toLocaleDateString()}`,
                  style: "reportDate",
                },
              ],
              alignment: "right",
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20],
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 1,
              lineColor: "#ddd",
            },
          ],
        },

        { text: "Income Transactions", style: "sectionHeader" },
        {
          style: "card",
          table: {
            headerRows: 1,
            widths: ["auto", "*", "auto", "*"],
            body: [
              [
                { text: "Date", style: "tableHeader" },
                { text: "Category", style: "tableHeader" },
                { text: "Amount", style: "tableHeader" },
                { text: "Description", style: "tableHeader" },
              ],
              ...incomeRows.map((row, idx) =>
                row.map((cell) => ({
                  text: cell,
                  margin: [4, 6, 4, 6],
                  fillColor: idx % 2 === 0 ? "#e3f2fd" : "#ffffff",
                }))
              ),
            ],
          },
          layout: {
            fillColor: (rowIndex: number) =>
              rowIndex === 0 ? "#bbdefb" : null,
            hLineWidth: () => 0.6,
            vLineWidth: () => 0.6,
            hLineColor: () => "#90caf9",
            vLineColor: () => "#90caf9",
            paddingLeft: () => 12,
            paddingRight: () => 12,
            paddingTop: () => 8,
            paddingBottom: () => 8,
          },
        },
        {
          text: `Total Income: ${formatCurrency(totalIncome)}`,
          style: "highlightBox",
        },

        {
          text: "Expense Transactions",
          style: "sectionHeader",
          margin: [0, 30, 0, 10],
        },
        {
          style: "card",
          table: {
            headerRows: 1,
            widths: ["auto", "*", "auto", "*"],
            body: [
              [
                { text: "Date", style: "tableHeader" },
                { text: "Category", style: "tableHeader" },
                { text: "Amount", style: "tableHeader" },
                { text: "Description", style: "tableHeader" },
              ],
              ...expenseRows.map((row, idx) =>
                row.map((cell) => ({
                  text: cell,
                  margin: [4, 6, 4, 6],
                  fillColor: idx % 2 === 0 ? "#fff3e0" : "#ffffff",
                }))
              ),
            ],
          },
          layout: {
            fillColor: (rowIndex: number) =>
              rowIndex === 0 ? "#ffe0b2" : null,
            hLineWidth: () => 0.6,
            vLineWidth: () => 0.6,
            hLineColor: () => "#ffcc80",
            vLineColor: () => "#ffcc80",
            paddingLeft: () => 12,
            paddingRight: () => 12,
            paddingTop: () => 8,
            paddingBottom: () => 8,
          },
        },
        {
          text: `Total Expense: ${formatCurrency(totalExpense)}`,
          style: "highlightBox",
        },

        {
          text: `Net Balance: ${formatCurrency(netBalance)}`,
          style: netBalance >= 0 ? "successBox" : "warningBox",
          margin: [0, 30, 0, 0],
        },
        {
          image: chartBase64,
          width: 50,
          alignment: "center",
          margin: [0, 0, 0, 20],
        },
      ],

      styles: {
        brandName: { fontSize: 24, bold: true, color: "#0d47a1" },
        reportTitle: {
          fontSize: 16,
          bold: true,
          color: "#37474f",
          margin: [0, 6, 0, 2],
        },
        reportDate: { fontSize: 11, color: "#757575", margin: [0, 0, 0, 10] },
        sectionHeader: {
          fontSize: 18,
          bold: true,
          color: "#1565c0",
          margin: [0, 20, 0, 10],
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: "#0d47a1",
          margin: [0, 5, 0, 5],
        },
        card: { margin: [0, 0, 0, 15] },
        highlightBox: {
          fontSize: 14,
          bold: true,
          color: "#0d47a1",
          decoration: "underline",
          margin: [0, 10, 0, 10],
        },
        successBox: {
          fontSize: 14,
          bold: true,
          color: "#2e7d32",
          margin: [0, 20, 0, 0],
        },
        warningBox: {
          fontSize: 14,
          bold: true,
          color: "#c62828",
          margin: [0, 20, 0, 0],
        },
      },

      defaultStyle: {
        fontSize: 11,
        color: "#333",
      },
    };

    pdfMake
      .createPdf(docDefinition)
      .download("Fintica_Transactions_Report.pdf");
  };

  return (
    <>
      {/* Hidden canvas for chart rendering */}
      <canvas
        ref={hiddenCanvasRef}
        width={400}
        height={300}
        style={{ display: "none" }}
      />

      {/* Export button */}
      <button
        onClick={handleExport}
        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
      >
        Export to PDF (Visual)
      </button>
    </>
  );
};

export default VisualPdfExport;
