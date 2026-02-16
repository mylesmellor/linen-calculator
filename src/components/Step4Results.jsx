import { useRef, useState } from 'react'
import { ChevronLeft, Download, Printer, Mail, FileSpreadsheet, PoundSterling, ChevronDown, ChevronUp } from 'lucide-react'
import { LINEN_CATEGORIES, DEFAULT_LINEN_ITEMS } from '../data/defaultData'

export default function Step4Results({
  properties,
  activeItems,
  parLevel,
  calculations,
  unitPrices,
  updateUnitPrice,
  margin,
  setMargin,
  onPrev,
}) {
  const resultsRef = useRef(null)
  const { propertyResults, grandTotals, grandTotal, grandTotalBeforePar, grandTotalCost, grandTotalChargeToOwner, grandTotalInStock, grandTotalToOrder, grandTotalOrderCost } = calculations
  const [costOpen, setCostOpen] = useState(true)

  const fmtCurrency = (val) =>
    val.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })

  const hasPrices = Object.values(unitPrices).some((p) => p > 0)
  const hasInventory = grandTotalInStock > 0

  const handlePrint = () => window.print()

  // --- CSV Export ---
  const handleExportCSV = () => {
    const headers = ['Item', ...propertyResults.map((p) => p.name || 'Unnamed'), 'Total']
    if (hasPrices) headers.push('Unit Price', 'Est. Cost')

    const rows = activeItems.map((item) => {
      const row = [
        `"${item}"`,
        ...propertyResults.map((pr) => pr.itemResults[item]?.withPar || 0),
        grandTotals[item]?.total || 0,
      ]
      if (hasPrices) {
        const price = unitPrices[item] || 0
        row.push(price.toFixed(2), (grandTotals[item]?.cost || 0).toFixed(2))
      }
      return row.join(',')
    })

    // Totals row
    const totalRow = [
      '"TOTAL"',
      ...propertyResults.map((pr) => pr.propertyTotal),
      grandTotal,
    ]
    if (hasPrices) {
      totalRow.push('', grandTotalCost.toFixed(2))
    }
    rows.push(totalRow.join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'linen-calculator-results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- PDF Export ---
  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default

    const pdf = new jsPDF('l', 'mm', 'a4')
    const now = new Date().toLocaleDateString()

    pdf.setFontSize(20)
    pdf.setTextColor(30, 64, 175)
    pdf.text('Linen Calculator Results', 14, 20)
    pdf.setFontSize(10)
    pdf.setTextColor(100)
    const subtitle = `Generated: ${now}  |  PAR Level: ${parLevel}x  |  Total Items: ${grandTotal}${hasPrices ? `  |  Est. Cost: ${fmtCurrency(grandTotalCost)}` : ''}`
    pdf.text(subtitle, 14, 28)

    // Table 1: Breakdown by property
    const propHeaders = ['Item', ...propertyResults.map((p) => `${p.name || 'Unnamed'}\n(${p.stays} stays)`), 'TOTAL']
    if (hasPrices) propHeaders.push('Unit Price', 'Est. Cost')

    const propBody = activeItems.map((item) => {
      const row = [item]
      propertyResults.forEach((pr) => {
        const val = pr.itemResults[item]?.withPar || 0
        row.push(val > 0 ? String(val) : '-')
      })
      row.push(String(grandTotals[item]?.total || 0))
      if (hasPrices) {
        const price = unitPrices[item] || 0
        row.push(price > 0 ? fmtCurrency(price) : '-')
        row.push(grandTotals[item]?.cost > 0 ? fmtCurrency(grandTotals[item].cost) : '-')
      }
      return row
    })
    const totalPdfRow = ['TOTAL', ...propertyResults.map((pr) => String(pr.propertyTotal)), String(grandTotal)]
    if (hasPrices) totalPdfRow.push('', fmtCurrency(grandTotalCost))
    propBody.push(totalPdfRow)

    autoTable(pdf, {
      startY: 34,
      head: [propHeaders],
      body: propBody,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
      didParseCell: (data) => {
        if (data.row.index === propBody.length - 1) {
          data.cell.styles.fillColor = [219, 234, 254]
          data.cell.styles.fontStyle = 'bold'
        }
        if (data.column.index === propHeaders.indexOf('TOTAL') && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.textColor = [30, 64, 175]
        }
      },
    })

    pdf.save('linen-calculator-results.pdf')
    return pdf
  }

  // --- Email ---
  const buildEmailBody = () => {
    const totalStays = properties.reduce((s, p) => s + p.stays, 0)
    const lines = [
      'Linen Calculator Report',
      `Date: ${new Date().toLocaleDateString()}`,
      `PAR Level: ${parLevel}x`,
      `Properties: ${properties.length} | Total Stays: ${totalStays}`,
      '',
      '--- Order Summary ---',
      '',
    ]

    activeItems
      .filter((item) => grandTotals[item]?.total > 0)
      .forEach((item) => {
        const total = grandTotals[item]?.total || 0
        const isCustom = !DEFAULT_LINEN_ITEMS.includes(item)
        const cost = grandTotals[item]?.cost || 0
        let line = `${item}${isCustom ? ' [Custom]' : ''}: ${total}`
        if (cost > 0) line += ` (${fmtCurrency(cost)})`
        lines.push(line)
      })

    lines.push('', `GRAND TOTAL: ${grandTotal} items`)
    if (hasPrices) lines.push(`ESTIMATED COST: ${fmtCurrency(grandTotalCost)}`)
    lines.push('', '(PDF report attached separately)')
    return lines.join('\n')
  }

  const handleEmailReport = async () => {
    await handleExportPDF()
    const subject = encodeURIComponent(`Linen Calculator Report - ${new Date().toLocaleDateString()}`)
    const body = encodeURIComponent(buildEmailBody())
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  // Helpers
  const maxTotal = Math.max(...Object.values(grandTotals).map((g) => g.total), 1)

  const getCategoryForItem = (item) => {
    for (const [, cat] of Object.entries(LINEN_CATEGORIES)) {
      if (cat.items.includes(item)) return cat.label
    }
    return 'Custom'
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Results Summary</h2>
        <p className="text-gray-500 mt-1">Complete breakdown of your linen requirements</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
        >
          <Printer size={18} />
          Print
        </button>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
        >
          <Download size={18} />
          Export PDF
        </button>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
        >
          <FileSpreadsheet size={18} />
          Export CSV
        </button>
        <button
          onClick={handleEmailReport}
          className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-all"
        >
          <Mail size={18} />
          Email Report
        </button>
      </div>

      <div ref={resultsRef} className="space-y-6">
        {/* Summary cards */}
        <div className={`grid grid-cols-2 ${hasPrices ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-4`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
            <div className="text-3xl font-bold text-primary-600">{grandTotal.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Total Items</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
            <div className="text-3xl font-bold text-gray-700">{properties.length}</div>
            <div className="text-sm text-gray-500 mt-1">Properties</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
            <div className="text-3xl font-bold text-gray-700">
              {properties.reduce((s, p) => s + p.stays, 0)}
            </div>
            <div className="text-sm text-gray-500 mt-1">Total Stays</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
            <div className="text-3xl font-bold text-accent-600">{parLevel}x</div>
            <div className="text-sm text-gray-500 mt-1">PAR Level</div>
          </div>
          {hasPrices && (
            <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-200 p-5 text-center">
              <div className="text-2xl font-bold text-emerald-600">{fmtCurrency(grandTotalCost)}</div>
              <div className="text-sm text-gray-500 mt-1">Est. Cost</div>
            </div>
          )}
        </div>

        {/* Inventory / To Order summary */}
        {hasInventory && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-orange-500">&#128230;</span>
              Stock vs. Required
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="p-4 bg-primary-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary-700">{grandTotal.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Total Required</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{grandTotalInStock.toLocaleString()}</div>
                <div className="text-xs text-gray-500">In Stock</div>
              </div>
              <div className={`p-4 rounded-lg text-center ${grandTotalToOrder > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className={`text-2xl font-bold ${grandTotalToOrder > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {grandTotalToOrder.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">To Order</div>
              </div>
              {hasPrices && (
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-emerald-600">{fmtCurrency(grandTotalOrderCost)}</div>
                  <div className="text-xs text-gray-500">Order Cost</div>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">Item</th>
                    <th className="text-center px-3 py-2 font-semibold text-primary-700">Required</th>
                    <th className="text-center px-3 py-2 font-semibold text-orange-600">In Stock</th>
                    <th className="text-center px-3 py-2 font-semibold text-red-600">To Order</th>
                    {hasPrices && (
                      <th className="text-center px-3 py-2 font-semibold text-emerald-700">Order Cost</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {activeItems
                    .filter((item) => grandTotals[item]?.total > 0 || grandTotals[item]?.inStock > 0)
                    .map((item, idx) => {
                      const g = grandTotals[item]
                      const sufficient = g.toOrder === 0
                      return (
                        <tr
                          key={item}
                          className={`border-b border-gray-100 ${sufficient ? 'bg-green-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <td className="px-4 py-2 font-medium text-gray-700">
                            <span className="flex items-center gap-1.5">
                              {item}
                              {!DEFAULT_LINEN_ITEMS.includes(item) && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded shrink-0">Custom</span>
                              )}
                              {sufficient && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-green-200 text-green-700 px-1.5 py-0.5 rounded shrink-0">Stocked</span>
                              )}
                            </span>
                          </td>
                          <td className="text-center px-3 py-2 text-gray-600">{g.total}</td>
                          <td className="text-center px-3 py-2 text-orange-600 font-medium">{g.inStock}</td>
                          <td className={`text-center px-3 py-2 font-bold ${g.toOrder > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {g.toOrder > 0 ? g.toOrder : '0'}
                          </td>
                          {hasPrices && (
                            <td className="text-center px-3 py-2 text-emerald-700 font-medium">
                              {g.orderCost > 0 ? fmtCurrency(g.orderCost) : '-'}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                    <td className="px-4 py-2 text-gray-800">TOTAL</td>
                    <td className="text-center px-3 py-2 text-primary-700">{grandTotal}</td>
                    <td className="text-center px-3 py-2 text-orange-600">{grandTotalInStock}</td>
                    <td className={`text-center px-3 py-2 ${grandTotalToOrder > 0 ? 'text-red-600' : 'text-green-600'}`}>{grandTotalToOrder}</td>
                    {hasPrices && (
                      <td className="text-center px-3 py-2 text-emerald-700">{fmtCurrency(grandTotalOrderCost)}</td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cost Estimation */}
        <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-300 ring-1 ring-emerald-100 overflow-hidden no-print">
          <button
            onClick={() => setCostOpen(!costOpen)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <PoundSterling size={20} className="text-emerald-600" />
              <span className="font-semibold text-gray-800">Cost Estimation</span>
              {hasPrices && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  {fmtCurrency(grandTotalCost)}
                </span>
              )}
            </div>
            {costOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {costOpen && (
            <div className="border-t border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-4">
                Enter unit prices to estimate total costs. Prices are saved and included in exports.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeItems
                  .filter((item) => grandTotals[item]?.total > 0)
                  .map((item) => {
                    const price = unitPrices[item] || ''
                    const total = grandTotals[item]?.total || 0
                    const cost = (parseFloat(price) || 0) * total

                    return (
                      <div key={item} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-700 truncate">{item}</div>
                          <div className="text-xs text-gray-400">
                            {total} items
                            {cost > 0 && (
                              <span className="text-emerald-600 font-medium"> = {fmtCurrency(cost)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-gray-400 text-sm">&pound;</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => updateUnitPrice(item, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-20 px-2 py-1.5 border border-gray-300 rounded-md text-right text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
              {hasPrices && (
                <div className="mt-4 space-y-3">
                  {/* Margin input */}
                  <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="font-semibold text-gray-700">Owner Margin</div>
                        <div className="text-xs text-gray-500">Markup applied to cost price when charging property owners</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="200"
                          step="1"
                          value={margin}
                          onChange={(e) => setMargin(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                        <span className="text-gray-600 font-medium text-lg">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost summary */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <span className="font-semibold text-emerald-800">Your Cost</span>
                    <span className="text-2xl font-bold text-emerald-700">{fmtCurrency(grandTotalCost)}</span>
                  </div>
                  <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-amber-800">Charge to Owners</span>
                      <span className="text-xs text-amber-600 ml-2">({margin}% margin)</span>
                    </div>
                    <span className="text-2xl font-bold text-amber-700">{fmtCurrency(grandTotalChargeToOwner)}</span>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-sm">
                    <span className="text-gray-600">Margin earned</span>
                    <span className="font-semibold text-gray-700">{fmtCurrency(grandTotalChargeToOwner - grandTotalCost)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visual bar chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Items Breakdown</h3>
          <div className="space-y-3">
            {activeItems
              .filter((item) => grandTotals[item]?.total > 0)
              .sort((a, b) => (grandTotals[b]?.total || 0) - (grandTotals[a]?.total || 0))
              .map((item) => {
                const total = grandTotals[item]?.total || 0
                const pct = (total / maxTotal) * 100
                return (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-40 sm:w-52 text-sm text-gray-600 truncate shrink-0 flex items-center gap-1.5">
                      {item}
                      {!DEFAULT_LINEN_ITEMS.includes(item) && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded shrink-0">Custom</span>
                      )}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-primary-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{total}</span>
                      </div>
                    </div>
                    {hasPrices && (unitPrices[item] || 0) > 0 && (
                      <span className="text-xs text-emerald-600 font-medium w-20 text-right shrink-0">
                        {fmtCurrency(grandTotals[item]?.cost || 0)}
                      </span>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        {/* Cost by property */}
        {hasPrices && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-200 overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-800 p-6 pb-3 flex items-center gap-2">
              <PoundSterling size={20} className="text-emerald-600" />
              Cost &amp; Charges by Property
              <span className="text-sm font-normal text-gray-400 ml-1">({margin}% margin)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Property</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Stays</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Items</th>
                    <th className="text-center px-4 py-3 font-semibold text-emerald-700 bg-emerald-50">Your Cost</th>
                    <th className="text-center px-4 py-3 font-semibold text-amber-700 bg-amber-50">Charge to Owner</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Margin Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyResults.map((pr, idx) => {
                    const prMargin = pr.propertyChargeToOwner - pr.propertyCost
                    return (
                      <tr
                        key={pr.id}
                        className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">{pr.name || 'Unnamed'}</td>
                        <td className="text-center px-4 py-3 text-gray-600">{pr.stays}</td>
                        <td className="text-center px-4 py-3 text-gray-600">{pr.propertyTotal}</td>
                        <td className="text-center px-4 py-3 font-semibold text-emerald-700 bg-emerald-50">
                          {pr.propertyCost > 0 ? fmtCurrency(pr.propertyCost) : '-'}
                        </td>
                        <td className="text-center px-4 py-3 font-bold text-amber-700 bg-amber-50">
                          {pr.propertyChargeToOwner > 0 ? fmtCurrency(pr.propertyChargeToOwner) : '-'}
                        </td>
                        <td className="text-center px-4 py-3 text-gray-700">
                          {prMargin > 0 ? fmtCurrency(prMargin) : '-'}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-emerald-50 border-t-2 border-emerald-200 font-bold">
                    <td className="px-4 py-3 text-emerald-800">TOTAL</td>
                    <td className="text-center px-4 py-3 text-gray-700">
                      {properties.reduce((s, p) => s + p.stays, 0)}
                    </td>
                    <td className="text-center px-4 py-3 text-gray-700">{grandTotal}</td>
                    <td className="text-center px-4 py-3 text-emerald-800 bg-emerald-100">{fmtCurrency(grandTotalCost)}</td>
                    <td className="text-center px-4 py-3 text-amber-800 bg-amber-100">{fmtCurrency(grandTotalChargeToOwner)}</td>
                    <td className="text-center px-4 py-3 text-gray-800">{fmtCurrency(grandTotalChargeToOwner - grandTotalCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed table - per property */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-800 p-6 pb-3">
            Detailed Breakdown by Property
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 sticky left-0 bg-gray-50">
                    Item
                  </th>
                  {propertyResults.map((pr) => (
                    <th
                      key={pr.id}
                      className="text-center px-3 py-3 font-semibold text-gray-600 min-w-[100px]"
                    >
                      <div>{pr.name || 'Unnamed'}</div>
                      <div className="text-xs font-normal text-gray-400">
                        {pr.stays} stay{pr.stays !== 1 ? 's' : ''}
                      </div>
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 font-bold text-primary-700 bg-primary-50 min-w-[80px]">
                    TOTAL
                  </th>
                  {hasPrices && (
                    <th className="text-center px-4 py-3 font-bold text-emerald-700 bg-emerald-50 min-w-[90px]">
                      EST. COST
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {activeItems.map((item, idx) => {
                  const total = grandTotals[item]?.total || 0
                  const cost = grandTotals[item]?.cost || 0
                  return (
                    <tr
                      key={item}
                      className={`border-b border-gray-100 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <td className="px-4 py-2.5 font-medium text-gray-700 sticky left-0 bg-inherit">
                        <span className="flex items-center gap-1.5">
                          {item}
                          {!DEFAULT_LINEN_ITEMS.includes(item) && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded shrink-0">Custom</span>
                          )}
                        </span>
                      </td>
                      {propertyResults.map((pr) => {
                        const result = pr.itemResults[item]
                        return (
                          <td key={pr.id} className="text-center px-3 py-2.5 text-gray-600">
                            {result?.withPar > 0 ? (
                              <span>
                                {result.withPar}
                                {parLevel > 1 && (
                                  <span className="text-xs text-gray-400 block">
                                    ({result.subtotal} base)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-center px-4 py-2.5 font-bold text-primary-700 bg-primary-50">
                        {total > 0 ? total : '-'}
                      </td>
                      {hasPrices && (
                        <td className="text-center px-4 py-2.5 font-medium text-emerald-700 bg-emerald-50">
                          {cost > 0 ? fmtCurrency(cost) : '-'}
                        </td>
                      )}
                    </tr>
                  )
                })}
                <tr className="bg-primary-50 border-t-2 border-primary-200 font-bold">
                  <td className="px-4 py-3 text-primary-800 sticky left-0 bg-primary-50">
                    TOTAL
                  </td>
                  {propertyResults.map((pr) => (
                    <td key={pr.id} className="text-center px-3 py-3 text-primary-700">
                      <div>{pr.propertyTotal.toLocaleString()}</div>
                      {hasPrices && pr.propertyCost > 0 && (
                        <div className="text-xs text-emerald-600 font-medium">
                          {fmtCurrency(pr.propertyCost)}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="text-center px-4 py-3 text-primary-800 text-lg">
                    {grandTotal.toLocaleString()}
                  </td>
                  {hasPrices && (
                    <td className="text-center px-4 py-3 text-emerald-800 text-lg bg-emerald-100">
                      {fmtCurrency(grandTotalCost)}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Grand totals summary table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-800 p-6 pb-3">
            Order Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Item</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Base Need</th>
                  {parLevel > 1 && (
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">
                      PAR ({parLevel}x)
                    </th>
                  )}
                  <th className="text-center px-4 py-3 font-bold text-primary-700 bg-primary-50">
                    Total Required
                  </th>
                  {hasPrices && (
                    <>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Unit Price</th>
                      <th className="text-center px-4 py-3 font-bold text-emerald-700 bg-emerald-50">
                        Est. Cost
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {activeItems
                  .filter((item) => grandTotals[item]?.total > 0)
                  .map((item, idx) => {
                    const cost = grandTotals[item]?.cost || 0
                    const price = unitPrices[item] || 0
                    return (
                      <tr
                        key={item}
                        className={`border-b border-gray-100 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-4 py-2.5 text-gray-500 text-xs uppercase">
                          {getCategoryForItem(item)}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-gray-700">
                          <span className="flex items-center gap-1.5">
                            {item}
                            {!DEFAULT_LINEN_ITEMS.includes(item) && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded shrink-0">Custom</span>
                            )}
                          </span>
                        </td>
                        <td className="text-center px-4 py-2.5 text-gray-600">
                          {grandTotals[item]?.totalBeforePar || 0}
                        </td>
                        {parLevel > 1 && (
                          <td className="text-center px-4 py-2.5 text-gray-500">x {parLevel}</td>
                        )}
                        <td className="text-center px-4 py-2.5 font-bold text-primary-700 bg-primary-50">
                          {grandTotals[item]?.total || 0}
                        </td>
                        {hasPrices && (
                          <>
                            <td className="text-center px-4 py-2.5 text-gray-500">
                              {price > 0 ? fmtCurrency(price) : '-'}
                            </td>
                            <td className="text-center px-4 py-2.5 font-medium text-emerald-700 bg-emerald-50">
                              {cost > 0 ? fmtCurrency(cost) : '-'}
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                <tr className="bg-primary-50 border-t-2 border-primary-200 font-bold">
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-primary-800">GRAND TOTAL</td>
                  <td className="text-center px-4 py-3 text-primary-700">
                    {grandTotalBeforePar.toLocaleString()}
                  </td>
                  {parLevel > 1 && <td className="text-center px-4 py-3 text-primary-700">x {parLevel}</td>}
                  <td className="text-center px-4 py-3 text-primary-800 text-lg bg-primary-100">
                    {grandTotal.toLocaleString()}
                  </td>
                  {hasPrices && (
                    <>
                      <td className="px-4 py-3" />
                      <td className="text-center px-4 py-3 text-emerald-800 text-lg bg-emerald-100">
                        {fmtCurrency(grandTotalCost)}
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-start no-print">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
        >
          <ChevronLeft size={20} />
          Back to Quantities
        </button>
      </div>
    </div>
  )
}
