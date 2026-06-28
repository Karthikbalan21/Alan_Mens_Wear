import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { FiDownload, FiFileText, FiPrinter } from 'react-icons/fi'
import { toast } from 'react-toastify'

function ExportButtons({ orders, summary, formatCurrency, formatDate }) {
  const exportRows = orders.map((order) => ({
    'Order ID': order.orderId,
    'Customer Name': order.customerName,
    'Products Purchased': order.products.map((product) => product.name).join(', '),
    Quantity: order.quantity,
    'Total Amount': order.totalAmount,
    'Payment Status': order.paymentStatus,
    'Order Status': order.orderStatus,
    'Order Date': formatDate(order.date),
  }))

  const handlePdf = () => {
    if (!orders.length) {
      toast.info('No sales data to export.')
      return
    }

    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(18)
    doc.text('Alan Mens Wear - Sales Report', 14, 18)
    doc.setFontSize(10)
    doc.text(`Gross Revenue: ${formatCurrency(summary.grossRevenue)}`, 14, 28)
    doc.text(`Products Sold: ${summary.totalProductsSold}`, 94, 28)
    doc.text(`Customers Purchased: ${summary.totalCustomersPurchased}`, 146, 28)

    autoTable(doc, {
      startY: 36,
      head: [Object.keys(exportRows[0])],
      body: exportRows.map((row) => Object.values(row)),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [18, 24, 38] },
    })

    doc.save('alan-mens-wear-sales-report.pdf')
    toast.success('PDF report downloaded.')
  }

  const handleExcel = () => {
    if (!orders.length) {
      toast.info('No sales data to export.')
      return
    }

    const workbook = XLSX.utils.book_new()
    const reportSheet = XLSX.utils.json_to_sheet(exportRows)
    const summarySheet = XLSX.utils.json_to_sheet([
      {
        'Gross Revenue': summary.grossRevenue,
        'Total Products Sold': summary.totalProductsSold,
        'Total Customers Purchased': summary.totalCustomersPurchased,
        'Highest Selling Product': summary.highestSellingProduct,
        'Lowest Selling Product': summary.lowestSellingProduct,
      },
    ])

    XLSX.utils.book_append_sheet(workbook, reportSheet, 'Sales Report')
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    XLSX.writeFile(workbook, 'alan-mens-wear-sales-report.xlsx')
    toast.success('Excel report downloaded.')
  }

  return (
    <div className="sales-export-actions">
      <button type="button" onClick={handlePdf} disabled={!orders.length}>
        <FiFileText aria-hidden />
        PDF
      </button>
      <button type="button" onClick={handleExcel} disabled={!orders.length}>
        <FiDownload aria-hidden />
        Excel
      </button>
      <button type="button" onClick={() => window.print()} disabled={!orders.length}>
        <FiPrinter aria-hidden />
        Print
      </button>
    </div>
  )
}

export default ExportButtons
