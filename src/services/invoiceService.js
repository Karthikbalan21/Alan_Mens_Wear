import { jsPDF } from 'jspdf'

const formatCurrency = (amount) => `INR ${Number(amount || 0).toLocaleString('en-IN')}`

const formatDate = (value) => {
  const date = value?.toDate?.() || value || new Date()
  return new Date(date).toLocaleDateString('en-IN')
}

export function downloadInvoice(order) {
  const invoice = new jsPDF()
  const pageWidth = invoice.internal.pageSize.getWidth()
  const margin = 18
  let y = 20

  invoice.setFont('helvetica', 'bold')
  invoice.setFontSize(20)
  invoice.text('Alan Mens Wear', margin, y)

  invoice.setFontSize(15)
  invoice.text('Invoice', pageWidth - margin, y, { align: 'right' })

  y += 14
  invoice.setFont('helvetica', 'normal')
  invoice.setFontSize(11)
  invoice.text(`Order ID: ${order.id}`, margin, y)
  y += 8
  invoice.text(`Customer Name: ${order.customerName || 'Customer'}`, margin, y)
  y += 8
  invoice.text(`Date: ${formatDate(order.createdAt)}`, margin, y)
  y += 12

  invoice.setDrawColor(210, 215, 222)
  invoice.line(margin, y, pageWidth - margin, y)
  y += 10

  invoice.setFont('helvetica', 'bold')
  invoice.text('Product Name', margin, y)
  invoice.text('Qty', 128, y)
  invoice.text('Amount', pageWidth - margin, y, { align: 'right' })
  y += 7

  invoice.setFont('helvetica', 'normal')
  order.items?.forEach((item) => {
    const lineTotal = Number(item.price || 0) * Number(item.quantity || 0)
    const productLines = invoice.splitTextToSize(item.name, 86)

    invoice.text(productLines, margin, y)
    invoice.text(String(item.quantity), 130, y)
    invoice.text(formatCurrency(lineTotal), pageWidth - margin, y, { align: 'right' })
    y += Math.max(productLines.length * 6, 8)

    if (y > 270) {
      invoice.addPage()
      y = 20
    }
  })

  y += 4
  invoice.line(margin, y, pageWidth - margin, y)
  y += 10

  invoice.setFont('helvetica', 'bold')
  invoice.setFontSize(13)
  invoice.text('Total Amount', 118, y)
  invoice.text(formatCurrency(order.totalAmount), pageWidth - margin, y, {
    align: 'right',
  })

  y += 18
  invoice.setFont('helvetica', 'normal')
  invoice.setFontSize(10)
  invoice.text('Thank you for shopping with Alan Mens Wear.', margin, y)

  invoice.save(`alan-mens-wear-invoice-${order.id.slice(0, 8)}.pdf`)
}
