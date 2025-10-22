// Calculator Logic
class RetirementCalculator {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.payCommissions = {
            7: { year: 2016, name: '7th CPC' },
            8: { year: 2026, name: '8th CPC' },
            9: { year: 2036, name: '9th CPC' },
            10: { year: 2046, name: '10th CPC' },
            11: { year: 2056, name: '11th CPC' }
        };
        this.results = [];
    }

    calculate() {
        // Get input values
        const basicPay = parseFloat(document.getElementById('basicPay').value) || 0;
        const currentDA = parseFloat(document.getElementById('currentDA').value) || 0;
        const retirementYear = parseInt(document.getElementById('retirementYear').value) || this.currentYear;
        const hraPercent = parseFloat(document.getElementById('hraPercent').value) || 0;
        const annualDAGrowth = parseFloat(document.getElementById('annualDAGrowth').value) || 0;
        const annualIncrement = parseFloat(document.getElementById('annualIncrement').value) || 0;
        
        // Get fitment factors
        const fitmentFactors = {
            8: parseFloat(document.getElementById('fitment8th').value) || 2.10,
            9: parseFloat(document.getElementById('fitment9th').value) || 2.10,
            10: parseFloat(document.getElementById('fitment10th').value) || 2.10,
            11: parseFloat(document.getElementById('fitment11th').value) || 2.10
        };

        // Clear previous results
        this.results = [];
        
        let currentBasicPay = basicPay;
        let currentDAPercent = currentDA;
        let currentCommission = 7;
        
        // Calculate for each year
        for (let year = this.currentYear; year <= retirementYear; year++) {
            // Check if this is a pay commission transition year
            const commissionKeys = Object.keys(this.payCommissions).map(Number);
            for (const commission of commissionKeys) {
                if (year === this.payCommissions[commission].year && commission > 7) {
                    // Apply fitment factor to basic pay only
                    const fitmentFactor = fitmentFactors[commission];
                    const oldBasicPay = currentBasicPay;
                    currentBasicPay = Math.round(currentBasicPay * fitmentFactor);
                    currentDAPercent = 0; // DA resets to 0
                    currentCommission = commission;
                    
                    // Add transition note
                    this.results.push({
                        year: year,
                        commission: `${this.payCommissions[commission].name} Transition`,
                        basicPay: currentBasicPay,
                        daPercent: 0,
                        daAmount: 0,
                        hraAmount: Math.round(currentBasicPay * hraPercent / 100),
                        grossSalary: Math.round(currentBasicPay * (1 + hraPercent / 100)),
                        isTransition: true,
                        fitmentFactor: fitmentFactor,
                        oldBasicPay: oldBasicPay
                    });
                    break;
                }
            }
            
            // Calculate salary components
            const daAmount = Math.round(currentBasicPay * currentDAPercent / 100);
            const hraAmount = Math.round(currentBasicPay * hraPercent / 100);
            const grossSalary = currentBasicPay + daAmount + hraAmount;
            
            // Add to results if not already added as transition
            if (!this.results.some(r => r.year === year && r.isTransition)) {
                this.results.push({
                    year: year,
                    commission: this.payCommissions[currentCommission].name,
                    basicPay: currentBasicPay,
                    daPercent: currentDAPercent,
                    daAmount: daAmount,
                    hraAmount: hraAmount,
                    grossSalary: grossSalary,
                    isTransition: false
                });
            }
            
            // Apply annual increments for next year (except in transition year)
            if (year < retirementYear) {
                // Apply 3% annual increment to basic pay
                currentBasicPay = Math.round(currentBasicPay * (1 + annualIncrement / 100));
                
                // Apply DA growth (except in transition year when DA is 0)
                if (currentDAPercent > 0 || (year + 1) > this.payCommissions[currentCommission].year) {
                    currentDAPercent += annualDAGrowth;
                }
            }
        }
        
        this.displayResults();
    }

    displayResults() {
        // Show results section
        document.getElementById('resultsSection').classList.remove('hidden');
        
        // Update summary cards
        const finalResult = this.results[this.results.length - 1];
        document.getElementById('finalBasicPay').textContent = `₹${finalResult.basicPay.toLocaleString()}`;
        document.getElementById('finalDAAmount').textContent = `₹${finalResult.daAmount.toLocaleString()}`;
        document.getElementById('finalGrossSalary').textContent = `₹${finalResult.grossSalary.toLocaleString()}`;
        
        // Create table
        const tableBody = document.getElementById('resultsTableBody');
        tableBody.innerHTML = '';
        
        this.results.forEach(result => {
            const row = document.createElement('tr');
            if (result.isTransition) {
                row.className = 'commission-transition';
            }
            
            row.innerHTML = `
                <td class="border border-gray-300 px-4 py-2">${result.year}</td>
                <td class="border border-gray-300 px-4 py-2">${result.commission}</td>
                <td class="border border-gray-300 px-4 py-2 text-right">₹${result.basicPay.toLocaleString()}</td>
                <td class="border border-gray-300 px-4 py-2 text-right">${result.daPercent.toFixed(1)}%</td>
                <td class="border border-gray-300 px-4 py-2 text-right">₹${result.daAmount.toLocaleString()}</td>
                <td class="border border-gray-300 px-4 py-2 text-right">₹${result.hraAmount.toLocaleString()}</td>
                <td class="border border-gray-300 px-4 py-2 text-right font-semibold">₹${result.grossSalary.toLocaleString()}</td>
            `;
            
            tableBody.appendChild(row);
            
            // Add transition note if applicable
            if (result.isTransition) {
                const noteRow = document.createElement('tr');
                noteRow.className = 'bg-yellow-50';
                noteRow.innerHTML = `
                    <td colspan="7" class="border border-gray-300 px-4 py-2 text-sm text-yellow-700 italic">
                        <strong>Note:</strong> Fitment factor applied: ₹${result.oldBasicPay.toLocaleString()} × ${result.fitmentFactor} = ₹${result.basicPay.toLocaleString()}. DA has been reset to 0% after pay commission transition.
                    </td>
                `;
                tableBody.appendChild(noteRow);
            }
        });
        
        // Create chart
        this.createChart();
        
        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    }

    createChart() {
        const years = this.results.map(r => r.year);
        const basicPay = this.results.map(r => r.basicPay);
        const grossSalary = this.results.map(r => r.grossSalary);
        
        const trace1 = {
            x: years,
            y: basicPay,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Basic Pay',
            line: { color: '#2563eb', width: 3 },
            marker: { size: 6 }
        };
        
        const trace2 = {
            x: years,
            y: grossSalary,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Gross Salary',
            line: { color: '#10b981', width: 3 },
            marker: { size: 6 }
        };
        
        const layout = {
            title: {
                text: 'Salary Progression Over Time',
                font: { size: 18, family: 'Poppins' }
            },
            xaxis: {
                title: 'Year',
                gridcolor: '#e5e7eb'
            },
            yaxis: {
                title: 'Salary (₹)',
                gridcolor: '#e5e7eb',
                tickformat: '₹,.0f'
            },
            plot_bgcolor: '#f9fafb',
            paper_bgcolor: '#ffffff',
            font: { family: 'Inter' },
            legend: {
                x: 0.02,
                y: 0.98,
                bgcolor: 'rgba(255,255,255,0.8)'
            },
            margin: { t: 60, r: 30, b: 60, l: 80 }
        };
        
        Plotly.newPlot('salaryChart', [trace1, trace2], layout, {responsive: true});
    }

    downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.text('Government Employee Retirement Salary Calculation', 20, 30);
        
        // Date
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
        
        // Input parameters
        doc.setFontSize(14);
        doc.text('Input Parameters:', 20, 60);
        doc.setFontSize(10);
        doc.text(`Current Basic Pay: ₹${document.getElementById('basicPay').value}`, 20, 75);
        doc.text(`Current DA: ${document.getElementById('currentDA').value}%`, 20, 85);
        doc.text(`Retirement Year: ${document.getElementById('retirementYear').value}`, 20, 95);
        doc.text(`HRA: ${document.getElementById('hraPercent').value}%`, 20, 105);
        
        // Results summary
        const finalResult = this.results[this.results.length - 1];
        doc.setFontSize(14);
        doc.text('Final Results:', 20, 125);
        doc.setFontSize(10);
        doc.text(`Basic Pay: ₹${finalResult.basicPay.toLocaleString()}`, 20, 140);
        doc.text(`DA Amount: ₹${finalResult.daAmount.toLocaleString()}`, 20, 150);
        doc.text(`Gross Salary: ₹${finalResult.grossSalary.toLocaleString()}`, 20, 160);
        
        // Disclaimer
        doc.setFontSize(8);
        doc.text('Disclaimer: This calculator provides estimates only. Actual salary depends on future government policies.', 20, 280);
        
        doc.save('retirement-salary-calculation.pdf');
    }
}

// Initialize calculator
const calculator = new RetirementCalculator();

// Event listeners
document.getElementById('calculateBtn').addEventListener('click', () => {
    if (validateInputs()) {
        calculator.calculate();
    }
});

document.getElementById('downloadPDF').addEventListener('click', () => {
    calculator.downloadPDF();
});

// Input validation
function validateInputs() {
    const basicPay = parseFloat(document.getElementById('basicPay').value);
    const currentDA = parseFloat(document.getElementById('currentDA').value);
    const retirementYear = parseInt(document.getElementById('retirementYear').value);
    
    if (!basicPay || basicPay <= 0) {
        alert('Please enter a valid basic pay amount');
        return false;
    }
    
    if (currentDA < 0 || currentDA > 100) {
        alert('DA percentage should be between 0 and 100');
        return false;
    }
    
    if (retirementYear < new Date().getFullYear() || retirementYear > 2070) {
        alert('Please enter a valid retirement year');
        return false;
    }
    
    return true;
}

// Real-time calculation on input change
['basicPay', 'currentDA', 'retirementYear', 'hraPercent', 'annualDAGrowth', 'annualIncrement', 'fitment8th', 'fitment9th', 'fitment10th', 'fitment11th'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('input', () => {
            // Only calculate if all required fields have values
            const basicPay = document.getElementById('basicPay').value;
            const currentDA = document.getElementById('currentDA').value;
            const retirementYear = document.getElementById('retirementYear').value;
            
            if (basicPay && currentDA && retirementYear) {
                if (validateInputs()) {
                    calculator.calculate();
                }
            }
        });
    }
});