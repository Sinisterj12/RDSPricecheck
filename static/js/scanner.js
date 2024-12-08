class BarcodeScanner {
    constructor() {
        this.video = document.getElementById('scanner-view');
        this.scanButton = document.getElementById('scan-button');
        this.resultDiv = document.getElementById('scan-result');
        this.stream = null;
        this.isScanning = false;
    }

    async init() {
        try {
            // Check for camera permissions
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            this.video.srcObject = this.stream;
            await this.video.play();
            
            // Initialize Quagga
            await this.initQuagga();
            
            this.scanButton.addEventListener('click', () => this.toggleScanning());
            
            // Handle orientation changes
            window.addEventListener('orientationchange', () => this.handleOrientation());
            this.handleOrientation();
        } catch (error) {
            console.error('Error initializing camera:', error);
            this.showError(error.name === 'NotAllowedError' 
                ? 'Camera access denied. Please grant permission.' 
                : 'Could not access camera');
        }
    }

    async initQuagga() {
        const constraints = {
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: this.video,
                constraints: {
                    facingMode: "environment"
                },
            },
            decoder: {
                readers: [
                    "ean_reader",
                    "ean_8_reader",
                    "upc_reader",
                    "upc_e_reader"
                ]
            }
        };

        try {
            await Quagga.init(constraints);
            Quagga.onDetected(this.onBarcodeDetected.bind(this));
            console.log("Quagga initialization succeeded");
        } catch (err) {
            console.error("Quagga initialization failed", err);
            this.showError('Failed to initialize barcode scanner');
        }
    }

    toggleScanning() {
        if (this.isScanning) {
            this.stopScanning();
            this.scanButton.textContent = 'Start Scanning';
        } else {
            this.startScanning();
            this.scanButton.textContent = 'Stop Scanning';
        }
    }

    startScanning() {
        if (!this.isScanning) {
            this.isScanning = true;
            this.showLoading();
            Quagga.start();
            this.processFrame();
        }
    }

    stopScanning() {
        if (this.isScanning) {
            this.isScanning = false;
            Quagga.stop();
            this.hideLoading();
        }
    }

    processFrame() {
        if (this.isScanning) {
            // Use requestAnimationFrame for smooth performance
            requestAnimationFrame(() => this.processFrame());
        }
    }

    async onBarcodeDetected(result) {
        if (!result || !result.codeResult || !this.isScanning) return;
        
        const code = result.codeResult.code;
        if (!code) return;

        // Temporarily stop scanning while processing
        this.stopScanning();
        await this.processBarcode(code);
    }

    async processBarcode(barcode) {
        try {
            const response = await fetch(`/api/product/${barcode}`);
            if (!response.ok) throw new Error('Product not found');
            
            const product = await response.json();
            this.showResult(`
                <div class="card">
                    <h3>${product.name}</h3>
                    <p>Barcode: ${barcode}</p>
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

    showLoading() {
        this.resultDiv.innerHTML = `
            <div class="card">
                <div class="spinner"></div>
                <p class="text-center">Scanning...</p>
            </div>
        `;
    }

    hideLoading() {
        this.resultDiv.innerHTML = '';
    }

    handleOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        const scannerContainer = document.querySelector('.scanner-container');
        
        if (isPortrait) {
            scannerContainer.style.height = '40vh';
        } else {
            scannerContainer.style.height = '60vh';
        }
    }

    cleanup() {
        this.stopScanning();
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        Quagga.offDetected(this.onBarcodeDetected);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const scanner = new BarcodeScanner();
    scanner.init();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => scanner.cleanup());
});
