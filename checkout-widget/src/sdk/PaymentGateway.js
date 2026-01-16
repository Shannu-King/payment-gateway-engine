class PaymentGateway {
  constructor(options) {
    this.key = options.key;
    this.orderId = options.orderId;
    this.onSuccess = options.onSuccess;
    this.onFailure = options.onFailure;
  }

  open() {
    // 1. Create Modal Container
    const modal = document.createElement('div');
    modal.id = 'payment-gateway-modal';
    modal.setAttribute('data-test-id', 'payment-modal');
    modal.innerHTML = `
      <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:9999;">
        <div style="background:white;padding:20px;border-radius:8px;position:relative;width:400px;height:500px;">
          <button data-test-id="close-modal-button" style="position:absolute;top:10px;right:10px;">×</button>
          <iframe 
            data-test-id="payment-iframe"
            src="http://localhost:3001/checkout?order_id=${this.orderId}&embedded=true" 
            style="width:100%;height:100%;border:none;">
          </iframe>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 2. Listen for close button
    modal.querySelector('[data-test-id="close-modal-button"]').onclick = () => {
      document.body.removeChild(modal);
    };

    // 3. Listen for PostMessage from Iframe
    window.addEventListener('message', (event) => {
      if (event.data.type === 'payment_success') {
        this.onSuccess(event.data.data);
        document.body.removeChild(modal);
      } else if (event.data.type === 'payment_failed') {
        this.onFailure(event.data.data);
      }
    });
  }
}

window.PaymentGateway = PaymentGateway;