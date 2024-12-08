class SettingsManager {
  constructor() {
    this.form = document.getElementById('settings-form');
    this.testButton = document.getElementById('test-connection');
    this.statusDiv = document.getElementById('connection-status');
  }

  init() {
    this.form.addEventListener('submit', (e) => this.saveSettings(e));
    this.testButton.addEventListener('click', () => this.testConnection());
    this.loadSavedSettings();
  }

  async saveSettings(e) {
    e.preventDefault();
    
    const formData = new FormData(this.form);
    const settings = {
      host: formData.get('host'),
      database: formData.get('database'),
      username: formData.get('username'),
      password: formData.get('password')
    };

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        this.showStatus('Settings saved successfully', 'success');
      } else {
        this.showStatus('Failed to save settings', 'error');
      }
    } catch (error) {
      this.showStatus('Error saving settings', 'error');
    }
  }

  async testConnection() {
    this.showStatus('Testing connection...', 'info');
    
    try {
      const response = await fetch('/api/test-connection');
      const result = await response.json();
      
      if (result.success) {
        this.showStatus('Connection successful!', 'success');
      } else {
        this.showStatus('Connection failed', 'error');
      }
    } catch (error) {
      this.showStatus('Connection test failed', 'error');
    }
  }

  async loadSavedSettings() {
    try {
      const response = await fetch('/api/settings');
      const settings = await response.json();
      
      Object.keys(settings).forEach(key => {
        const input = this.form.querySelector(`[name="${key}"]`);
        if (input) input.value = settings[key];
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  showStatus(message, type) {
    const colors = {
      success: 'var(--primary)',
      error: 'var(--secondary)',
      info: 'var(--rds-blue)'
    };

    this.statusDiv.innerHTML = `
      <div class="card" style="background: ${colors[type]};">
        <p style="color: white;">${message}</p>
      </div>
    `;

    setTimeout(() => {
      this.statusDiv.innerHTML = '';
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const settings = new SettingsManager();
  settings.init();
});
