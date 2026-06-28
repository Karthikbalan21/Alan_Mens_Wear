import { useEffect, useMemo, useRef } from 'react'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  ArcElement,
  PieController,
  PointElement,
  Tooltip,
} from 'chart.js'

Chart.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PieController,
  PointElement,
  Tooltip,
)

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const palette = ['#101827', '#c9a15a', '#2f8f83', '#7c5cff', '#e46651', '#3887be', '#d8618c', '#6a7f4e']

function CanvasChart({ title, type, data, options }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined
    }

    const chart = new Chart(canvasRef.current, {
      type,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: type === 'pie', position: 'bottom' },
          tooltip: { intersect: false, mode: 'index' },
        },
        scales: type === 'pie' ? undefined : {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: 'rgba(100, 116, 139, 0.16)' } },
        },
        ...options,
      },
    })

    return () => chart.destroy()
  }, [data, options, type])

  return (
    <article className="sales-chart-card sales-glass-card">
      <h3>{title}</h3>
      <div className="sales-chart-canvas">
        <canvas ref={canvasRef} aria-label={title} />
      </div>
    </article>
  )
}

function SalesCharts({ orders, productStats }) {
  const monthly = useMemo(() => {
    const revenue = Array(12).fill(0)
    const count = Array(12).fill(0)

    orders.forEach((order) => {
      const month = order.date.getMonth()
      revenue[month] += order.totalAmount
      count[month] += 1
    })

    return { revenue, count }
  }, [orders])

  const categoryStats = useMemo(() => {
    const categories = new Map()

    orders.forEach((order) => {
      order.products.forEach((product) => {
        const category = product.category || 'Uncategorized'
        categories.set(category, (categories.get(category) || 0) + product.revenue)
      })
    })

    return Array.from(categories, ([category, revenue]) => ({ category, revenue }))
      .sort((first, second) => second.revenue - first.revenue)
  }, [orders])

  const topProducts = productStats.slice(0, 7)

  return (
    <section className="sales-charts-grid">
      <CanvasChart
        title="Monthly Revenue"
        type="bar"
        data={{
          labels: monthLabels,
          datasets: [{
            label: 'Revenue',
            data: monthly.revenue,
            backgroundColor: '#c9a15a',
            borderRadius: 8,
          }],
        }}
      />
      <CanvasChart
        title="Orders Per Month"
        type="line"
        data={{
          labels: monthLabels,
          datasets: [{
            label: 'Orders',
            data: monthly.count,
            borderColor: '#2f8f83',
            backgroundColor: 'rgba(47, 143, 131, 0.14)',
            fill: true,
            tension: 0.36,
          }],
        }}
      />
      <CanvasChart
        title="Top Selling Products"
        type="bar"
        data={{
          labels: topProducts.map((product) => product.name),
          datasets: [{
            label: 'Units Sold',
            data: topProducts.map((product) => product.unitsSold),
            backgroundColor: '#101827',
            borderRadius: 8,
          }],
        }}
        options={{ indexAxis: 'y' }}
      />
      <CanvasChart
        title="Sales by Category"
        type="pie"
        data={{
          labels: categoryStats.map((category) => category.category),
          datasets: [{
            data: categoryStats.map((category) => category.revenue),
            backgroundColor: categoryStats.map((_, index) => palette[index % palette.length]),
          }],
        }}
      />
    </section>
  )
}

export default SalesCharts
