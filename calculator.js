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
        
        // Add event listener for retirement year to show/hide fitment factors
        this.setupRetirementYearListener();
    }

    setupRetirementYearListener() {
        const retirementYearInput = document.getElementById('retirementYear');
        if (retirementYearInput) {
            retirementYearInput.addEventListener('input', () => {
                this.updateVisibleFitmentFactors();
            });
            retirementYearInput.addEventListener('change', () => {
                this.updateVisibleFitmentFactors();
            });
        }
    }

    updateVisibleFitmentFactors() {
        const retirementYear = parseInt(document.getElementById('retirementYear').value);
        
        // If no valid retirement year, hide all fitment factors
        if (!retirementYear || isNaN(retirementYear)) {
            this.hideFitmentFactor('fitment8thContainer');
            this.hideFitmentFactor('fitment9thContainer');
            this.hideFitmentFactor('fitment10thContainer');
            this.hideFitmentFactor('fitment11thContainer');
            return;
        }

        // Always show 8th Pay Commission (2026) to all users
        this.showFitmentFactor('fitment8thContainer');

        // Show 9th CPC (2036) if retirement year is 2036 or later
        if (retirementYear >= 2036) {
            this.showFitmentFactor('fitment9thContainer');
        } else {
            this.hideFitmentFactor('fitment9thContainer');
        }

        // Show 10th CPC (2046) if retirement year is 2046 or later
        if (retirementYear >= 2046) {
            this.showFitmentFactor('fitment10thContainer');
        } else {
            this.hideFitmentFactor('fitment10thContainer');
        }

        // Show 11th CPC (2056) if retirement year is 2056 or later
        if (retirementYear >= 2056) {
            this.showFitmentFactor('fitment11thContainer');
        } else {
            this.hideFitmentFactor('fitment11thContainer');
        }
    }

    showFitmentFactor(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.remove('hidden');
            container.style.display = 'block';
        }
    }

    hideFitmentFactor(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.classList.add('hidden');
            container.style.display = 'none';
        }
    }

    calculate() {
        // Get input values
        const basicPay = parseFloat(document.getElementById('basicPay').value) || 0;
        const currentDA = parseFloat(document.getElementById('currentDA').value) || 0;
        const retirementYear = parseInt(document.getElementById('retirementYear').value) || this.currentYear;
        const hraPercent = parseFloat(document.getElementById('hraPercent').value) || 0;
        const annualDAGrowth = parseFloat(document.getElementById('annualDAGrowth').value) || 0;
        const annualIncrement = parseFloat(document.getElementById('annualIncrement').value) || 0;
        
        // Get fitment factors - only use those relevant to retirement year
        const fitmentFactors = {
            8: parseFloat(document.getElementById('fitment8th').value) || 2.10,
            9: retirementYear >= 2036 ? (parseFloat(document.getElementById('fitment9th').value) || 2.10) : null,
            10: retirementYear >= 2046 ? (parseFloat(document.getElementById('fitment10th').value) || 2.10) : null,
            11: retirementYear >= 2056 ? (parseFloat(document.getElementById('fitment11th').value) || 2.10) : null
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
                    // Only apply fitment if it's relevant to retirement year
                    if (fitmentFactors[commission] !== null) {
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
        
        // Show "View Results" button
        const viewResultsBtn = document.getElementById('viewResultsBtn');
        if (viewResultsBtn) {
            viewResultsBtn.classList.remove('hidden');
        }
        
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

// ===== VALIDATION FUNCTIONS =====

// Clear all validation errors
function clearValidationErrors() {
    // Hide error message container
    const errorContainer = document.getElementById('validationErrors');
    if (errorContainer) {
        errorContainer.classList.add('hidden');
        errorContainer.innerHTML = '';
    }
    
    // Remove red borders from all input fields
    const allInputs = document.querySelectorAll('input[type="number"], input[type="text"]');
    allInputs.forEach(input => {
        input.classList.remove('border-red-500', 'border-2');
        input.classList.add('border-gray-300');
    });
}

// Show validation error for specific field
function showFieldError(fieldId, errorMessage) {
    const field = document.getElementById(fieldId);
    if (field) {
        // Add red border to invalid field
        field.classList.remove('border-gray-300');
        field.classList.add('border-red-500', 'border-2');
        
        // Set aria-invalid for accessibility
        field.setAttribute('aria-invalid', 'true');
    }
    
    // Add error to container
    const errorContainer = document.getElementById('validationErrors');
    if (errorContainer) {
        errorContainer.classList.remove('hidden');
        const errorItem = document.createElement('li');
        errorItem.textContent = errorMessage;
        errorContainer.appendChild(errorItem);
    }
}

// Validate inputs (called ONLY on Calculate button click)
function validateInputs() {
    // Clear previous errors
    clearValidationErrors();
    
    let isValid = true;
    const errors = [];
    
    // Get values
    const basicPay = parseFloat(document.getElementById('basicPay').value);
    const currentDA = parseFloat(document.getElementById('currentDA').value);
    const retirementYear = parseInt(document.getElementById('retirementYear').value);
    const hraPercent = parseFloat(document.getElementById('hraPercent').value);
    const annualDAGrowth = parseFloat(document.getElementById('annualDAGrowth').value);
    const annualIncrement = parseFloat(document.getElementById('annualIncrement').value);
    
    // Validate Basic Pay
    if (!basicPay || isNaN(basicPay) || basicPay <= 0) {
        showFieldError('basicPay', 'Please enter a valid basic pay amount (must be greater than 0)');
        isValid = false;
    }
    
    // Validate Current DA
    if (isNaN(currentDA) || currentDA < 0 || currentDA > 100) {
        showFieldError('currentDA', 'DA percentage must be between 0 and 100');
        isValid = false;
    }
    
    // Validate Retirement Year
    const currentYear = new Date().getFullYear();
    if (isNaN(retirementYear) || retirementYear < currentYear || retirementYear > 2070) {
        showFieldError('retirementYear', `Retirement year must be between ${currentYear} and 2070`);
        isValid = false;
    }
    
    // Validate HRA Percent
    if (isNaN(hraPercent) || hraPercent < 0 || hraPercent > 100) {
        showFieldError('hraPercent', 'HRA percentage must be between 0 and 100');
        isValid = false;
    }
    
    // Validate Annual DA Growth
    if (isNaN(annualDAGrowth) || annualDAGrowth < 0 || annualDAGrowth > 50) {
        showFieldError('annualDAGrowth', 'Annual DA growth must be between 0 and 50');
        isValid = false;
    }
    
    // Validate Annual Increment
    if (isNaN(annualIncrement) || annualIncrement < 0 || annualIncrement > 20) {
        showFieldError('annualIncrement', 'Annual increment must be between 0 and 20');
        isValid = false;
    }
    
    // Validate visible fitment factors
    if (retirementYear >= 2026) {
        const fitment8th = parseFloat(document.getElementById('fitment8th').value);
        if (isNaN(fitment8th) || fitment8th <= 0 || fitment8th > 5) {
            showFieldError('fitment8th', '8th CPC fitment factor must be between 0 and 5');
            isValid = false;
        }
    }
    
    if (retirementYear >= 2036) {
        const fitment9th = parseFloat(document.getElementById('fitment9th').value);
        if (isNaN(fitment9th) || fitment9th <= 0 || fitment9th > 5) {
            showFieldError('fitment9th', '9th CPC fitment factor must be between 0 and 5');
            isValid = false;
        }
    }
    
    if (retirementYear >= 2046) {
        const fitment10th = parseFloat(document.getElementById('fitment10th').value);
        if (isNaN(fitment10th) || fitment10th <= 0 || fitment10th > 5) {
            showFieldError('fitment10th', '10th CPC fitment factor must be between 0 and 5');
            isValid = false;
        }
    }
    
    if (retirementYear >= 2056) {
        const fitment11th = parseFloat(document.getElementById('fitment11th').value);
        if (isNaN(fitment11th) || fitment11th <= 0 || fitment11th > 5) {
            showFieldError('fitment11th', '11th CPC fitment factor must be between 0 and 5');
            isValid = false;
        }
    }
    
    // If errors exist, scroll to error message smoothly
    if (!isValid) {
        const errorContainer = document.getElementById('validationErrors');
        if (errorContainer) {
            errorContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    return isValid;
}

// ===== EVENT LISTENERS =====

// Calculate button - ONLY validation trigger
document.getElementById('calculateBtn').addEventListener('click', () => {
    if (validateInputs()) {
        calculator.calculate();
    }
});

// Download PDF button
document.getElementById('downloadPDF').addEventListener('click', () => {
    calculator.downloadPDF();
});

// Optional: "View Results" button for user-controlled scrolling
const viewResultsBtn = document.getElementById('viewResultsBtn');
if (viewResultsBtn) {
    viewResultsBtn.addEventListener('click', () => {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}
