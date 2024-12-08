from flask import render_template, redirect, url_for, flash, jsonify, request
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from app import app, db
from models import User
from forms import LoginForm
import logging

logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        
        if user and check_password_hash(user.password_hash, form.password.data):
            login_user(user)
            return redirect(url_for('index'))
        
        flash('Invalid username or password', 'error')
    
    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/scan')
@login_required
def scan():
    return render_template('scan.html')

@app.route('/settings')
@login_required
def settings():
    return render_template('settings.html')

@app.route('/api/settings', methods=['GET', 'POST'])
@login_required
def handle_settings():
    if request.method == 'POST':
        # In a real implementation, encrypt and store credentials securely
        data = request.get_json()
        # Store settings in database or secure storage
        return jsonify({'success': True})
    
    # Return saved settings
    return jsonify({
        'host': '',
        'database': '',
        'username': '',
        'password': ''
    })

@app.route('/api/test-connection')
@login_required
def test_connection():
    # Mock implementation - replace with actual database connection test
    return jsonify({'success': True})

@app.route('/api/product/<barcode>')
@login_required
def get_product(barcode):
    # Mock product data - replace with actual database query
    return jsonify({
        'name': 'Sample Product',
        'basePrice': 9.99,
        'currentPrice': 7.99
    })

@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('500.html'), 500
