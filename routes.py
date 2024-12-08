from flask import render_template, redirect, url_for, flash, jsonify, request
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import exc as sqlalchemy
from app import app, db
from models import User
from forms import LoginForm, RegistrationForm
import logging

logging.basicConfig(level=logging.DEBUG)

def create_test_account():
    with app.app_context():
        if not User.query.filter_by(username='test').first():
            test_user = User(username='test')
            test_user.set_password('test123')
            db.session.add(test_user)
            db.session.commit()
            logging.info('Created test account')

# Create test account on startup
create_test_account()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and user.check_password(form.password.data):
            login_user(user)
            flash('Logged in successfully!', 'success')
            return redirect(url_for('index'))
        flash('Invalid username or password', 'error')
    
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data)
        user.set_password(form.password.data)
        try:
            db.session.add(user)
            db.session.commit()
            flash('Registration successful! Please login.', 'success')
            logging.info(f'User registered successfully: {user.username}')
            return redirect(url_for('login'))
        except sqlalchemy.exc.OperationalError as e:
            db.session.rollback()
            flash('Database connection error. Please try again later.', 'error')
            logging.error(f'Database connection error during registration: {str(e)}')
        except sqlalchemy.exc.IntegrityError as e:
            db.session.rollback()
            flash('Username already exists. Please choose a different username.', 'error')
            logging.error(f'IntegrityError during registration: {str(e)}')
        except Exception as e:
            db.session.rollback()
            flash('An unexpected error occurred. Please try again later.', 'error')
            logging.error(f'Unexpected error during registration: {str(e)}')
    
    return render_template('register.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Logged out successfully', 'success')
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
        # Handle saving settings
        return jsonify({'success': True})
    else:
        # Return current settings
        return jsonify({
            'host': '',
            'database': '',
            'username': '',
            'password': ''
        })

@app.route('/api/test-connection')
@login_required
def test_connection():
    # Mock connection test
    return jsonify({'success': True})

@app.route('/api/product/<barcode>')
@login_required
def get_product(barcode):
    # Mock product data
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
