class BarcodeScanner {
    constructor() {
        this.video = document.getElementById('scanner-view');
        this.scanButton = document.getElementById('scan-button');
        this.resultDiv = document.getElementById('scan-result');
        this.stream = null;
    }

    async init() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }
            });
            this.video.srcObject = this.stream;
            this.video.play();
            
            this.scanButton.addEventListener('click', () => this.scanBarcode());
        } catch (error) {
            console.error('Error initializing camera:', error);
            this.showError('Could not access camera');
        }
    }

    async scanBarcode() {
        // Mock barcode scanning - in production, use a library like QuaggaJS
        const mockBarcode = '123456789';
        await this.processBarcode(mockBarcode);
    }

    async processBarcode(barcode) {
        try {
            const response = await fetch(`/api/product/${barcode}`);
            const product = await response.json();
            
            this.showResult(`
                <div class="card">
                    <h3>${product.name}</h3>
                    <p>Base Price: $${product.basePrice}</p>
                    <p>Current Price: $${product.currentPrice}</p>
                </div>
            `);
        } catch (error) {
            console.error('Error processing barcode:', error);
            this.showError('Could not fetch product information');
        }
    }

    showResult(html) {
        this.resultDiv.innerHTML = html;
    }

    showError(message) {
        this.resultDiv.innerHTML = `
            <div class="card" style="background: var(--secondary);">
                <p style="color: white;">${message}</p>
            </div>
        `;
    }

    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const scanner = new BarcodeScanner();
    scanner.init();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => scanner.cleanup());
});
